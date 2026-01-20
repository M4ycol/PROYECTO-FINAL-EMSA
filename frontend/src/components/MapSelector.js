import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { Box, Typography } from '@mui/material';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix para los iconos de Leaflet en React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const LocationMarker = ({ position, setPosition }) => {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });

  return position === null ? null : <Marker position={position} />;
};

const MapSelector = ({ latitud, longitud, onChange }) => {
  // Posición por defecto (Cochabamba, Bolivia)
const defaultPosition = [-17.3935, -66.1570];

  
  const [position, setPosition] = useState(
    latitud && longitud ? [parseFloat(latitud), parseFloat(longitud)] : defaultPosition
  );

  useEffect(() => {
    if (latitud && longitud) {
      setPosition([parseFloat(latitud), parseFloat(longitud)]);
    }
  }, [latitud, longitud]);

  useEffect(() => {
    if (onChange && position) {
      onChange({
        latitud: position[0].toFixed(6),
        longitud: position[1].toFixed(6),
      });
    }
  }, [position, onChange]);

  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
        Haz click en el mapa para seleccionar la ubicación
      </Typography>
      <Box sx={{ height: '300px', border: '1px solid #ddd', borderRadius: 1 }}>
        <MapContainer
          center={position}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker position={position} setPosition={setPosition} />
        </MapContainer>
      </Box>
      <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
        Coordenadas: {position[0].toFixed(6)}, {position[1].toFixed(6)}
      </Typography>
    </Box>
  );
};

export default MapSelector;
