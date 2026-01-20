import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './utils/theme';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Mapa from './pages/Mapa';
import Contenedores from './pages/Contenedores';
import Alertas from './pages/Alertas';  // ✅ AGREGADO


const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('access_token');
  return token ? children : <Navigate to="/login" />;
};


function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/mapa"
            element={
              <PrivateRoute>
                <Mapa />
              </PrivateRoute>
            }
          />
          <Route
            path="/contenedores"
            element={
              <PrivateRoute>
                <Contenedores />
              </PrivateRoute>
            }
          />
          {/* ✅ AGREGADO */}
          <Route
            path="/alertas"
            element={
              <PrivateRoute>
                <Alertas />
              </PrivateRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}


export default App;
