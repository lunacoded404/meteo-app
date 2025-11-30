// "use client";

// import { MapContainer, TileLayer } from "react-leaflet";
// import type { LatLngExpression } from "leaflet";
// import "leaflet/dist/leaflet.css";

// const center: LatLngExpression = [16.047, 108.206]; // gần Đà Nẵng

// export default function MapPage() {
//   return (
//     // fixed full màn hình, z-0 để nằm dưới Header (z cao hơn)
//     <div className="fixed inset-0 z-0">
//       <MapContainer
//         center={center}
//         zoom={5}
//         scrollWheelZoom={true}
//         className="w-full h-full"
//       >
//         <TileLayer
//           attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
//           url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
//         />
//       </MapContainer>
//     </div>
//   );
// }



"use client";

import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import type { FeatureCollection } from "geojson";
import { useEffect, useState } from "react";
import "leaflet/dist/leaflet.css";

const center: LatLngExpression = [16.047, 108.206]; // gần Đà Nẵng

export default function MapPage() {
  const [provinces, setProvinces] = useState<FeatureCollection | null>(null);

  useEffect(() => {
    const fetchGeojson = async () => {
      try {
        const res = await fetch("/api/layers/provinces");
        if (!res.ok) throw new Error("Failed to fetch provinces");
        const data = await res.json();
        setProvinces(data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchGeojson();
  }, []);

  return (
    // basemap full màn hình, Header overlay phía trên (như setup trước)
    <div className="fixed inset-0 z-0">
      <MapContainer
        center={center}
        zoom={5}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        {/* Basemap OSM */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Overlay PostGIS → GeoJSON */}
        {provinces && (
          <GeoJSON
            data={provinces}
            style={() => ({
              color: "#38bdf8",    // stroke
              weight: 1,
              fillColor: "#0ea5e9",
              fillOpacity: 0.2,
            })}
            onEachFeature={(feature, layer) => {
              const name = feature.properties?.name || "Unknown";
              layer.bindPopup(`<strong>${name}</strong>`);
            }}
          />
        )}
      </MapContainer>
    </div>
  );
}
