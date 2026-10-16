import { demoRequest } from './demoApi.js';

const BASE = import.meta.env.VITE_API_URL || '/api';
export const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';

export const session = {
  get token() { return localStorage.getItem('pos_token'); },
  get user() { try { return JSON.parse(localStorage.getItem('pos_user')); } catch { return null; } },
  save(token, user) { localStorage.setItem('pos_token', token); localStorage.setItem('pos_user', JSON.stringify(user)); },
  clear() { localStorage.removeItem('pos_token'); localStorage.removeItem('pos_user'); },
};

async function request(method, path, body) {
  if (isDemoMode) return demoRequest(method, path, body);

  const res = await fetch(BASE + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(session.token ? { Authorization: `Bearer ${session.token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401 && path !== '/auth/login') {
    session.clear();
    window.dispatchEvent(new Event('pos-signed-out'));
  }
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

export const api = {
  get: (p) => request('GET', p),
  post: (p, b) => request('POST', p, b),
  put: (p, b) => request('PUT', p, b),
  patch: (p, b) => request('PATCH', p, b),
  del: (p) => request('DELETE', p),
};

export const money = (n, cur = '$') => `${cur}${Number(n || 0).toFixed(2)}`;
export const finalPrice = (p) => Number(p.Price) * (1 - (p.DiscountPct || 0) / 100);
