const API_URL = import.meta.env.VITE_API_URL;

function resolveApiUrl() {
  if (API_URL && typeof API_URL === 'string') return API_URL;
  // Leave as empty string so `fetch` will still work with relative endpoints
  // (Phase 6 will set the env correctly for Render/CORS).
  return '';
}

function getToken() {
  return localStorage.getItem('token');
}

/**
 * Centralized API client.
 *
 * - Attaches Bearer token from localStorage automatically
 * - Assumes JSON in/out
 * - Throws a helpful Error on non-2xx responses
 */
export async function apiClient(endpoint, options = {}) {
  const token = getToken();
  const base = resolveApiUrl();

  const url = `${base}${endpoint}`;

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : null),
    ...(options.headers || null),
  };

  const res = await fetch(url, {
    ...options,
    headers,
  });

  // Some endpoints might return empty body (204)
  const text = await res.text();
  const data = text ? safeJsonParse(text) : null;

  if (!res.ok) {
    const msg =
      (data && (data.message || data.error || data.detail)) ||
      `API error (${res.status})`;
    throw new Error(msg);
  }

  return data;
}

function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

