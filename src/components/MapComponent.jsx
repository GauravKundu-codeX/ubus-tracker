import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

// This is a custom bus icon made with SVG
const busIcon = L.divIcon({
  html: `<svg viewBox="0 0 24 24" fill="#FFFFFF" stroke="#007bff" stroke-width="1.5" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 17C4 18.1046 4.89543 19 6 19H7C7.55228 19 8 18.5523 8 18V16C8 15.4477 7.55228 15 7 15H5C4.44772 15 4 15.4477 4 16V17Z" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M16 17C16 18.1046 16.8954 19 18 19H19C19.5523 19 20 18.5523 20 18V16C20 15.4477 19.5523 15 19 15H17C16.4477 15 16 15.4477 16 16V17Z" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M3 16V10C3 8.34315 4.34315 7 6 7H18C19.6569 7 21 8.34315 21 10V16" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M3 11H21" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M7 7V5C7 4.44772 7.44772 4 8 4H16C16.5523 4 17 4.44772 17 5V7" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,
  className: 'bus-icon',
  iconSize: [36, 36],
  iconAnchor: [18, 18], // Center of the icon
});

// A small component to automatically move the map when the location changes
function RecenterMap({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng]);
  }, [lat, lng]);
  return null;
}

function MapComponent({ location }) {
  const position = [location.lat, location.lng];

  return (
    <MapContainer 
      center={position} 
      zoom={15} 
      scrollWheelZoom={true} // Allow scroll wheel zoom
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={position} icon={busIcon}>
        <Popup>
          Bus Location <br />
          Last update: {new Date(location.timestamp).toLocaleTimeString()}
        </Popup>
      </Marker>
      <RecenterMap lat={location.lat} lng={location.lng} />
    </MapContainer>
  );
}

export default MapComponent;