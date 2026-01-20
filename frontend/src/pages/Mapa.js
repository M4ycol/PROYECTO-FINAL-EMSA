import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Chip,
  Button,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  Search,
  MyLocation,
  Refresh,
} from '@mui/icons-material';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import MapView from '../components/MapView';
import { contenedoresAPI } from '../services/api';

const Mapa = () => {
  const [contenedores, setContenedores] = useState([]);
  const [filteredContenedores, setFilteredContenedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContenedor, setSelectedContenedor] = useState(null);

  useEffect(() => {
    loadContenedores();
    
    // Actualizar cada 30 segundos
    const interval = setInterval(() => {
      loadContenedores();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = contenedores.filter(c => 
        c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.direccion.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.numero.toString().includes(searchTerm)
      );
      setFilteredContenedores(filtered);
    } else {
      setFilteredContenedores(contenedores);
    }
  }, [searchTerm, contenedores]);

  const loadContenedores = async () => {
    try {
      const response = await contenedoresAPI.getAll();
      const data = response.data.results || response.data;
      const contenedoresArray = Array.isArray(data) ? data : [];
      
      setContenedores(contenedoresArray);
      setFilteredContenedores(contenedoresArray);
    } catch (error) {
      console.error('Error al cargar contenedores:', error);
      setContenedores([]);
      setFilteredContenedores([]);
    } finally {
      setLoading(false);
    }
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

  const handleCenterMap = () => {
    // Centrar mapa en Cochabamba
    setSelectedContenedor(null);
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
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
              Mapa de Contenedores
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Visualización en tiempo real de todos los contenedores
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<MyLocation />}
              onClick={handleCenterMap}
              sx={{ borderColor: '#FF9800', color: '#FF9800' }}
            >
              Centrar Mapa
            </Button>
            <Button
              variant="contained"
              startIcon={<Refresh />}
              onClick={loadContenedores}
              sx={{ backgroundColor: '#FF9800', '&:hover': { backgroundColor: '#F57C00' } }}
            >
              Actualizar
            </Button>
          </Box>
        </Box>

        {/* Stats Bar */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <Card sx={{ flex: 1 }}>
            <CardContent sx={{ py: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Total Contenedores
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {contenedores.length}
              </Typography>
            </CardContent>
          </Card>
          <Card sx={{ flex: 1 }}>
            <CardContent sx={{ py: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Normales
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#4CAF50' }}>
                {contenedores.filter(c => c.nivel_actual < 60).length}
              </Typography>
            </CardContent>
          </Card>
          <Card sx={{ flex: 1 }}>
            <CardContent sx={{ py: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Advertencia
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#FF9800' }}>
                {contenedores.filter(c => c.nivel_actual >= 60 && c.nivel_actual < 80).length}
              </Typography>
            </CardContent>
          </Card>
          <Card sx={{ flex: 1 }}>
            <CardContent sx={{ py: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Críticos
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#F44336' }}>
                {contenedores.filter(c => c.nivel_actual >= 80).length}
              </Typography>
            </CardContent>
          </Card>
        </Box>

        {/* Search Bar */}
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            placeholder="Buscar contenedor por nombre, dirección o número..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
            sx={{ backgroundColor: '#fff' }}
          />
        </Box>

        {/* Map and Legend */}
        <Box sx={{ display: 'flex', gap: 3 }}>
          {/* Map */}
          <Card sx={{ flex: 1, boxShadow: 3 }}>
            <CardContent>
              <Box sx={{ height: 600, borderRadius: 2, overflow: 'hidden' }}>
                <MapView contenedores={filteredContenedores} />
              </Box>
            </CardContent>
          </Card>

          {/* Legend and Info */}
          <Box sx={{ width: 320 }}>
            {/* Legend */}
            <Card sx={{ mb: 3, boxShadow: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Leyenda
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        backgroundColor: '#4CAF50',
                        border: '3px solid white',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
                      }}
                    />
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        Normal
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        0% - 59%
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        backgroundColor: '#FF9800',
                        border: '3px solid white',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
                      }}
                    />
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        Advertencia
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        60% - 79%
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        backgroundColor: '#F44336',
                        border: '3px solid white',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
                      }}
                    />
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        Crítico
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        80% - 100%
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* Selected Contenedor Info */}
            {selectedContenedor && (
              <Card sx={{ boxShadow: 3 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Información del Contenedor
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Número
                      </Typography>
                      <Typography variant="body1" fontWeight={600}>
                        #{selectedContenedor.numero}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Nombre
                      </Typography>
                      <Typography variant="body1">
                        {selectedContenedor.nombre}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Dirección
                      </Typography>
                      <Typography variant="body2">
                        {selectedContenedor.direccion}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Nivel de Llenado
                      </Typography>
                      <Chip
                        label={`${selectedContenedor.nivel_actual || 0}%`}
                        color={getNivelColor(selectedContenedor.nivel_actual || 0)}
                        sx={{ mt: 0.5, fontWeight: 600 }}
                      />
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Capacidad
                      </Typography>
                      <Typography variant="body1">
                        {selectedContenedor.capacidad_litros}L
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Estado
                      </Typography>
                      <Chip
                        label={selectedContenedor.estado}
                        color={getEstadoColor(selectedContenedor.estado)}
                        size="small"
                        sx={{ mt: 0.5 }}
                      />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            )}

            {/* Contenedores List */}
            {!selectedContenedor && filteredContenedores.length > 0 && (
              <Card sx={{ boxShadow: 3, maxHeight: 400, overflow: 'auto' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Lista de Contenedores
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {filteredContenedores.map((contenedor) => (
                      <Box
                        key={contenedor.id}
                        sx={{
                          p: 1.5,
                          borderRadius: 1,
                          border: '1px solid #e0e0e0',
                          cursor: 'pointer',
                          '&:hover': {
                            backgroundColor: '#f5f5f5',
                          },
                        }}
                        onClick={() => setSelectedContenedor(contenedor)}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body2" fontWeight={600}>
                            #{contenedor.numero} - {contenedor.nombre}
                          </Typography>
                          <Chip
                            label={`${contenedor.nivel_actual || 0}%`}
                            color={getNivelColor(contenedor.nivel_actual || 0)}
                            size="small"
                          />
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Mapa;
