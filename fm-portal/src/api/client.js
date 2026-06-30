// src/api/client.js
// This file is the bridge between your React app and your Render backend.
// Every app calls this instead of writing fetch() directly.

const BASE_URL = 'https://eis-recbackend.onrender.com';

// This function reads the login token that was saved when the user logged in
function getToken() {
  return localStorage.getItem('fm_token');
}

// This is the main function all your apps will use to talk to the backend
async function apiCall(path, options = {}) {
  const token = getToken();

  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      // Attach the login token automatically to every request
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  };

  const response = await fetch(`${BASE_URL}${path}`, config);
  const data = await response.json();

  // If the server says the token is expired or invalid, log the user out
  if (response.status === 401) {
    localStorage.removeItem('fm_token');
    localStorage.removeItem('fm_user');
    window.location.href = '/portal';
  }

  return { ok: response.ok, status: response.status, data };
}

// Shortcut functions — your apps will use these
export const api = {
  get:    (path)               => apiCall(path, { method: 'GET' }),
  post:   (path, body)         => apiCall(path, { method: 'POST',   body: JSON.stringify(body) }),
  put:    (path, body)         => apiCall(path, { method: 'PUT',    body: JSON.stringify(body) }),
  patch:  (path, body)         => apiCall(path, { method: 'PATCH',  body: JSON.stringify(body) }),
  delete: (path)               => apiCall(path, { method: 'DELETE' }),

  // Special version for file uploads (no Content-Type header — browser sets it automatically)
  upload: (path, formData) => apiCall(path, {
    method: 'POST',
    body: formData,
    headers: {}, // override to remove Content-Type so browser sets multipart boundary
  }),
};
