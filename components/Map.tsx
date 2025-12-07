"use client";

import { useEffect } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.vectorgrid";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

export default function Map() {
  useEffect(() => {
    // Khởi tạo bản đồ
    const map = L.map("map", {
      center: [16, 106], // Việt Nam
      zoom: 6,
      
    });


    

    // Tile nền OSM
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    // URL tới Django vector tile
    const vtUrl = `${API_BASE}/api/tiles/weather/{z}/{x}/{y}.mvt`;

    // Hàm convert nhiệt độ -> màu
    const temperatureToColor = (t?: number) => {
      if (t == null) return "#888888";
      if (t < 18) return "#4575b4";
      if (t < 24) return "#74add1";
      if (t < 28) return "#fdae61";
      if (t < 32) return "#f46d43";
      return "#d73027";
    };

    // Tạo vector tile layer
    const vtLayer = (L as any).vectorGrid.protobuf(vtUrl, {
      maxNativeZoom: 10,
      vectorTileLayerStyles: {
        weather: (properties: any) => {
          const t = properties.temp_c;
          return {
            fill: true,
            fillColor: temperatureToColor(t),
            fillOpacity: 0.6,
            color: "#333",
            weight: 1,
          };
        },
      },
      interactive: true, // để hover/click
    });

    vtLayer.addTo(map);

    // Popup khi click vào tỉnh
    vtLayer.on("click", (e: any) => {
      const props = e.layer.properties;
      const content = `
        <b>${props.name}</b><br/>
        Nhiệt độ: ${props.temp_c ?? "?"} °C<br/>
        Độ ẩm: ${props.humidity_percent ?? "?"} %<br/>
        Mưa: ${props.precip_mm ?? "?"} mm/h
      `;
      L.popup()
        .setLatLng(e.latlng)
        .setContent(content)
        .openOn(map);
    });

    return () => {
      map.remove();
    };
  }, []);

  return <div id="map" style={{ width: "100%", height: "100vh" }} />;
}
