import axios from 'axios';
import { getAccessToken, refreshAccessToken, setAccessToken } from './authService';

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

const api = axios.create({
  baseURL: API,
  withCredentials: true,   // envía cookies automáticamente (refresh token)
});

// ── Request: agregar Authorization header ──────────────────────
api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// ── Response: si recibe 401, refrescar y reintentar ────────────
let refrescando = false;
let cola = [];   // requests que esperan el nuevo token

const procesarCola = (error, token = null) => {
  cola.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  cola = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    // Si es 401 y no es un retry ni una llamada a /auth/*
    if (
      error.response?.status === 401 &&
      !original._retry &&
      !original.url?.includes('/auth/')
    ) {
      if (refrescando) {
        // Encolar la request mientras se refresca
        return new Promise((resolve, reject) => {
          cola.push({ resolve, reject });
        }).then((token) => {
          original.headers['Authorization'] = `Bearer ${token}`;
          return api(original);
        });
      }

      original._retry = true;
      refrescando = true;

      try {
        const nuevoToken = await refreshAccessToken();
        procesarCola(null, nuevoToken);
        original.headers['Authorization'] = `Bearer ${nuevoToken}`;
        return api(original);
      } catch (refreshError) {
        procesarCola(refreshError, null);
        setAccessToken(null);
        // Disparar evento para que la app muestre el login
        window.dispatchEvent(new Event('mencho:sesion-expirada'));
        return Promise.reject(refreshError);
      } finally {
        refrescando = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;