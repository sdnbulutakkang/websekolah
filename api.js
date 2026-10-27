/**
 * ============================================================
 *  API CLIENT — satu-satunya tempat yang bicara ke backend GAS
 * ============================================================
 */
const Api = (function () {
  function base() { return window.APP_CONFIG.API_BASE_URL; }
  function tokenKey() { return window.APP_CONFIG.TOKEN_STORAGE_KEY; }

  function getToken() { return localStorage.getItem(tokenKey()) || ''; }
  function setToken(t) { localStorage.setItem(tokenKey(), t); }
  function clearToken() { localStorage.removeItem(tokenKey()); }

  async function get(action, params) {
    params = params || {};
    const qs = new URLSearchParams(Object.assign({ action: action }, params));
    const token = getToken();
    if (token) qs.set('token', token);
    try {
      const res = await fetch(base() + '?' + qs.toString(), { method: 'GET' });
      return await res.json();
    } catch (e) {
      return { success: false, message: 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.' };
    }
  }

  async function post(action, data) {
    const token = getToken();
    const body = { action: action, data: data || {}, token: token };
    try {
      // Content-Type text/plain menghindari CORS preflight OPTIONS yang tidak didukung GAS web app
      const res = await fetch(base(), {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(body)
      });
      return await res.json();
    } catch (e) {
      return { success: false, message: 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.' };
    }
  }

  return { get: get, post: post, getToken: getToken, setToken: setToken, clearToken: clearToken };
})();
