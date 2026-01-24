import React, { useEffect, useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Menu,
  MenuItem,
  Badge,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications,
  AccountCircle,
  ExitToApp,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Navbar = ({ onMenuClick }) => {
  const navigate = useNavigate();
  const username = localStorage.getItem('username') || 'Usuario';
  const [anchorEl, setAnchorEl] = useState(null);
  const [alertasNoLeidas, setAlertasNoLeidas] = useState(0);

  // Cargar contador de alertas no leídas
  useEffect(() => {
    cargarContadorAlertas();
    // Actualizar cada 30 segundos
    const interval = setInterval(cargarContadorAlertas, 30000);
    return () => clearInterval(interval);
  }, []);

  const cargarContadorAlertas = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/contenedores/alertas/');
      if (response.data.success) {
        const noLeidas = response.data.alertas.filter(a => !a.leida).length;
        setAlertasNoLeidas(noLeidas);
      }
    } catch (error) {
      console.error('Error al cargar contador de alertas:', error);
    }
  };

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const handleNotifications = () => {
    navigate('/alertas');
  };

  return (
    <AppBar 
      position="fixed" 
      sx={{ 
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backgroundColor: '#fff',
        color: '#333',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      }}
    >
      <Toolbar>
        <IconButton
          edge="start"
          color="inherit"
          aria-label="menu"
          onClick={onMenuClick}
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>

        {/* Logo y título */}
        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
          <Typography
            variant="h6"
            sx={{
              color: '#FF9800',
              fontWeight: 700,
              mr: 1,
            }}
          >
            emsa
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Sistema de Monitoreo
          </Typography>
        </Box>

        {/* Notificaciones con contador real */}
        <IconButton color="inherit" onClick={handleNotifications}>
          <Badge badgeContent={alertasNoLeidas} color="error">
            <Notifications />
          </Badge>
        </IconButton>

        {/* Menú de usuario */}
        <IconButton onClick={handleMenu} color="inherit">
          <AccountCircle />
        </IconButton>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleClose}
        >
          <MenuItem disabled>
            <Typography variant="body2">{username}</Typography>
          </MenuItem>
          <MenuItem onClick={handleLogout}>
            <ExitToApp sx={{ mr: 1 }} fontSize="small" />
            Cerrar Sesión
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
