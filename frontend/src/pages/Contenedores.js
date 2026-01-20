import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Typography,
  CircularProgress,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Search,
} from '@mui/icons-material';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import ContenedorForm from '../components/ContenedorForm';
import { contenedoresAPI } from '../services/api';

const Contenedores = () => {
  const [contenedores, setContenedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [openForm, setOpenForm] = useState(false);
  const [selectedContenedor, setSelectedContenedor] = useState(null);

  useEffect(() => {
    loadContenedores();
  }, []);

  const loadContenedores = async () => {
    try {
      const response = await contenedoresAPI.getAll();
      console.log('Contenedores cargados:', response.data);
      
      // ✅ CORREGIDO: Manejar respuesta paginada de Django REST Framework
      const data = response.data.results || response.data;
      setContenedores(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error al cargar contenedores:', error);
      setContenedores([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (data) => {
    try {
      console.log('Enviando datos:', data);
      
      if (selectedContenedor) {
        await contenedoresAPI.update(selectedContenedor.id, data);
        alert('Contenedor actualizado exitosamente');
      } else {
        await contenedoresAPI.create(data);
        alert('Contenedor creado exitosamente');
      }
      
      handleCloseForm();
      await loadContenedores();
    } catch (error) {
      console.error('Error al guardar:', error);
      console.error('Respuesta del servidor:', error.response?.data);
      
      if (error.response?.data) {
        const errores = Object.entries(error.response.data)
          .map(([campo, mensajes]) => `${campo}: ${Array.isArray(mensajes) ? mensajes.join(', ') : mensajes}`)
          .join('\n');
        alert(`Error al guardar:\n${errores}`);
      } else {
        alert('Error al guardar el contenedor');
      }
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Está seguro de eliminar este contenedor?')) {
      try {
        await contenedoresAPI.delete(id);
        alert('Contenedor eliminado exitosamente');
        await loadContenedores();
      } catch (error) {
        console.error('Error al eliminar:', error);
        alert('Error al eliminar el contenedor');
      }
    }
  };

  const handleEdit = (contenedor) => {
    setSelectedContenedor(contenedor);
    setOpenForm(true);
  };

  const handleCloseForm = () => {
    setOpenForm(false);
    setSelectedContenedor(null);
  };

  const filteredContenedores = contenedores.filter((cont) =>
    cont.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cont.direccion?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  const getNivelColor = (nivel) => {
    if (nivel >= 80) return '#f44336';
    if (nivel >= 60) return '#ff9800';
    return '#4caf50';
  };

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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 600 }}>
            Contenedores ({contenedores.length})
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setOpenForm(true)}
            sx={{ backgroundColor: '#FF9800', '&:hover': { backgroundColor: '#F57C00' } }}
          >
            Nuevo Contenedor
          </Button>
        </Box>

        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            placeholder="Buscar por nombre o dirección..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <Search sx={{ mr: 1, color: '#999' }} />,
            }}
            sx={{ backgroundColor: '#fff' }}
          />
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress sx={{ color: '#FF9800' }} />
          </Box>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                <TableRow>
                  <TableCell><strong>Número</strong></TableCell>
                  <TableCell><strong>Nombre</strong></TableCell>
                  <TableCell><strong>Dirección</strong></TableCell>
                  <TableCell><strong>Capacidad</strong></TableCell>
                  <TableCell><strong>Nivel</strong></TableCell>
                  <TableCell><strong>Estado</strong></TableCell>
                  <TableCell><strong>Fecha</strong></TableCell>
                  <TableCell align="center"><strong>Acciones</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredContenedores.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      {searchTerm ? 'No se encontraron contenedores' : 'No hay contenedores registrados'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredContenedores.map((contenedor) => (
                    <TableRow key={contenedor.id} hover>
                      <TableCell>{contenedor.numero}</TableCell>
                      <TableCell>{contenedor.nombre}</TableCell>
                      <TableCell>{contenedor.direccion}</TableCell>
                      <TableCell>{contenedor.capacidad_litros}L</TableCell>
                      <TableCell>
                        <Chip
                          label={`${contenedor.nivel_actual || 0}%`}
                          size="small"
                          sx={{
                            backgroundColor: getNivelColor(contenedor.nivel_actual || 0),
                            color: '#fff',
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={contenedor.estado}
                          size="small"
                          color={getEstadoColor(contenedor.estado)}
                        />
                      </TableCell>
                      <TableCell>
                        {contenedor.fecha_instalacion 
                          ? new Date(contenedor.fecha_instalacion).toLocaleDateString('es-ES')
                          : 'N/A'
                        }
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          onClick={() => handleEdit(contenedor)}
                          color="primary"
                          size="small"
                        >
                          <Edit />
                        </IconButton>
                        <IconButton
                          onClick={() => handleDelete(contenedor.id)}
                          color="error"
                          size="small"
                        >
                          <Delete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <ContenedorForm
          open={openForm}
          onClose={handleCloseForm}
          onSave={handleSave}
          contenedor={selectedContenedor}
        />
      </Box>
    </Box>
  );
};

export default Contenedores;
