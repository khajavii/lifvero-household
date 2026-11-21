// Run against a test deployment with TWO fresh account tokens. Leaves rows in the test DB.
import assert from 'node:assert/strict';

function env(name) {
  if (!process.env[name]) throw new Error(`Missing ${name}`);
  return process.env[name];
}
const base = env('INVENTORY_API_BASE_URL').replace(/\/+$/, '');
const accountA = env('INVENTORY_TEST_ACCOUNT_A');
const accountB = env('INVENTORY_TEST_ACCOUNT_B');
assert.notEqual(accountA, accountB);

async function request(path, { token, body, expected = 200 } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body) headers['Content-Type'] = 'application/json';
  const res = await fetch(`${base}/inventory/${path}`, {
    headers, method: body ? 'POST' : 'GET', body: body && JSON.stringify(body),
  });
  assert.equal(res.status, expected, `${path}: unexpected HTTP status`);
  const json = await res.json();
  assert.equal(json.status, expected);
  assert.equal(json[expected < 400 ? 'success' : 'error'], true);
  return json.data;
}

const [categories, rooms, warranties] = await Promise.all(['categories', 'rooms', 'warranties'].map((p) => request(p)));
for (const rows of [categories, rooms, warranties]) assert.ok(rows.length > 0, 'Seed lookups before testing');
await request('items', { expected: 401 });
if (process.env.INVENTORY_TEST_GUEST) await request('items', { token: process.env.INVENTORY_TEST_GUEST, expected: 403 });

const a = { token: accountA };
const b = { token: accountB };
for (const account of [a, b]) {
  assert.deepEqual(await request('items', account), { items: [], nextOffset: null });
  const summary = await request('summary', account);
  assert.deepEqual([summary.totalItems, summary.totalValue, summary.categories, summary.rooms, summary.valuedItems], [0, '0.00', 0, 0, 0]);
}

const body = { itemName: 'Smoke test item', categoryCode: categories[0].code, roomCode: rooms[0].code, warrantyCode: warranties[0].code, purchaseDate: '2026-01-20' };
await request('items', { ...a, body: { ...body, categoryCode: '!missing-smoke-test-code!' }, expected: 400 });
await request('items', { ...a, body: { ...body, purchaseDate: '2026-02-30' }, expected: 400 });
const [first, second] = await Promise.all([
  request('items', { ...a, body: { ...body, purchaseAmount: '19.99' }, expected: 201 }),
  request('items', { ...a, body, expected: 201 }),
]);
assert.notEqual(first.id, second.id);
assert.equal(first.householdId, second.householdId);
assert.equal(first.purchaseAmount, '19.99');
assert.equal(second.purchaseAmount, null);
const summary = await request('summary', a);
assert.deepEqual([summary.totalItems, summary.totalValue, summary.categories, summary.rooms, summary.valuedItems, summary.currency], [2, '19.99', 1, 1, 1, first.currency]);
const page1 = await request('items?limit=1', a);
const page2 = await request(`items?limit=1&offset=${page1.nextOffset}`, a);
assert.equal(page1.nextOffset, 1);
assert.equal(page2.nextOffset, null);
assert.deepEqual(new Set([...page1.items, ...page2.items].map(({ id }) => id)), new Set([first.id, second.id]));
assert.deepEqual(await request('items', b), { items: [], nextOffset: null });
assert.equal((await request('summary', b)).totalItems, 0);
const other = await request('items', { ...b, body, expected: 201 });
assert.notEqual(other.householdId, first.householdId);
assert.deepEqual((await request('items', b)).items.map(({ id }) => id), [other.id]);
assert.equal((await request('summary', a)).totalItems, 2);
console.log('Inventory API smoke checks passed');
