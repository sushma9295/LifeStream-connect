import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const donorIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const patientIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function RecenterMap({ lat, lng }) {
  const map = useMap();

  useEffect(() => {
    map.setView([lat, lng], 14);
  }, [lat, lng, map]);

  return null;
}

export default function MapView({
  donorLat = 13.0827,
  donorLng = 80.2707,
  patientLat = 13.0569,
  patientLng = 80.2425,
  donorName = "Donor",
  patientName = "Hospital",
  routeCoords = [],
  height = "280px",
}) {
  const centerLat = (donorLat + patientLat) / 2;
  const centerLng = (donorLng + patientLng) / 2;
  const defaultLine = [
    [donorLat, donorLng],
    [patientLat, patientLng],
  ];
  const hasRoute = routeCoords && routeCoords.length > 1;

  return (
    <MapContainer
      center={[centerLat, centerLng]}
      zoom={13}
      scrollWheelZoom={false}
      style={{ width: "100%", height: height, borderRadius: "16px" }}
    >
      <RecenterMap lat={donorLat} lng={donorLng} />
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="OpenStreetMap contributors"
      />
      <Marker position={[donorLat, donorLng]} icon={donorIcon}>
        <Popup>{donorName + " (Donor)"}</Popup>
      </Marker>
      <Marker position={[patientLat, patientLng]} icon={patientIcon}>
        <Popup>{patientName + " (Hospital)"}</Popup>
      </Marker>
      {hasRoute ? (
        <Polyline
          positions={routeCoords}
          pathOptions={{ color: "blue", weight: 4, opacity: 0.7 }}
        />
      ) : (
        <Polyline
          positions={defaultLine}
          pathOptions={{ color: "red", weight: 3, dashArray: "10,10" }}
        />
      )}
    </MapContainer>
  );
}
