"use client";

import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { LatLngExpression } from "leaflet";

// const center: LatLngExpression = [20.98947, 105.79575];
const center: LatLngExpression = [16.047, 108.206]; // gần Đà Nẵng

export default function MapClient() {
  return (
    <MapContainer
      center={center}
      zoom={5}
      className="h-[100vh] w-full z-0" // cho map full màn hình
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> contributors'
      />
    </MapContainer>
  );
}
