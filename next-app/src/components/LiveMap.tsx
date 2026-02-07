"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default marker icons in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface IncidentLocation {
  id: string;
  lat: number;
  lng: number;
  priority: string;
  emergencyType: string;
  callerName: string;
  status: string;
}

interface Unit {
  id: string;
  lat: number;
  lng: number;
  type: string;
  status: "available" | "dispatched" | "busy";
  callsign: string;
}

interface LiveMapProps {
  incidents: IncidentLocation[];
  units?: Unit[];
  center?: [number, number];
  zoom?: number;
}

export default function LiveMap({ incidents, units = [], center = [33.95, -83.38], zoom = 12 }: LiveMapProps) {
  // Custom icons
  const criticalIcon = new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

  const highIcon = new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

  const mediumIcon = new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-yellow.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

  const unitIcon = new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

  const getIcon = (priority: string) => {
    switch (priority) {
      case "critical":
        return criticalIcon;
      case "high":
        return highIcon;
      case "medium":
        return mediumIcon;
      default:
        return new L.Icon.Default();
    }
  };

  const getCircleColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "#ef4444";
      case "high":
        return "#f97316";
      case "medium":
        return "#eab308";
      default:
        return "#3b82f6";
    }
  };

  return (
    <div className="w-full h-full rounded-lg overflow-hidden">
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: "100%", width: "100%" }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Incident Markers */}
        {incidents.map((incident) => (
          <div key={incident.id}>
            <Marker position={[incident.lat, incident.lng]} icon={getIcon(incident.priority)}>
              <Popup>
                <div className="text-sm">
                  <div className="font-bold text-lg mb-1">{incident.callerName}</div>
                  <div className="text-xs text-gray-600 mb-2">
                    {incident.emergencyType.toUpperCase()} • {incident.priority.toUpperCase()}
                  </div>
                  <div className="text-xs">
                    Status: <span className="font-semibold">{incident.status}</span>
                  </div>
                </div>
              </Popup>
            </Marker>
            <Circle
              center={[incident.lat, incident.lng]}
              radius={200}
              pathOptions={{
                color: getCircleColor(incident.priority),
                fillColor: getCircleColor(incident.priority),
                fillOpacity: 0.2,
              }}
            />
          </div>
        ))}

        {/* Unit Markers */}
        {units.map((unit) => (
          <Marker key={unit.id} position={[unit.lat, unit.lng]} icon={unitIcon}>
            <Popup>
              <div className="text-sm">
                <div className="font-bold text-lg mb-1">{unit.callsign}</div>
                <div className="text-xs text-gray-600 mb-2">
                  {unit.type.toUpperCase()}
                </div>
                <div className="text-xs">
                  Status: <span className="font-semibold capitalize">{unit.status}</span>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
