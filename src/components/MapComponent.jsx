import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

// This is a custom bus icon made with SVG
const busIcon = L.divIcon({
  html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" stroke="#007bff" stroke-width="1.5">
  <path d="M9 22V12h6V22" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M3 12V6C3 4.89543 3.89543 4 5 4H19C20.1046 4 21 4.89543 21 6V12" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M3 12H21" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M19 16H17.5C16.9477 16 16.5 16.4477 16.5 17V17C16.5 17.5523 16.9477 18 17.5 18H19V16Z" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M5 16H6.5C7.05228 16 7.5 16.4477 7.5 17V17C7.5 17.5523 7.05228 18 6.5 18H5V16Z" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
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