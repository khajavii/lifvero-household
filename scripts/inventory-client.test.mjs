import assert from 'node:assert/strict';
import test from 'node:test';
import { createInventoryClient } from '../examples/inventory-client.mjs';

function fixture(authPayload = {}) {
  const calls = [];
  const client = createInventoryClient({
    authBaseUrl: 'https://auth.example.test', inventoryBaseUrl: 'https://inventory.example.test',
    readAccountToken: (response) => response.access_token,
    fetchImpl: async (url, options) => {
      calls.push({ url, headers: options.headers, body: options.body && JSON.parse(options.body) });
      if (url.endsWith('login-or-register')) return Response.json(authPayload);
      if (url.endsWith('verify-code')) return Response.json({ access_token: 'verified' });
      return Response.json({ success: true, data: { id: 'saved-item' } });
    },
  });
  return { client, calls };
}
const draft = { itemName: 'Vacuum', roomCode: 'room', categoryCode: 'category', purchaseDate: '2026-01-20', warrantyCode: 'option' };

test('existing account sends only the item and its bearer token to Inventory', async () => {
  const { client, calls } = fixture();
  assert.equal((await client.submit(draft, { accountToken: 'existing' })).status, 'saved');
  assert.deepEqual(calls.map(({ url, body, headers }) => [url, body, headers.Authorization]), [
    ['https://inventory.example.test/inventory/items', draft, 'Bearer existing'],
  ]);
});

test('signed-out user needs email; an OTP challenge does not call Inventory', async () => {
  const { client, calls } = fixture();
  await assert.rejects(client.submit(draft), /Email is required/);
  assert.deepEqual(await client.submit(draft, { email: 'user@example.test' }), { status: 'verification-required', email: 'user@example.test' });
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0].body, { email: 'user@example.test' });
  await client.verifyAndSave(draft, { email: 'user@example.test', code: '012345' });
  assert.deepEqual(calls[1].body, { email: 'user@example.test', code: '012345' });
  assert.equal(calls[2].headers.Authorization, 'Bearer verified');
  assert.deepEqual(calls[2].body, draft);
});

test('account token supplied by the Auth response is forwarded to Inventory', async () => {
  const { client, calls } = fixture({ access_token: 'returned' });
  await client.submit(draft, { email: 'user@example.test' });
  assert.equal(calls[1].headers.Authorization, 'Bearer returned');
  assert.deepEqual(calls[1].body, draft);
});
