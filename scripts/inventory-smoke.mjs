/**
 * Smoke test script executing live HTTP requests against the inventory service.
 *
 * Validates cross-user isolation, automatic household provisioning, validation error handling,
 * and summary calculation across two separate account tokens.
 */
import assert from 'node:assert/strict';

/**
 * Reads an environment variable or throws a descriptive error if missing.
 *
 * @param name - The name of the environment variable.
 * @returns The resolved environment variable value.
 * @throws Error When the environment variable is not defined.
 */
function env(name) {
  if (!process.env[name]) throw new Error(`Missing ${name}`);
  return process.env[name];
}
const base = env('INVENTORY_API_BASE_URL').replace(/\/+$/, '');
const accountA = env('INVENTORY_TEST_ACCOUNT_A');
const accountB = env('INVENTORY_TEST_ACCOUNT_B');
assert.notEqual(accountA, accountB);

/**
 * Sends an HTTP request to the inventory API and asserts the returned status.
 *
 * @param path - Relative inventory endpoint path.
 * @param options - Request options including token, body, and expected HTTP status.
 * @returns Parsed response data payload.
 */
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
  const res = await request('items', account);
  assert.deepEqual(res.result !== undefined ? res.result : res.items, []);
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
const items1 = page1.result ?? page1.items;
const page2 = await request(`items?limit=1&page=2`, a);
const items2 = page2.result ?? page2.items;
assert.deepEqual(new Set([...items1, ...items2].map(({ id }) => id)), new Set([first.id, second.id]));
const bRes = await request('items', b);
assert.deepEqual(bRes.result ?? bRes.items, []);
assert.equal((await request('summary', b)).totalItems, 0);
const other = await request('items', { ...b, body, expected: 201 });
assert.notEqual(other.householdId, first.householdId);
assert.deepEqual(((await request('items', b)).result ?? (await request('items', b)).items).map(({ id }) => id), [other.id]);
assert.equal((await request('summary', a)).totalItems, 2);
console.log('Inventory API smoke checks passed');
