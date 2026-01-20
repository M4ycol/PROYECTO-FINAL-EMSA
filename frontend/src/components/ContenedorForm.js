import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  MenuItem,
  Box,
  Tabs,
  Tab,
} from '@mui/material';
import MapSelector from './MapSelector';

const ContenedorForm = ({ open, onClose, onSave, contenedor }) => {
  const [tabValue, setTabValue] = useState(0);
  const [formData, setFormData] = useState({
    nombre: '',
    direccion: '',
    capacidad_litros: 3300,
    latitud: '',
    longitud: '',
    estado: 'activo', // ✅ minúscula
  });

  useEffect(() => {
    if (open) {
      if (contenedor) {
        // Modo edición
        setFormData({
          nombre: contenedor.nombre || '',
          direccion: contenedor.direccion || '',
          capacidad_litros: contenedor.capacidad_litros || 3300,
          latitud: contenedor.latitud || '',
          longitud: contenedor.longitud || '',
          estado: contenedor.estado?.toLowerCase() || 'activo', // ✅ minúscula
        });
      } else {
        // Modo creación - resetear form
        setFormData({
          nombre: '',
          direccion: '',
          capacidad_litros: 3300,
          latitud: '',
          longitud: '',
          estado: 'activo', // ✅ minúscula
        });
      }
      setTabValue(0);
    }
  }, [open, contenedor?.id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleMapChange = (coords) => {
    setFormData((prev) => ({
      ...prev,
      latitud: coords.latitud,
      longitud: coords.longitud,
    }));
  };

  const handleSubmit = () => {
    // Validar campos requeridos
    if (!formData.nombre || !formData.direccion || !formData.capacidad_litros) {
      alert('Por favor complete todos los campos obligatorios');
      return;
    }

    // Validar coordenadas
    if (!formData.latitud || !formData.longitud) {
      alert('Por favor seleccione una ubicación en el mapa');
      setTabValue(1);
      return;
    }

    // Preparar datos para enviar
    const dataToSend = {
      nombre: formData.nombre,
      direccion: formData.direccion,
      capacidad_litros: parseInt(formData.capacidad_litros),
      latitud: parseFloat(formData.latitud),
      longitud: parseFloat(formData.longitud),
      estado: formData.estado, // Ya está en minúscula
    };

    console.log('Enviando datos:', dataToSend);
    onSave(dataToSend);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {contenedor ? 'Editar Contenedor' : 'Nuevo Contenedor'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
            <Tab label="Información General" />
            <Tab label="Ubicación en Mapa" />
          </Tabs>
        </Box>

        {tabValue === 0 && (
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                required
                helperText="Ej: Contenedor Principal"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Dirección"
                name="direccion"
                value={formData.direccion}
                onChange={handleChange}
                required
                multiline
                rows={2}
                helperText="Ej: Av. Blanco Galindo 1234"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Capacidad (Litros)"
                name="capacidad_litros"
                type="number"
                value={formData.capacidad_litros}
                onChange={handleChange}
                required
                helperText="Capacidad total del contenedor"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Estado"
                name="estado"
                value={formData.estado}
                onChange={handleChange}
              >
                <MenuItem value="activo">Activo</MenuItem>
                <MenuItem value="mantenimiento">Mantenimiento</MenuItem>
                <MenuItem value="inactivo">Inactivo</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Latitud"
                name="latitud"
                value={formData.latitud}
                disabled
                helperText="Selecciona en el mapa (pestaña siguiente)"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Longitud"
                name="longitud"
                value={formData.longitud}
                disabled
                helperText="Selecciona en el mapa (pestaña siguiente)"
              />
            </Grid>
          </Grid>
        )}

        {tabValue === 1 && (
          <Box sx={{ mt: 2, height: 400 }}>
            <MapSelector
              latitud={formData.latitud}
              longitud={formData.longitud}
              onChange={handleMapChange}
            />
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Cancelar
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          sx={{ backgroundColor: '#FF9800', '&:hover': { backgroundColor: '#F57C00' } }}
        >
          {contenedor ? 'Actualizar' : 'Guardar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ContenedorForm;
