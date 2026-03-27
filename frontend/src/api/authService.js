import api from './axios';

/**
 * Intenta login. Guarda el access token en memoria (no localStorage).
 * El refresh token queda en cookie HttpOnly — el navegador lo maneja solo.
 */
export async function login(email, password) {
  const { data } = await api.post('/auth/login', { email, password });
  setAccessToken(data.access_token);
  return data;
}

export async function logout() {
  try {
    await api.post('/auth/logout');
  } finally {
    setAccessToken(null);
  }
}

/**
 * Verifica si hay sesión activa usando la cookie de refresh.
 * Devuelve los datos del usuario o null si no hay sesión.
 */
export async function checkSession() {
  try {
    const { data } = await api.get('/auth/me');
    return data;  // { id, email, nombre }
  } catch {
    return null;
  }
}

/**
 * Pide un nuevo access token usando la cookie de refresh.
 * Lo llama automáticamente el interceptor de axios cuando recibe 401.
 */
export async function refreshAccessToken() {
  const { data } = await api.post('/auth/refresh');
  setAccessToken(data.access_token);
  return data.access_token;
}

// ── Almacenamiento en memoria del access token ─────────────────
let _accessToken = null;

export function setAccessToken(token) {
  _accessToken = token;
}

export function getAccessToken() {
  return _accessToken;
}