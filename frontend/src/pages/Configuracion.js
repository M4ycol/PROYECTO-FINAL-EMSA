import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  Settings,
  Save,
  Notifications,
  Security,
  Storage,
} from '@mui/icons-material';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

const Configuracion = () => {
  const [config, setConfig] = useState({
    nivelAlerta: 60,
    nivelCritico: 80,
    intervaloActualizacion: 30,
    emailNotificaciones: '',
    notificacionesEmail: true,
    notificacionesPush: true,
    modoMantenimiento: false,
  });

  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  useEffect(() => {
    cargarConfiguracion();
  }, []);

  const cargarConfiguracion = async () => {
    try {
      // Aquí puedes cargar la configuración desde el backend si existe
      // const response = await axios.get('http://localhost:8000/api/configuracion/');
      // setConfig(response.data);
    } catch (error) {
      console.error('Error al cargar configuración:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    setConfig({
      ...config,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Aquí guardarías la configuración en el backend
      // await axios.post('http://localhost:8000/api/configuracion/', config);
      
      // Por ahora guardamos en localStorage
      localStorage.setItem('configuracion', JSON.stringify(config));
      
      setSnackbarMessage('Configuración guardada exitosamente');
      setSnackbarSeverity('success');
      setOpenSnackbar(true);
    } catch (error) {
      console.error('Error al guardar configuración:', error);
      setSnackbarMessage('Error al guardar la configuración');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
    }
  };

  return (
    <>
      <Navbar />
      <Box sx={{ display: 'flex' }}>
        <Sidebar />
        <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
          <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold', color: '#FF9800' }}>
            <Settings sx={{ mr: 1, verticalAlign: 'middle' }} />
            Configuración del Sistema
          </Typography>

          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              {/* Configuración de Alertas */}
              <Grid item xs={12} md={6}>
                <Card sx={{ boxShadow: '0 4px 12px rgba(0,0,0,0.1)', borderRadius: 2 }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: '#FF9800' }}>
                      <Notifications sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Configuración de Alertas
                    </Typography>
                    <Divider sx={{ mb: 3 }} />

                    <TextField
                      fullWidth
                      label="Nivel de Alerta (%)"
                      name="nivelAlerta"
                      type="number"
                      value={config.nivelAlerta}
                      onChange={handleChange}
                      sx={{ mb: 3 }}
                      helperText="Porcentaje a partir del cual se genera una alerta"
                      InputProps={{ inputProps: { min: 0, max: 100 } }}
                    />

                    <TextField
                      fullWidth
                      label="Nivel Crítico (%)"
                      name="nivelCritico"
                      type="number"
                      value={config.nivelCritico}
                      onChange={handleChange}
                      sx={{ mb: 3 }}
                      helperText="Porcentaje a partir del cual se genera una alerta crítica"
                      InputProps={{ inputProps: { min: 0, max: 100 } }}
                    />

                    <TextField
                      fullWidth
                      label="Intervalo de Actualización (segundos)"
                      name="intervaloActualizacion"
                      type="number"
                      value={config.intervaloActualizacion}
                      onChange={handleChange}
                      helperText="Frecuencia de actualización de datos del dashboard"
                      InputProps={{ inputProps: { min: 10, max: 300 } }}
                    />
                  </CardContent>
                </Card>
              </Grid>

              {/* Configuración de Notificaciones */}
              <Grid item xs={12} md={6}>
                <Card sx={{ boxShadow: '0 4px 12px rgba(0,0,0,0.1)', borderRadius: 2 }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: '#FF9800' }}>
                      <Notifications sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Notificaciones
                    </Typography>
                    <Divider sx={{ mb: 3 }} />

                    <TextField
                      fullWidth
                      label="Email para Notificaciones"
                      name="emailNotificaciones"
                      type="email"
                      value={config.emailNotificaciones}
                      onChange={handleChange}
                      sx={{ mb: 3 }}
                      helperText="Email donde se enviarán las notificaciones"
                    />

                    <FormControlLabel
                      control={
                        <Switch
                          checked={config.notificacionesEmail}
                          onChange={handleChange}
                          name="notificacionesEmail"
                          color="warning"
                        />
                      }
                      label="Habilitar Notificaciones por Email"
                      sx={{ mb: 2, display: 'block' }}
                    />

                    <FormControlLabel
                      control={
                        <Switch
                          checked={config.notificacionesPush}
                          onChange={handleChange}
                          name="notificacionesPush"
                          color="warning"
                        />
                      }
                      label="Habilitar Notificaciones Push"
                      sx={{ mb: 2, display: 'block' }}
                    />
                  </CardContent>
                </Card>
              </Grid>

              {/* Información del Sistema */}
              <Grid item xs={12}>
                <Card sx={{ boxShadow: '0 4px 12px rgba(0,0,0,0.1)', borderRadius: 2 }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: '#FF9800' }}>
                      <Storage sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Información del Sistema
                    </Typography>
                    <Divider sx={{ mb: 3 }} />

                    <Grid container spacing={2}>
                      <Grid item xs={12} md={4}>
                        <Box sx={{ p: 2, backgroundColor: '#f9f9f9', borderRadius: 2 }}>
                          <Typography variant="body2" color="textSecondary">
                            Versión del Sistema
                          </Typography>
                          <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#FF9800' }}>
                            1.0.0
                          </Typography>
                        </Box>
                      </Grid>

                      <Grid item xs={12} md={4}>
                        <Box sx={{ p: 2, backgroundColor: '#f9f9f9', borderRadius: 2 }}>
                          <Typography variant="body2" color="textSecondary">
                            Base de Datos
                          </Typography>
                          <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#4caf50' }}>
                            PostgreSQL
                          </Typography>
                        </Box>
                      </Grid>

                      <Grid item xs={12} md={4}>
                        <Box sx={{ p: 2, backgroundColor: '#f9f9f9', borderRadius: 2 }}>
                          <Typography variant="body2" color="textSecondary">
                            Estado del Servidor
                          </Typography>
                          <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#4caf50' }}>
                            Activo
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>

                    <Box sx={{ mt: 3 }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={config.modoMantenimiento}
                            onChange={handleChange}
                            name="modoMantenimiento"
                            color="warning"
                          />
                        }
                        label="Modo Mantenimiento"
                      />
                      <Typography variant="caption" display="block" color="textSecondary" sx={{ ml: 4 }}>
                        Activar para realizar mantenimiento del sistema
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Botón Guardar */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    startIcon={<Save />}
                    sx={{
                      backgroundColor: '#FF9800',
                      '&:hover': {
                        backgroundColor: '#F57C00',
                      },
                      textTransform: 'none',
                      px: 4,
                    }}
                  >
                    Guardar Configuración
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>

          {/* Snackbar para mensajes */}
          <Snackbar
            open={openSnackbar}
            autoHideDuration={3000}
            onClose={() => setOpenSnackbar(false)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          >
            <Alert
              onClose={() => setOpenSnackbar(false)}
              severity={snackbarSeverity}
              sx={{ width: '100%' }}
            >
              {snackbarMessage}
            </Alert>
          </Snackbar>
        </Box>
      </Box>
    </>
  );
};

export default Configuracion;
