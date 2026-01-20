// frontend/src/services/api.js
import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

// Crear instancia de axios
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token a todas las peticiones
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      delete config.headers.Authorization;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para manejar errores de respuesta
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      console.error('Token inválido o expirado');
    }
    return Promise.reject(error);
  }
);

// ✅ API de Autenticación
export const authAPI = {
  login: (credentials) => {
    console.log('Login con:', credentials);
    return api.post('/auth/token/', {
      username: credentials.username,
      password: credentials.password,
    });
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    return Promise.resolve();
  },

  register: (userData) => api.post('/auth/register/', userData),

  refreshToken: () => {
    const refreshToken = localStorage.getItem('refresh_token');
    return api.post('/auth/token/refresh/', { refresh: refreshToken });
  },
};

// ✅ API de Contenedores (rutas corregidas)
export const contenedoresAPI = {
  // lista
  getAll: () => api.get('/contenedores/contenedores/'),

  // detalle
  getById: (id) => api.get(`/contenedores/contenedores/${id}/`),

  // crear
  create: (data) => {
    console.log('Creando contenedor con datos:', data);
    return api.post('/contenedores/contenedores/', data);
  },

  // actualizar
  update: (id, data) => {
    console.log('Actualizando contenedor:', id, data);
    return api.put(`/contenedores/contenedores/${id}/`, data);
  },

  // eliminar
  delete: (id) => {
    console.log('Eliminando contenedor:', id);
    return api.delete(`/contenedores/contenedores/${id}/`);
  },

  // estadísticas (acción @action(detail=False))
  getEstadisticas: () => api.get('/contenedores/contenedores/estadisticas/'),
};

// ✅ API de Alertas
export const alertasAPI = {
  getAll: () => api.get('/alertas/'),
  getEstadisticas: () => api.get('/alertas/estadisticas/'),
};

// Exportar instancia por defecto
export default api;
