import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Avatar,
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


const Navbar = ({ onMenuClick }) => {
  const navigate = useNavigate();
  const username = localStorage.getItem('username') || 'Usuario';
  const [anchorEl, setAnchorEl] = React.useState(null);


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

  // ✅ AGREGADO: Navegar a alertas
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


        {/*  MODIFICADO: Notificaciones con Badge y onClick */}
        <IconButton color="inherit" onClick={handleNotifications}>
          <Badge badgeContent={0} color="error">
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
