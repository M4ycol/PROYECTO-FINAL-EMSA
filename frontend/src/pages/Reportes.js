import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Paper,
  Divider,
  CircularProgress,
} from '@mui/material';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  Assessment,
  PictureAsPdf,
  TableChart,
  TrendingUp,
} from '@mui/icons-material';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

const Reportes = () => {
  const [containers, setContainers] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [reportType, setReportType] = useState('diario');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState([]);
  const [pieData, setPieData] = useState([]);

  const COLORS = ['#4caf50', '#ff9800', '#f44336'];

  useEffect(() => {
    fetchData();
  }, [reportType, dateFrom, dateTo]);

const fetchData = async () => {
  try {
    setLoading(true);
    const token = localStorage.getItem('access_token');
    
    const [containersRes, alertsRes] = await Promise.all([
      axios.get('http://localhost:8000/api/contenedores/contenedores/', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }),
      axios.get('http://localhost:8000/api/contenedores/alertas/', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }),
    ]);

    console.log('Contenedores recibidos:', containersRes.data);
    console.log('Alertas recibidas:', alertsRes.data);

    const containersData = containersRes.data.results || [];
    const alertsData = alertsRes.data.alertas || [];

    setContainers(containersData);
    setAlerts(alertsData);
    processChartData(containersData);
    processPieData(containersData);
    setLoading(false);
  } catch (error) {
    console.error('Error al cargar datos:', error);
    setLoading(false);
  }
};



  const processChartData = (data) => {
    if (!Array.isArray(data)) return;
    
    const chartArray = data.map((container) => ({
      name: `Cont. ${container.id}`,
      nivel: container.nivel_llenado,
      ubicacion: container.ubicacion,
    }));
    console.log('ChartData procesado:', chartArray);
    setChartData(chartArray);
  };

  const processPieData = (data) => {
    if (!Array.isArray(data)) return;
    
    const normal = data.filter(c => c.nivel_llenado < 60).length;
    const alerta = data.filter(c => c.nivel_llenado >= 60 && c.nivel_llenado < 80).length;
    const critico = data.filter(c => c.nivel_llenado >= 80).length;

    const pieDataArray = [
      { name: 'Normal', value: normal },
      { name: 'Alerta', value: alerta },
      { name: 'Crítico', value: critico },
    ];

    console.log('PieData procesado:', pieDataArray); 
    setPieData(pieDataArray);
  };

  const exportToPDF = () => {
    if (!Array.isArray(containers) || containers.length === 0) {
      alert('No hay datos para exportar');
      return;
    }

    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.setTextColor(25, 118, 210);
    doc.text('Informe de Contenedores EMSA', 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`Fecha de generación: ${new Date().toLocaleDateString('es-BO')}`, 14, 32);
    doc.text(`Tipo de reporte: ${reportType.toUpperCase()}`, 14, 38);
    
    doc.setFontSize(14);
    doc.setTextColor(25, 118, 210);
    doc.text('Estadísticas Generales', 14, 50);
    
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    const normal = containers.filter(c => c.nivel_llenado < 60).length;
    const alerta = containers.filter(c => c.nivel_llenado >= 60 && c.nivel_llenado < 80).length;
    const critico = containers.filter(c => c.nivel_llenado >= 80).length;
    
    doc.text(`Total de contenedores: ${containers.length}`, 14, 58);
    doc.text(`Estado Normal: ${normal}`, 14, 64);
    doc.text(`Estado Alerta: ${alerta}`, 14, 70);
    doc.text(`Estado Crítico: ${critico}`, 14, 76);
    
    doc.setFontSize(14);
    doc.setTextColor(25, 118, 210);
    doc.text('Detalle de Contenedores', 14, 88);
    
    const tableData = containers.map(c => [
      c.id,
      c.direccion ||c.ubicacion,
      `${c.nivel_llenado}%`,
      c.nivel_llenado >= 80 ? 'Crítico' : c.nivel_llenado >= 60 ? 'Alerta' : 'Normal',
      new Date(c.ultima_actualizacion).toLocaleString('es-BO'),
    ]);
    
    autoTable(doc,{
      startY: 92,
      head: [['ID', 'Ubicación', 'Nivel', 'Estado', 'Última Actualización']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [25, 118, 210] },
      styles: { fontSize: 8 },
    });
    
    if (Array.isArray(alerts) && alerts.length > 0) {
      doc.addPage();
      doc.setFontSize(14);
      doc.setTextColor(25, 118, 210);
      doc.text('Alertas Recientes', 14, 22);
      
      const alertsData = alerts.slice(0, 20).map(a => [
        a.tipo,
        a.contenedor,
        a.mensaje,
        new Date(a.fecha_creacion).toLocaleString('es-BO'),
      ]);

      autoTable(doc, {
        startY: 28,
        head: [['Tipo', 'Contenedor', 'Mensaje', 'Fecha']],
        body: alertsData,
        theme: 'grid',
        headStyles: { fillColor: [244, 67, 54] },
        styles: { fontSize: 8 },
      });
    }
    
    doc.save(`informe_contenedores_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportToCSV = () => {
    if (!Array.isArray(containers) || containers.length === 0) {
      alert('No hay datos para exportar');
      return;
    }

    const headers = ['ID,Ubicación,Nivel de Llenado,Estado,Última Actualización\n'];
    const rows = containers.map(c => 
      `${c.id},${c.ubicacion},${c.nivel_llenado}%,${
        c.nivel_llenado >= 80 ? 'Crítico' : c.nivel_llenado >= 60 ? 'Alerta' : 'Normal'
      },${new Date(c.ultima_actualizacion).toLocaleString('es-BO')}\n`
    );
    
    const csvContent = headers + rows.join('');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `informe_contenedores_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <Box sx={{ display: 'flex' }}>
          <Sidebar />
          <Box sx={{ flexGrow: 1, p: 3, mt: 8, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
            <CircularProgress sx={{ color: '#FF9800' }} />
          </Box>
        </Box>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <Box sx={{ display: 'flex' }}>
        <Sidebar />
        <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
          <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold', color: '#FF9800' }}>
            <Assessment sx={{ mr: 1, verticalAlign: 'middle' }} />
            Informes y Reportes
          </Typography>

          {/* Filtros y Exportación */}
          <Card sx={{ mb: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', borderRadius: 2 }}>
            <CardContent>
              <Grid container spacing={3} alignItems="center">
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Tipo de Reporte</InputLabel>
                    <Select
                      value={reportType}
                      label="Tipo de Reporte"
                      onChange={(e) => setReportType(e.target.value)}
                    >
                      <MenuItem value="diario">Diario</MenuItem>
                      <MenuItem value="semanal">Semanal</MenuItem>
                      <MenuItem value="mensual">Mensual</MenuItem>
                      <MenuItem value="personalizado">Personalizado</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Desde"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Hasta"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                
                <Grid item xs={12} md={3}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="contained"
                      color="error"
                      startIcon={<PictureAsPdf />}
                      onClick={exportToPDF}
                      fullWidth
                      sx={{ textTransform: 'none' }}
                    >
                      PDF
                    </Button>
                    <Button
                      variant="contained"
                      color="success"
                      startIcon={<TableChart />}
                      onClick={exportToCSV}
                      fullWidth
                      sx={{ textTransform: 'none' }}
                    >
                      CSV
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Gráficos */}
          <Grid container spacing={3}>
            {/* Gráfico de Barras */}
            <Grid item xs={12} md={8}>
              <Card sx={{ boxShadow: '0 4px 12px rgba(0,0,0,0.1)', borderRadius: 2 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: '#FF9800' }}>
                    <TrendingUp sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Nivel de Llenado por Contenedor
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="nivel" fill="#FF9800" name="Nivel (%)" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>

            {/* Gráfico de Pastel */}
            <Grid item xs={12} md={4}>
              <Card sx={{ boxShadow: '0 4px 12px rgba(0,0,0,0.1)', borderRadius: 2 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: '#FF9800' }}>
                    Distribución por Estado
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>

            {/* Estadísticas Detalladas */}
            <Grid item xs={12}>
              <Card sx={{ boxShadow: '0 4px 12px rgba(0,0,0,0.1)', borderRadius: 2 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: '#FF9800' }}>
                    Estadísticas Detalladas
                  </Typography>
                  <Divider sx={{ mb: 3 }} />
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                      <Paper sx={{ p: 3, textAlign: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#fff', borderRadius: 2 }}>
                        <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
                          {containers.length}
                        </Typography>
                        <Typography variant="body1">
                          Total Contenedores Monitoreados
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Paper sx={{ p: 3, textAlign: 'center', background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: '#fff', borderRadius: 2 }}>
                        <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
                          {alerts.length}
                        </Typography>
                        <Typography variant="body1">
                          Total de Alertas Generadas
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Paper sx={{ p: 3, textAlign: 'center', background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: '#fff', borderRadius: 2 }}>
                        <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
                          {Array.isArray(containers) ? containers.filter(c => c.nivel_llenado < 60).length : 0}
                        </Typography>
                        <Typography variant="body1">
                          Contenedores en Estado Normal
                        </Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Tabla de Alertas Recientes */}
            <Grid item xs={12}>
              <Card sx={{ boxShadow: '0 4px 12px rgba(0,0,0,0.1)', borderRadius: 2 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: '#FF9800' }}>
                    Alertas Recientes
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Box sx={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#FF9800', color: '#fff' }}>
                          <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Tipo</th>
                          <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Contenedor</th>
                          <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Mensaje</th>
                          <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Fecha</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Array.isArray(alerts) && alerts.slice(0, 10).map((alert, index) => (
                          <tr key={index} style={{ borderBottom: '1px solid #eee', backgroundColor: index % 2 === 0 ? '#fff' : '#f9f9f9' }}>
                            <td style={{ padding: '12px' }}>
                              <span style={{
                                padding: '4px 12px',
                                borderRadius: '12px',
                                backgroundColor: alert.tipo === 'critico' ? '#f44336' : '#ff9800',
                                color: '#fff',
                                fontSize: '12px',
                                fontWeight: 'bold'
                              }}>
                                {alert.tipo}
                              </span>
                            </td>
                            <td style={{ padding: '12px' }}>{alert.contenedor}</td>
                            <td style={{ padding: '12px' }}>{alert.mensaje}</td>
                            <td style={{ padding: '12px' }}>
                              {new Date(alert.fecha_creacion).toLocaleString('es-BO')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Gráfico de Líneas - Tendencia */}
            <Grid item xs={12}>
              <Card sx={{ boxShadow: '0 4px 12px rgba(0,0,0,0.1)', borderRadius: 2 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: '#FF9800' }}>
                    Tendencia de Llenado
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="nivel" 
                        stroke="#FF9800" 
                        strokeWidth={3}
                        name="Nivel (%)" 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </>
  );
};

export default Reportes;
