// frontend/src/services/alertasService.js
import api from './api';

const alertasService = {
  // Listar todas las alertas con filtros opcionales
  listarAlertas: async (params = {}) => {
    const response = await api.get('/alertas/', { params });
    return response.data;
  },

  // Obtener una alerta específica
  obtenerAlerta: async (id) => {
    const response = await api.get(`/alertas/${id}/`);
    return response.data;
  },

  // Marcar alerta como vista
  marcarVista: async (id) => {
    const response = await api.post(`/alertas/${id}/marcar_vista/`);
    return response.data;
  },

  // Resolver alerta
  resolver: async (id, comentario = '') => {
    const response = await api.post(`/alertas/${id}/resolver/`, {
      comentario,
    });
    return response.data;
  },

  // Ignorar alerta
  ignorar: async (id) => {
    const response = await api.post(`/alertas/${id}/ignorar/`);
    return response.data;
  },

  // Obtener estadísticas de alertas
  obtenerEstadisticas: async () => {
    const response = await api.get('/alertas/estadisticas/');
    return response.data;
  },
};

export default alertasService;
