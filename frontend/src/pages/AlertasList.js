import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Card,
  CardContent,
  Button,
  Typography,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Stack,
  Divider,
  Grid,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Warning as WarningIcon,
  Schedule as ScheduleIcon,
  Build as BuildIcon,
  WifiOff as WifiOffIcon,
  Refresh as RefreshIcon,
  Check as CheckIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  LocationOn as LocationOnIcon,
  FilterList as FilterListIcon,
} from '@mui/icons-material';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

const AlertasList = () => {
  const [alertas, setAlertas] = useState([]);
  const [filtroTipo, setFiltroTipo] = useState('todas');
  const [filtroSeveridad, setFiltroSeveridad] = useState('todas');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarAlertas();
    const interval = setInterval(cargarAlertas, 30000);
    return () => clearInterval(interval);
  }, []);

  const cargarAlertas = async () => {
  try {
    const token = localStorage.getItem('access_token');
    const response = await axios.get('http://localhost:8000/api/contenedores/alertas/', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Respuesta de alertas:', response.data);
    
    // Extraer alertas según la estructura de respuesta
    if (response.data.success && response.data.alertas) {
      setAlertas(response.data.alertas);
    } else if (response.data.alertas) {
      setAlertas(response.data.alertas);
    } else if (Array.isArray(response.data)) {
      setAlertas(response.data);
    } else {
      setAlertas([]);
    }
    
    setLoading(false);
  } catch (error) {
    console.error('Error al cargar alertas:', error);
    setAlertas([]);
    setLoading(false);
  }
};


  const marcarComoLeida = async (alertaId) => {
    try {
      await axios.patch(`http://localhost:8000/api/contenedores/alertas/${alertaId}/`, {
        leida: true
      });
      cargarAlertas();
    } catch (error) {
      console.error('Error al marcar alerta:', error);
    }
  };

  const eliminarAlerta = async (alertaId) => {
    if (window.confirm('¿Está seguro de eliminar esta alerta?')) {
      try {
        await axios.delete(`http://localhost:8000/api/contenedores/alertas/${alertaId}/`);
        cargarAlertas();
      } catch (error) {
        console.error('Error al eliminar alerta:', error);
      }
    }
  };

  const alertasFiltradas = alertas.filter(alerta => {
    const cumpleTipo = filtroTipo === 'todas' || alerta.tipo === filtroTipo;
    const cumpleSeveridad = filtroSeveridad === 'todas' || alerta.severidad === filtroSeveridad;
    return cumpleTipo && cumpleSeveridad;
  });

  const getTipoIcono = (tipo) => {
    const iconos = {
      'nivel_critico': <WarningIcon />,
      'mantenimiento': <BuildIcon />,
      'sin_recoleccion': <ScheduleIcon />,
      'sensor_falla': <WifiOffIcon />
    };
    return iconos[tipo] || <NotificationsIcon />;
  };

  const getSeveridadColor = (severidad) => {
    const colores = {
      'alta': 'error',
      'media': 'warning',
      'baja': 'info'
    };
    return colores[severidad] || 'default';
  };

  const formatearFecha = (fecha) => {
    const date = new Date(fecha);
    return date.toLocaleString('es-BO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex' }}>
        <Navbar />
        <Sidebar />
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            marginTop: '64px',
            marginLeft: '240px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: 'calc(100vh - 64px)',
          }}
        >
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress sx={{ color: '#FF9800' }} />
            <Typography variant="body1" sx={{ mt: 2 }}>
              Cargando alertas...
            </Typography>
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex' }}>
      <Navbar />
      <Sidebar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          marginTop: '64px',
          marginLeft: '240px',
          backgroundColor: '#f5f5f5',
          minHeight: 'calc(100vh - 64px)',
        }}
      >
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <NotificationsIcon sx={{ fontSize: 40, color: '#FF9800' }} />
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 600 }}>
                Centro de Alertas
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Sistema de Monitoreo de Contenedores - EMSA
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={4}>
            <Card sx={{ boxShadow: 2 }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#2196F3' }}>
                  {alertas.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card sx={{ boxShadow: 2, bgcolor: '#FFF3E0' }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#FF9800' }}>
                  {alertas.filter(a => !a.leida).length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Sin críticas
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card sx={{ boxShadow: 2, bgcolor: '#FFEBEE' }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#F44336' }}>
                  {alertas.filter(a => a.severidad === 'alta').length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Críticas
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filtros */}
        <Card sx={{ mb: 3, boxShadow: 2 }}>
          <CardContent>
            <Stack direction="row" spacing={2} alignItems="center">
              <FilterListIcon color="action" />
              
              <FormControl sx={{ minWidth: 200 }} size="small">
                <InputLabel>Tipo de Alerta</InputLabel>
                <Select
                  value={filtroTipo}
                  label="Tipo de Alerta"
                  onChange={(e) => setFiltroTipo(e.target.value)}
                >
                  <MenuItem value="todas">Todas las alertas</MenuItem>
                  <MenuItem value="nivel_critico">Nivel Crítico</MenuItem>
                  <MenuItem value="sin_recoleccion">Sin Recolección</MenuItem>
                  <MenuItem value="sensor_falla">Falla de Sensor</MenuItem>
                  <MenuItem value="mantenimiento">Mantenimiento</MenuItem>
                </Select>
              </FormControl>

              <FormControl sx={{ minWidth: 150 }} size="small">
                <InputLabel>Severidad</InputLabel>
                <Select
                  value={filtroSeveridad}
                  label="Severidad"
                  onChange={(e) => setFiltroSeveridad(e.target.value)}
                >
                  <MenuItem value="todas">Todas</MenuItem>
                  <MenuItem value="alta">Alta</MenuItem>
                  <MenuItem value="media">Media</MenuItem>
                  <MenuItem value="baja">Baja</MenuItem>
                </Select>
              </FormControl>

              <Box sx={{ flexGrow: 1 }} />

              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={cargarAlertas}
                sx={{ 
                  borderColor: '#FF9800',
                  color: '#FF9800',
                  '&:hover': {
                    borderColor: '#F57C00',
                    backgroundColor: '#FFF3E0'
                  }
                }}
              >
                Actualizar
              </Button>
            </Stack>
          </CardContent>
        </Card>

        {/* Lista de Alertas */}
        <Stack spacing={2}>
          {alertasFiltradas.length === 0 ? (
            <Card sx={{ boxShadow: 2 }}>
              <CardContent sx={{ textAlign: 'center', py: 6 }}>
                <CheckCircleIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  No hay alertas que mostrar
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Todos los contenedores funcionan correctamente
                </Typography>
              </CardContent>
            </Card>
          ) : (
            alertasFiltradas.map((alerta) => (
              <Card
                key={alerta.id}
                sx={{
                  borderLeft: 6,
                  borderLeftColor: `${getSeveridadColor(alerta.severidad)}.main`,
                  bgcolor: !alerta.leida ? 'action.hover' : 'background.paper',
                  boxShadow: 2,
                  transition: 'all 0.2s',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 4
                  }
                }}
              >
                <CardContent>
                  <Stack direction="row" spacing={2}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 56,
                        height: 56,
                        borderRadius: 2,
                        bgcolor: `${getSeveridadColor(alerta.severidad)}.light`,
                        color: `${getSeveridadColor(alerta.severidad)}.dark`,
                        flexShrink: 0
                      }}
                    >
                      {getTipoIcono(alerta.tipo)}
                    </Box>

                    <Box sx={{ flexGrow: 1 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1}>
                        <Typography variant="h6" component="h3">
                          {alerta.titulo}
                        </Typography>
                        <Chip
                          label={alerta.severidad.toUpperCase()}
                          color={getSeveridadColor(alerta.severidad)}
                          size="small"
                        />
                      </Stack>

                      <Typography variant="body2" color="text.secondary" mb={2}>
                        {alerta.descripcion}
                      </Typography>

                      <Divider sx={{ my: 1 }} />

                      <Stack direction="row" spacing={3} alignItems="center" mt={1} flexWrap="wrap">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <LocationOnIcon fontSize="small" color="action" />
                          <Typography variant="caption" color="text.secondary">
                            {alerta.contenedor_ubicacion}
                          </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <ScheduleIcon fontSize="small" color="action" />
                          <Typography variant="caption" color="text.secondary">
                            {formatearFecha(alerta.fecha_creacion)}
                          </Typography>
                        </Box>

                        {!alerta.leida && (
                          <Chip label="NUEVA" color="primary" size="small" />
                        )}
                      </Stack>

                      <Stack direction="row" spacing={1} mt={2}>
                        {!alerta.leida && (
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            startIcon={<CheckIcon />}
                            onClick={() => marcarComoLeida(alerta.id)}
                          >
                            Marcar leída
                          </Button>
                        )}
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          startIcon={<DeleteIcon />}
                          onClick={() => eliminarAlerta(alerta.id)}
                        >
                          Eliminar
                        </Button>
                      </Stack>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            ))
          )}
        </Stack>
      </Box>
    </Box>
  );
};

export default AlertasList;
