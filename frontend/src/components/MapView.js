import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix para los iconos de Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const MapView = ({ contenedores = [] }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    if (!mapRef.current) return;

    // Inicializar mapa solo una vez
    if (!mapInstanceRef.current) {
      try {
        mapInstanceRef.current = L.map(mapRef.current).setView([-17.393629, -66.157223], 13);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
        }).addTo(mapInstanceRef.current);
      } catch (error) {
        console.error('Error al inicializar mapa:', error);
        return;
      }
    }

    // Limpiar marcadores anteriores
    markersRef.current.forEach(marker => {
      try {
        marker.remove();
      } catch (e) {
        console.error('Error al remover marcador:', e);
      }
    });
    markersRef.current = [];

    // Agregar nuevos marcadores
    if (contenedores.length > 0) {
      contenedores.forEach((contenedor) => {
        if (contenedor.latitud && contenedor.longitud) {
          try {
            const nivel = contenedor.nivel_actual || 0;
            const color = nivel >= 80 ? 'red' : nivel >= 60 ? 'orange' : 'green';

            const customIcon = L.divIcon({
              className: 'custom-marker',
              html: `
                <div style="
                  background-color: ${color};
                  width: 30px;
                  height: 30px;
                  border-radius: 50%;
                  border: 3px solid white;
                  box-shadow: 0 2px 5px rgba(0,0,0,0.3);
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  color: white;
                  font-weight: bold;
                  font-size: 12px;
                ">
                  ${contenedor.numero}
                </div>
              `,
              iconSize: [30, 30],
              iconAnchor: [15, 15],
            });

            const marker = L.marker([contenedor.latitud, contenedor.longitud], {
              icon: customIcon,
            }).addTo(mapInstanceRef.current);

            marker.bindPopup(`
              <div style="min-width: 200px;">
                <h3 style="margin: 0 0 10px 0; color: #333;">${contenedor.nombre}</h3>
                <p style="margin: 5px 0;"><strong>Dirección:</strong> ${contenedor.direccion}</p>
                <p style="margin: 5px 0;"><strong>Nivel:</strong> 
                  <span style="color: ${color}; font-weight: bold;">${nivel}%</span>
                </p>
                <p style="margin: 5px 0;"><strong>Capacidad:</strong> ${contenedor.capacidad_litros}L</p>
                <p style="margin: 5px 0;"><strong>Estado:</strong> ${contenedor.estado}</p>
              </div>
            `);

            markersRef.current.push(marker);
          } catch (error) {
            console.error('Error al crear marcador:', error);
          }
        }
      });

      // Ajustar vista para mostrar todos los marcadores
      if (markersRef.current.length > 0) {
        try {
          const group = L.featureGroup(markersRef.current);
          mapInstanceRef.current.fitBounds(group.getBounds().pad(0.1));
        } catch (error) {
          console.error('Error al ajustar bounds:', error);
        }
      }
    }

    return () => {
      // NO limpiar el mapa al desmontar, solo los marcadores
    };
  }, [contenedores]);

  return <div ref={mapRef} style={{ width: '100%', height: '100%' }} />;
};

export default MapView;
