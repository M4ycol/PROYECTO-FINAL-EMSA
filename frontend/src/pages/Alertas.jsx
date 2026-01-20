// frontend/src/pages/Alertas.jsx
import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  Chip,
  Button,
} from '@mui/material';
import alertasService from '../services/alertasService';

const Alertas = () => {
  const [alertas, setAlertas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const cargarAlertas = async () => {
    try {
      setLoading(true);
      const data = await alertasService.listarAlertas();
      setAlertas(data);
      setError(null);
    } catch (err) {
      console.error('Error al cargar alertas', err);
      setError('Error al cargar alertas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarAlertas();
  }, []);

  const getTipoColor = (tipo) => {
    switch (tipo) {
      case 'critico':
        return 'error';
      case 'advertencia':
        return 'warning';
      case 'informativo':
        return 'info';
      default:
        return 'default';
    }
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Alertas</Typography>
        <Button variant="contained" color="warning" onClick={cargarAlertas}>
          Actualizar
        </Button>
      </Box>

      {loading && (
        <Box display="flex" justifyContent="center" mt={4}>
          <CircularProgress />
        </Box>
      )}

      {!loading && error && (
        <Box mt={2}>
          <Alert severity="error">{error}</Alert>
        </Box>
      )}

      {!loading && !error && alertas.length === 0 && (
        <Box mt={2}>
          <Alert severity="info">No hay alertas registradas</Alert>
        </Box>
      )}

      {!loading && !error && alertas.length > 0 && (
        <List>
          {alertas.map((alerta) => (
            <ListItem key={alerta.id} divider alignItems="flex-start">
              <ListItemText
                primary={
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="subtitle1">{alerta.titulo}</Typography>
                    <Chip
                      label={alerta.tipo}
                      color={getTipoColor(alerta.tipo)}
                      size="small"
                    />
                    <Chip
                      label={alerta.estado}
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                }
                secondary={
                  <>
                    <Typography variant="body2" color="text.secondary">
                      {alerta.descripcion}
                    </Typography>
                    <Typography variant="caption" display="block">
                      Contenedor: {alerta.contenedor_nombre || `#${alerta.contenedor}`}
                    </Typography>
                    <Typography variant="caption" display="block">
                      Nivel: {alerta.nivel_actual}%
                    </Typography>
                    <Typography variant="caption" display="block">
                      Fecha: {new Date(alerta.fecha_creacion).toLocaleString('es-BO')}
                    </Typography>
                  </>
                }
              />
            </ListItem>
          ))}
        </List>
      )}
    </Container>
  );
};

export default Alertas;
