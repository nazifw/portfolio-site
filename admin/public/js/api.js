let csrf = null;
export const setCsrf = (t) => { csrf = t; };

export class ApiError extends Error {
  constructor(status, data) { super((data && data.error) || 'error'); this.status = status; this.data = data || {}; }
}

export async function api(method, url, body) {
  const headers = {};
  let payload;
  if (body instanceof FormData) payload = body;
  else if (body !== undefined) { headers['Content-Type'] = 'application/json'; payload = JSON.stringify(body); }
  if (csrf && method !== 'GET') headers['X-CSRF-Token'] = csrf;
  let res;
  try { res = await fetch('/admin/api' + url, { method, headers, body: payload, credentials: 'same-origin' }); }
  catch (e) { throw new ApiError(0, { error: 'network' }); }
  let data = null;
  try { data = await res.json(); } catch (_) { /* empty body */ }
  if (data && data.csrf) csrf = data.csrf;
  if (!res.ok) {
    if (res.status === 401 && !url.startsWith('/login') && !url.startsWith('/password')) window.dispatchEvent(new CustomEvent('auth-lost'));
    throw new ApiError(res.status, data);
  }
  return data;
}
