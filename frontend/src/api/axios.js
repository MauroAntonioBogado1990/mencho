import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor: log de errores en consola para debug
api.interceptors.response.use(
  response => response,
  error => {
    console.error('[Mencho API Error]', error.response?.status, error.message);
    return Promise.reject(error);
  }
);

export default api;