// Browser integration. Keep the draft in component state until save succeeds.
export function createInventoryClient({ authBaseUrl, inventoryBaseUrl, readAccountToken, fetchImpl = globalThis.fetch }) {
  function required(value, name) {
    if (typeof value !== 'string' || !value.trim()) throw new TypeError(`${name} is required`);
    return value.trim();
  }
  const auth = required(authBaseUrl, 'authBaseUrl').replace(/\/+$/, '');
  const inventory = required(inventoryBaseUrl, 'inventoryBaseUrl').replace(/\/+$/, '');
  if (typeof readAccountToken !== 'function') throw new TypeError('readAccountToken is required');

  async function request(base, path, { body, token, signal } = {}) {
    const headers = { Accept: 'application/json' };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (token) headers.Authorization = `Bearer ${token}`;
    const response = await fetchImpl(`${base}${path}`, {
      method: body === undefined ? 'GET' : 'POST', headers, signal,
      body: body === undefined ? undefined : JSON.stringify(body),
      redirect: 'error',
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok || payload?.error === true || payload?.success === false) {
      const error = new Error(typeof payload?.message === 'string' ? payload.message : `Request failed (${response.status})`);
      error.status = response.status;
      throw error;
    }
    if (!payload) throw new Error('Expected a JSON response');
    return payload;
  }

  async function submit(item, { accountToken, email, signal } = {}) {
    if (accountToken) return { status: 'saved', item: await save(item, accountToken, signal) };
    const address = required(email, 'Email');
    const response = await request(auth, '/auth/login-or-register', { body: { email: address }, signal });
    const token = readAccountToken(response);
    return token
      ? { status: 'saved', item: await save(item, token, signal), accountToken: token }
      : { status: 'verification-required', email: address };
  }

  async function verifyAndSave(item, { email, code, signal }) {
    const response = await request(auth, '/auth/verify-code', {
      body: { email: required(email, 'Email'), code: required(code, 'Code') }, signal,
    });
    const token = required(readAccountToken(response), 'Account access token from Auth');
    return { status: 'saved', item: await save(item, token, signal), accountToken: token };
  }

  async function save(item, token, signal) {
    return (await request(inventory, '/inventory/items', { body: item, token, signal })).data;
  }

  return {
    submit, verifyAndSave,
    async lookups(signal) {
      const [categories, rooms, warranties] = await Promise.all(
        ['categories', 'rooms', 'warranties'].map((part) => request(inventory, `/inventory/${part}`, { signal })),
      );
      return { categories: categories.data, rooms: rooms.data, warranties: warranties.data };
    },
    async items(accountToken, { limit, offset, signal } = {}) {
      const query = new URLSearchParams();
      if (limit !== undefined) query.set('limit', String(limit));
      if (offset !== undefined) query.set('offset', String(offset));
      return (await request(inventory, `/inventory/items${query.size ? `?${query}` : ''}`, {
        token: required(accountToken, 'Account access token'), signal,
      })).data;
    },
    async summary(accountToken, signal) {
      return (await request(inventory, '/inventory/summary', {
        token: required(accountToken, 'Account access token'), signal,
      })).data;
    },
  };
}
