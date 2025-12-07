"use client";

import {
  MapContainer,
  TileLayer,
  GeoJSON,
  Popup,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type {
  LatLngExpression,
  PathOptions,
  LeafletMouseEvent,
} from "leaflet";
import { useState, useEffect, useRef } from "react";
import type { GeoJsonObject } from "geojson";
import "leaflet.vectorgrid";
import L from "leaflet";

import TemperaturePopup, {
  ProvinceWeather,
} from "./TemperaturePopup";

const center: LatLngExpression = [16.047, 108.206]; // gần Đà Nẵng

const OWM_KEY = process.env.NEXT_PUBLIC_OWM_KEY as string;
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

type WeatherLayerConfig = {
  key: string;
  name: string;
  variable: string;
  urlTemplate: string;
  defaultVisible: boolean;
  zIndex: number;
};

const OWM_TILES_1_0 = "https://tile.openweathermap.org/map";

const WEATHER_LAYERS: WeatherLayerConfig[] = [
  {
    key: "owm_temp",
    name: "Temperature",
    variable: "temp",
    urlTemplate: `${OWM_TILES_1_0}/temp_new/{z}/{x}/{y}.png?appid=${OWM_KEY}`,
    defaultVisible: true,
    zIndex: 10,
  },
  {
    key: "owm_wind",
    name: "Windy",
    variable: "wind",
    urlTemplate: `${OWM_TILES_1_0}/wind_new/{z}/{x}/{y}.png?appid=${OWM_KEY}`,
    defaultVisible: false,
    zIndex: 30,
  },
  {
    key: "owm_pressure",
    name: "Pressure",
    variable: "pressure",
    urlTemplate: `${OWM_TILES_1_0}/pressure_new/{z}/{x}/{y}.png?appid=${OWM_KEY}`,
    defaultVisible: false,
    zIndex: 40,
  },
  {
    key: "owm_clouds",
    name: "Cloudy",
    variable: "clouds",
    urlTemplate: `${OWM_TILES_1_0}/clouds_new/{z}/{x}/{y}.png?appid=${OWM_KEY}`,
    defaultVisible: false,
    zIndex: 50,
  },
];

export default function MapClient() {
  // Layer OWM đang bật
  const [visibleLayerKeys, setVisibleLayerKeys] = useState<string[]>(
    WEATHER_LAYERS.filter((l) => l.defaultVisible).map((l) => l.key)
  );
  const isTempVisible = visibleLayerKeys.includes("owm_temp");

  // GeoJSON provinces
  const [provinceGeojson, setProvinceGeojson] = useState<GeoJsonObject | null>(
    null
  );
  const provincesLayerRef = useRef<L.GeoJSON | null>(null);

  // Popup state
  const [popupPosition, setPopupPosition] = useState<LatLngExpression | null>(
    null
  );
  const [weatherData, setWeatherData] = useState<ProvinceWeather | null>(null);
  const [popupLoading, setPopupLoading] = useState(false);
  const [popupError, setPopupError] = useState<string | null>(null);

  const defaultProvinceStyle: PathOptions = {
    color: "#e67e22",
    weight: 1,
    fillColor: "#f39c12",
    fillOpacity: 0.25,
  };

  const highlightProvinceStyle: PathOptions = {
    color: "#d35400",
    weight: 2,
    fillColor: "#e67e22",
    fillOpacity: 0.55,
  };

  const toggleLayer = (key: string) => {
    setVisibleLayerKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const resetPopup = () => {
    setPopupPosition(null);
    setWeatherData(null);
    setPopupLoading(false);
    setPopupError(null);
  };

  // Fetch provinces GeoJSON từ Django
  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        const url = `${API_BASE}/api/provinces/`;
        console.log("Fetching provinces from:", url);
        const res = await fetch(url);
        if (!res.ok) {
          const text = await res.text();
          console.error(
            "Failed to load provinces:",
            res.status,
            res.statusText,
            text
          );
          throw new Error("Failed to load provinces");
        }
        const data = await res.json();
        setProvinceGeojson(data);
      } catch (err) {
        console.error("Error loading provinces:", err);
      }
    };

    fetchProvinces();
  }, []);

  // Sự kiện cho từng polygon tỉnh
  const onEachProvince = (feature: any, layer: L.Layer) => {
    const props = feature.properties || {};
    const code = props.code as string;
    const name = props.name as string;

    layer.on({
      mouseover(e: LeafletMouseEvent) {
        const target = e.target as L.Path;
        target.setStyle(highlightProvinceStyle);
        target.bringToFront();
      },
      mouseout(e: LeafletMouseEvent) {
        const target = e.target as L.Path;
        if (provincesLayerRef.current) {
          provincesLayerRef.current.resetStyle(target);
        } else {
          target.setStyle(defaultProvinceStyle);
        }
      },
      click: (e: LeafletMouseEvent) => {
        // Chỉ xử lý popup khi layer Temperature đang bật
        if (!isTempVisible) return;

        // Mở popup ngay tại vị trí click để phản hồi nhanh
        setPopupPosition(e.latlng);
        setPopupLoading(true);
        setPopupError(null);
        setWeatherData(null);

        (async () => {
          try {
            const res = await fetch(
              `${API_BASE}/api/provinces/${code}/weather/`
            );
            if (!res.ok) {
              throw new Error("Weather API error");
            }
            const data: ProvinceWeather = await res.json();
            setWeatherData(data);
          } catch (err) {
            console.error(err);
            setPopupError(
              `Không lấy được dữ liệu từ Open-Meteo cho ${name}.`
            );
          } finally {
            setPopupLoading(false);
          }
        })();
      },
    });
  };

  // Nếu tắt Temperature thì ẩn popup luôn
  useEffect(() => {
    if (!isTempVisible) {
      resetPopup();
    }
  }, [isTempVisible]);

  return (
    <div className="h-[100vh] w-full relative">
      <MapContainer
        center={center}
        zoom={5}
        className="h-[100vh] w-full z-0 owm-map"
      >
        {/* Basemap OSM */}
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> contributors'
        />

        {/* Các layer khí tượng OWM */}
        {WEATHER_LAYERS.map((layer) =>
          visibleLayerKeys.includes(layer.key) ? (
            <TileLayer
              key={layer.key}
              url={layer.urlTemplate}
              opacity={0.5}
              zIndex={layer.zIndex}
              attribution="&copy; OpenWeatherMap"
            />
          ) : null
        )}

        {/* Overlay polygon tỉnh – chỉ hiện khi Temperature bật */}
        {provinceGeojson && isTempVisible && (
          <GeoJSON
            data={provinceGeojson as any}
            style={() => defaultProvinceStyle}
            onEachFeature={onEachProvince}
            ref={provincesLayerRef as any}
          />
        )}

        {/* Popup nhiệt độ dùng TemperaturePopup */}
        {popupPosition && (
          <Popup
            position={popupPosition}
            maxWidth={450}   // tăng cho khớp w-[420px]
            eventHandlers={{ remove: resetPopup }}
          >
            <TemperaturePopup
              data={weatherData}
              loading={popupLoading}
              error={popupError}
            />
          </Popup>
      )}


      </MapContainer>

      {/* Panel bật/tắt layer OWM */}
      <div className="absolute top-4 right-4 z-[1000] rounded-lg bg-slate-900/80 text-slate-100 px-4 py-3 shadow-lg backdrop-blur">
        <p className="mb-2 text-sm font-semibold">Layers</p>
        <div className="space-y-1 text-xs">
          {WEATHER_LAYERS.map((layer) => (
            <label key={layer.key} className="flex items-center gap-2">
              <input
                type="checkbox"
                className="h-3 w-3"
                checked={visibleLayerKeys.includes(layer.key)}
                onChange={() => toggleLayer(layer.key)}
              />
              <span>{layer.name}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
