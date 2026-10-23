import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { Accept: 'application/json' },
});

// Send the Sanctum token as a Bearer Authorization header.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Expired/invalid token on a protected call -> force back to login.
api.interceptors.response.use(
  (r) => r,
  (err) => {
    const url = err.config?.url || '';
    if (err.response?.status === 401 && !url.includes('/login')) {
      localStorage.removeItem('token');
      window.dispatchEvent(new Event('auth:expired'));
    }
    return Promise.reject(err);
  }
);

/** Turns a Laravel error response into { message, fields }. */
export function parseError(err) {
  const data = err.response?.data;
  return {
    message: data?.message || err.message || 'Something went wrong.',
    fields: data?.errors || {},
  };
}

export default api;
