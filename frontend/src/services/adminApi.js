const BASE = import.meta.env.VITE_API_BASE_URL ?? '/api';

async function adminRequest(path) {
  const res = await fetch(`${BASE}/admin${path}`, { credentials: 'include' });
  if (res.status === 401) throw new Error('Unauthorized');
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text}`);
  }
  return res.json();
}

export const adminApi = {
  login: async (password) => {
    const res = await fetch(`${BASE}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ password }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `Login failed (${res.status})`);
    }
    return res.json();
  },

  logout: async () => {
    await fetch(`${BASE}/admin/logout`, {
      method: 'POST',
      credentials: 'include',
    });
  },

  getTraffic: (range = '24h') => adminRequest(`/stats/traffic?range=${range}`),
  getGames: () => adminRequest('/stats/games'),
  getHealth: () => adminRequest('/stats/health'),
  getJobs: () => adminRequest('/stats/jobs'),
};
