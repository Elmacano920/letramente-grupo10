/**
 * LectoPlay — Servicio API (Axios)
 * Grupo 10
 *
 * Todas las llamadas al backend pasan por este servicio.
 */

import axios from 'axios';

// Instancia base de Axios
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Interceptores ────────────────────────────────────────────────────────────

// Request: adjuntar token JWT si existe
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('lectoplay_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response: manejar errores de autenticación
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado — limpiar y redirigir al login
      localStorage.removeItem('lectoplay_token');
      localStorage.removeItem('lectoplay_user');
      window.location.href = '/login';
    }
    return Promise.reject(error.response?.data || { message: 'Error de conexión' });
  }
);

// ─── Endpoints de Auth ────────────────────────────────────────────────────────
export const authService = {
  register: (data) => api.post('/auth/register', data),
  login:    (data) => api.post('/auth/login', data),
  getMe:    ()     => api.get('/auth/me'),
};

// ─── Endpoints de Usuarios ────────────────────────────────────────────────────
export const usersService = {
  getAllChildren: ()          => api.get('/users'),
  getUserById:   (id)        => api.get(`/users/${id}`),
  updateAvatar:  (id, avatar) => api.put(`/users/${id}/avatar`, { avatar }),
  getLeaderboard: ()         => api.get('/users/leaderboard'),
};

// ─── Endpoints de Módulos ─────────────────────────────────────────────────────
export const modulesService = {
  getAll:    ()     => api.get('/modules'),
  getBySlug: (slug) => api.get(`/modules/${slug}`),
};

// ─── Endpoints de Progreso ────────────────────────────────────────────────────
export const progressService = {
  saveProgress:    (data)   => api.post('/progress', data),
  getMyProgress:   ()       => api.get('/progress/me'),
  getUserProgress: (userId) => api.get(`/progress/user/${userId}`),
};

// ─── Endpoints de Retos ───────────────────────────────────────────────────────
export const retosService = {
  getAll:          (params = {}) => api.get('/retos', { params }),
  getByCategoria:  (cat, params = {}) => api.get(`/retos/categoria/${cat}`, { params }),
  getById:         (id) => api.get(`/retos/${id}`),
};

export default api;
