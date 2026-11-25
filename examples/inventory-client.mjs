/**
 * Creates an inventory HTTP client for browser or Node.js environments.
 *
 * Provides methods for submitting inventory items, verifying authentication,
 * retrieving lookup lists, querying paginated inventory items, and fetching summaries.
 *
 * @param options - Configuration options for the inventory client.
 * @param options.authBaseUrl - Base URL of the authentication service.
 * @param options.inventoryBaseUrl - Base URL of the inventory service.
 * @param options.readAccountToken - Callback function to extract the access token from an auth response.
 * @param options.fetchImpl - Custom fetch implementation (defaults to globalThis.fetch).
 * @returns Client object with helper methods.
 */
export function createInventoryClient({ authBaseUrl, inventoryBaseUrl, readAccountToken, fetchImpl = globalThis.fetch }) {
  /**
   * Asserts that a value is a non-empty string and trims it.
   *
   * @param value - Target value to validate.
   * @param name - Property name for error messages.
   * @returns Trimmed string.
   */
  function required(value, name) {
    if (typeof value !== 'string' || !value.trim()) throw new TypeError(`${name} is required`);
    return value.trim();
  }
  const auth = required(authBaseUrl, 'authBaseUrl').replace(/\/+$/, '');
  const inventory = required(inventoryBaseUrl, 'inventoryBaseUrl').replace(/\/+$/, '');
  if (typeof readAccountToken !== 'function') throw new TypeError('readAccountToken is required');

  /**
   * Executes an HTTP request against a specified service base.
   *
   * @param base - Base URL string.
   * @param path - Endpoint path.
   * @param options - Request options including body, token, and abort signal.
   * @returns Parsed JSON response payload.
   */
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

  /**
   * Submits an inventory item, automatically attempting login if no token is provided.
   *
   * @param item - Inventory item creation data.
   * @param options - Token, email, and signal options.
   * @returns Submission status and item details.
   */
  async function submit(item, { accountToken, email, signal } = {}) {
    if (accountToken) return { status: 'saved', item: await save(item, accountToken, signal) };
    const address = required(email, 'Email');
    const response = await request(auth, '/auth/login-or-register', { body: { email: address }, signal });
    const token = readAccountToken(response);
    return token
      ? { status: 'saved', item: await save(item, token, signal), accountToken: token }
      : { status: 'verification-required', email: address };
  }

  /**
   * Verifies an OTP code and saves the inventory item.
   *
   * @param item - Inventory item payload.
   * @param options - Verification options including email, code, and abort signal.
   * @returns Saved item result.
   */
  async function verifyAndSave(item, { email, code, signal }) {
    const response = await request(auth, '/auth/verify-code', {
      body: { email: required(email, 'Email'), code: required(code, 'Code') }, signal,
    });
    const token = required(readAccountToken(response), 'Account access token from Auth');
    return { status: 'saved', item: await save(item, token, signal), accountToken: token };
  }

  /**
   * Saves an inventory item using a verified account token.
   *
   * @param item - Inventory item payload.
   * @param token - Bearer JWT token.
   * @param signal - Abort signal.
   * @returns Created inventory item data.
   */
  async function save(item, token, signal) {
    return (await request(inventory, '/inventory/items', { body: item, token, signal })).data;
  }

  return {
    submit, verifyAndSave,
    /**
     * Retrieves all active inventory lookups in parallel.
     *
     * @param signal - Optional abort signal.
     * @returns Object containing categories, rooms, and warranties.
     */
    async lookups(signal) {
      const [categories, rooms, warranties] = await Promise.all(
        ['categories', 'rooms', 'warranties'].map((part) => request(inventory, `/inventory/${part}`, { signal })),
      );
      return { categories: categories.data, rooms: rooms.data, warranties: warranties.data };
    },
    /**
     * Retrieves paginated personal inventory items.
     *
     * @param accountToken - Bearer JWT token.
     * @param queryOptions - Query options including limit, offset, and abort signal.
     * @returns List of inventory items or paginated response.
     */
    async items(accountToken, { limit, offset, signal } = {}) {
      const query = new URLSearchParams();
      if (limit !== undefined) query.set('limit', String(limit));
      if (offset !== undefined) query.set('offset', String(offset));
      return (await request(inventory, `/inventory/items${query.size ? `?${query}` : ''}`, {
        token: required(accountToken, 'Account access token'), signal,
      })).data;
    },
    /**
     * Retrieves aggregated inventory summary metrics.
     *
     * @param accountToken - Bearer JWT token.
     * @param signal - Optional abort signal.
     * @returns Inventory metrics summary.
     */
    async summary(accountToken, signal) {
      return (await request(inventory, '/inventory/summary', {
        token: required(accountToken, 'Account access token'), signal,
      })).data;
    },
  };
}
