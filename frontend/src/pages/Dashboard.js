import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  LinearProgress,
} from '@mui/material';
import {
  Inventory,
  Warning,
  TrendingUp,
  ErrorOutline,
  Delete,
  Recycling,
  Speed,
  CalendarMonth,
} from '@mui/icons-material';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { contenedoresAPI } from '../services/api';

const Dashboard = () => {
  const [contenedores, setContenedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    alertas: 0,
    promedioNivel: 0,
    criticos: 0,
    recoleccionesHoy: 0,
    capacidadTotal: 0,
    capacidadUsada: 0,
  });

  useEffect(() => {
    loadContenedores();
    
    const interval = setInterval(() => {
      loadContenedores();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadContenedores = async () => {
    try {
      const response = await contenedoresAPI.getAll();
      const data = response.data.results || response.data;
      const contenedoresArray = Array.isArray(data) ? data : [];
      
      setContenedores(contenedoresArray);
      calculateStats(contenedoresArray);
    } catch (error) {
      console.error('Error al cargar contenedores:', error);
      setContenedores([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data) => {
    const total = data.length;
    const alertas = data.filter(c => c.nivel_actual >= 60).length;
    const criticos = data.filter(c => c.nivel_actual >= 80).length;
    const promedioNivel = total > 0 
      ? Math.round(data.reduce((sum, c) => sum + (c.nivel_actual || 0), 0) / total)
      : 0;
    
    const capacidadTotal = data.reduce((sum, c) => sum + (c.capacidad_litros || 0), 0);
    const capacidadUsada = Math.round(data.reduce((sum, c) => {
      const nivel = c.nivel_actual || 0;
      const capacidad = c.capacidad_litros || 0;
      return sum + (capacidad * nivel / 100);
    }, 0));

    const recoleccionesHoy = criticos;

    setStats({ 
      total, 
      alertas, 
      promedioNivel, 
      criticos, 
      recoleccionesHoy,
      capacidadTotal,
      capacidadUsada 
    });
  };

  const getNivelColor = (nivel) => {
    if (nivel >= 80) return 'error';
    if (nivel >= 60) return 'warning';
    return 'success';
  };

  const getEstadoColor = (estado) => {
    switch (estado?.toLowerCase()) {
      case 'activo':
        return 'success';
      case 'mantenimiento':
        return 'warning';
      case 'inactivo':
        return 'error';
      default:
        return 'default';
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, subtitle, trend }) => (
    <Card sx={{ height: '100%', boxShadow: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box sx={{ flex: 1 }}>
            <Typography color="text.secondary" variant="body2" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 700, color, mb: 0.5 }}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
            {trend && (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <Typography variant="caption" color={trend > 0 ? 'success.main' : 'error.main'}>
                  {trend > 0 ? '+' : ''}{trend}% vs ayer
                </Typography>
              </Box>
            )}
          </Box>
          <Box
            sx={{
              backgroundColor: `${color}15`,
              borderRadius: 2,
              p: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon sx={{ fontSize: 32, color }} />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

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
          <CircularProgress sx={{ color: '#FF9800' }} />
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
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
            Dashboard de Monitoreo
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Sistema de Monitoreo de Contenedores - EMSA
          </Typography>
        </Box>

        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Contenedores Totales"
              value={stats.total}
              icon={Inventory}
              color="#2196F3"
              subtitle="Contenedores activos"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Alertas Activas"
              value={stats.alertas}
              icon={Warning}
              color="#FF9800"
              subtitle="Nivel mayor o igual a 60%"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Nivel Promedio"
              value={`${stats.promedioNivel}%`}
              icon={Speed}
              color="#4CAF50"
              subtitle="Promedio de llenado"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Contenedores Críticos"
              value={stats.criticos}
              icon={ErrorOutline}
              color="#F44336"
              subtitle="Nivel mayor o igual a 80%"
            />
          </Grid>
        </Grid>

        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Capacidad Total"
              value={`${stats.capacidadTotal}L`}
              icon={Recycling}
              color="#9C27B0"
              subtitle="Litros totales"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Capacidad Usada"
              value={`${stats.capacidadUsada}L`}
              icon={Delete}
              color="#FF5722"
              subtitle={`${Math.round((stats.capacidadUsada / stats.capacidadTotal) * 100) || 0}% ocupado`}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Recolecciones Hoy"
              value={stats.recoleccionesHoy}
              icon={CalendarMonth}
              color="#00BCD4"
              subtitle="Programadas"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Eficiencia"
              value="92%"
              icon={TrendingUp}
              color="#8BC34A"
              subtitle="Tasa de recolección"
              trend={5}
            />
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card sx={{ boxShadow: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Contenedores Críticos
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                      <TableRow>
                        <TableCell><strong>Número</strong></TableCell>
                        <TableCell><strong>Nombre</strong></TableCell>
                        <TableCell><strong>Nivel</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {contenedores
                        .filter(c => c.nivel_actual >= 80)
                        .slice(0, 5)
                        .map((contenedor) => (
                          <TableRow key={contenedor.id} hover>
                            <TableCell>{contenedor.numero}</TableCell>
                            <TableCell>{contenedor.nombre}</TableCell>
                            <TableCell>
                              <Chip
                                label={`${contenedor.nivel_actual}%`}
                                color="error"
                                size="small"
                                sx={{ fontWeight: 600 }}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      {contenedores.filter(c => c.nivel_actual >= 80).length === 0 && (
                        <TableRow>
                          <TableCell colSpan={3} align="center">
                            <Typography variant="body2" color="text.secondary">
                              No hay contenedores críticos
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card sx={{ boxShadow: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Niveles de Llenado
                </Typography>
                <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
                  {contenedores.slice(0, 5).map((contenedor) => (
                    <Box key={contenedor.id} sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2" fontWeight={500}>
                          {contenedor.nombre}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {contenedor.nivel_actual || 0}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={contenedor.nivel_actual || 0}
                        sx={{
                          height: 8,
                          borderRadius: 1,
                          backgroundColor: '#e0e0e0',
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: 
                              (contenedor.nivel_actual || 0) >= 80 ? '#F44336' :
                              (contenedor.nivel_actual || 0) >= 60 ? '#FF9800' :
                              '#4CAF50',
                          },
                        }}
                      />
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card sx={{ boxShadow: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Estado de Todos los Contenedores
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                      <TableRow>
                        <TableCell><strong>Número</strong></TableCell>
                        <TableCell><strong>Nombre</strong></TableCell>
                        <TableCell><strong>Dirección</strong></TableCell>
                        <TableCell><strong>Nivel</strong></TableCell>
                        <TableCell><strong>Capacidad</strong></TableCell>
                        <TableCell><strong>Usado (L)</strong></TableCell>
                        <TableCell><strong>Estado</strong></TableCell>
                        <TableCell><strong>Última Actualización</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {contenedores.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} align="center">
                            No hay contenedores registrados
                          </TableCell>
                        </TableRow>
                      ) : (
                        contenedores.map((contenedor) => {
                          const nivel = contenedor.nivel_actual || 0;
                          const capacidad = contenedor.capacidad_litros || 0;
                          const usado = Math.round((capacidad * nivel) / 100);
                          
                          return (
                            <TableRow key={contenedor.id} hover>
                              <TableCell>{contenedor.numero}</TableCell>
                              <TableCell>{contenedor.nombre}</TableCell>
                              <TableCell>{contenedor.direccion}</TableCell>
                              <TableCell>
                                <Chip
                                  label={`${nivel}%`}
                                  color={getNivelColor(nivel)}
                                  size="small"
                                  sx={{ fontWeight: 600 }}
                                />
                              </TableCell>
                              <TableCell>{capacidad}L</TableCell>
                              <TableCell>{usado}L</TableCell>
                              <TableCell>
                                <Chip
                                  label={contenedor.estado}
                                  color={getEstadoColor(contenedor.estado)}
                                  size="small"
                                />
                              </TableCell>
                              <TableCell>
                                {contenedor.fecha_instalacion 
                                  ? new Date(contenedor.fecha_instalacion).toLocaleDateString('es-ES')
                                  : 'N/A'
                                }
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default Dashboard;
