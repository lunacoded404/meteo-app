"use client";

import "leaflet/dist/leaflet.css";

import type { LatLngExpression, Map as LeafletMap, LatLng } from "leaflet";
import { latLng } from "leaflet";
import React, { useMemo, useRef, useState, useEffect } from "react";
import { MapContainer, TileLayer, Popup, useMap } from "react-leaflet";

import { Thermometer, Wind as WindIcon, Umbrella, Droplet, Cloudy } from "lucide-react";

import TemperaturePopup, { ProvinceWeather } from "../popups/TemperaturePopup";
import TempDrawer from "../TempDrawer";
import WindPopup, { ProvinceWind } from "../popups/WindPopup";
import WindDrawer from "../WindDrawer";
import RainPopup, { ProvinceRain } from "../popups/RainPopup";
import RainDrawer from "../RainDrawer";
import HumidityPopup, { ProvinceHumidity } from "../popups/HumidityPopup";
import CloudPopup, { ProvinceCloud } from "../popups/CloudPopup";

import ProvinceSearchBar from "../ProvinceSearchBar";
import type { ProvinceIndexItem } from "../ProvinceSearchBar";

import FabButton from "./ui/FabButton";
import ProvinceCentroidLayer from "./layers/ProvinceCentroidLayer";
import RainviewerLayer from "./layers/RainviewerLayer";
import { useProvinceIndex, type ProvinceIndexApiItem } from "./hooks/useProvinceIndex";
import { useRainviewerPath } from "./hooks/useRainviewerPath";
import { fetchJsonSafe } from "./logic/openProvince";

const center: LatLngExpression = [16.047, 108.206];
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

export type WeatherLayerKey = "temp" | "wind" | "rain" | "humidity" | "cloud";

const WEATHER_LAYERS: Array<{ key: WeatherLayerKey; defaultVisible: boolean }> = [
  { key: "temp", defaultVisible: true },
  { key: "wind", defaultVisible: false },
  { key: "rain", defaultVisible: false },
  { key: "humidity", defaultVisible: false },
  { key: "cloud", defaultVisible: false },
];

function MapReady({ onReady }: { onReady: (map: LeafletMap) => void }) {
  const map = useMap();
  useEffect(() => onReady(map), [map, onReady]);
  return null;
}

export default function MapClient() {
  const DEFAULT_LAYER: WeatherLayerKey =
    WEATHER_LAYERS.find((l) => l.defaultVisible)?.key ?? WEATHER_LAYERS[0].key;

  const [activeLayerKey, setActiveLayerKey] = useState<WeatherLayerKey>(DEFAULT_LAYER);
  const activeLayerKeyRef = useRef(activeLayerKey);

  const [showShortTerm, setShowShortTerm] = useState(false);
  const showShortTermRef = useRef(showShortTerm);

  const mapRef = useRef<LeafletMap | null>(null);
  const [mapReady, setMapReady] = useState(false);

  const [popupPosition, setPopupPosition] = useState<LatLngExpression | null>(null);
  const [popupLoading, setPopupLoading] = useState(false);
  const [popupError, setPopupError] = useState<string | null>(null);

  const [tempData, setTempData] = useState<ProvinceWeather | null>(null);
  const [windData, setWindData] = useState<ProvinceWind | null>(null);
  const [rainData, setRainData] = useState<ProvinceRain | null>(null);
  const [humidityData, setHumidityData] = useState<ProvinceHumidity | null>(null);
  const [cloudData, setCloudData] = useState<ProvinceCloud | null>(null);

  const [tempForecastOpen, setTempForecastOpen] = useState(false);
  const [windForecastOpen, setWindForecastOpen] = useState(false);
  const [rainForecastOpen, setRainForecastOpen] = useState(false);

  const [selectedRegionName, setSelectedRegionName] = useState<string>("");

  const rainviewerPath = useRainviewerPath();
  const { items: provinceItems, lite } = useProvinceIndex(API_BASE);
  const provinceIndex: ProvinceIndexItem[] = useMemo(() => lite, [lite]);

  useEffect(() => {
    activeLayerKeyRef.current = activeLayerKey;
  }, [activeLayerKey]);

  useEffect(() => {
    showShortTermRef.current = showShortTerm;
  }, [showShortTerm]);

  const resetPopup = () => {
    setPopupPosition(null);

    setTempData(null);
    setWindData(null);
    setRainData(null);
    setHumidityData(null);
    setCloudData(null);

    setPopupLoading(false);
    setPopupError(null);

    setTempForecastOpen(false);
    setWindForecastOpen(false);
    setRainForecastOpen(false);

    showShortTermRef.current = false;
    setShowShortTerm(false);

    setSelectedRegionName("");
  };

  const toggleLayer = (key: WeatherLayerKey) => {
    if (activeLayerKeyRef.current === key) return; // luôn giữ 1 layer active
    setActiveLayerKey(key);
    resetPopup();
  };

  const openProvince = async (
    p: Pick<ProvinceIndexApiItem, "id" | "code" | "name" | "centroid">,
    opts?: { latlng?: LatLng; zoom?: boolean }
  ) => {
    const { latlng: clickedLatLng, zoom = false } = opts ?? {};
    const k = activeLayerKeyRef.current;

    setSelectedRegionName(p.name);

    const centerLL = clickedLatLng ?? latLng(p.centroid.lat, p.centroid.lon);
    const popupPos =
      centerLL ?? (mapRef.current ? mapRef.current.getCenter() : latLng(16.047, 108.206));

    if (zoom && mapRef.current && centerLL) {
      mapRef.current.setView(centerLL, Math.max(mapRef.current.getZoom(), 8), { animate: true });
    }

    setPopupPosition(popupPos);
    setPopupLoading(true);
    setPopupError(null);

    setTempData(null);
    setWindData(null);
    setRainData(null);
    setHumidityData(null);
    setCloudData(null);

    setTempForecastOpen(false);
    setWindForecastOpen(false);
    setRainForecastOpen(false);

    if (showShortTermRef.current) {
      if (k === "temp") setTempForecastOpen(true);
      else if (k === "wind") setWindForecastOpen(true);
      else if (k === "rain") setRainForecastOpen(true);
    }

    try {
      const safeCode = encodeURIComponent(p.code);

      if (k === "temp") {
        setTempData(
          await fetchJsonSafe<ProvinceWeather>(`${API_BASE}/api/provinces/${safeCode}/weather/`)
        );
      } else if (k === "wind") {
        setWindData(await fetchJsonSafe<ProvinceWind>(`${API_BASE}/api/provinces/${safeCode}/wind/`));
      } else if (k === "rain") {
        setRainData(await fetchJsonSafe<ProvinceRain>(`${API_BASE}/api/provinces/${safeCode}/rain/`));
      } else if (k === "humidity") {
        setHumidityData(
          await fetchJsonSafe<ProvinceHumidity>(`${API_BASE}/api/provinces/${safeCode}/humidity/`)
        );
      } else if (k === "cloud") {
        setCloudData(
          await fetchJsonSafe<ProvinceCloud>(`${API_BASE}/api/provinces/${safeCode}/cloud/`)
        );
      }
    } catch (err: any) {
      console.error("API failed:", err);
      const msg = typeof err?.message === "string" ? err.message : String(err);
      setPopupError(`Không lấy được dữ liệu cho ${p.name}. ${msg}`);

      setTempForecastOpen(false);
      setWindForecastOpen(false);
      setRainForecastOpen(false);
    } finally {
      setPopupLoading(false);
    }
  };

  const openProvinceByCode = async (
    code: string,
    opts?: { name?: string; latlng?: LatLng; zoom?: boolean }
  ) => {
    const found = provinceItems.find((x) => x.code === code);

    // fallback nếu index chưa load
    if (!found) {
      const pFallback = {
        id: 0,
        code,
        name: opts?.name ?? code,
        centroid: { lat: 16.047, lon: 108.206 },
      };
      return openProvince(pFallback, { latlng: opts?.latlng, zoom: opts?.zoom });
    }

    return openProvince(found, { latlng: opts?.latlng, zoom: opts?.zoom });
  };

  return (
    <div className="h-full w-full relative">
      <MapContainer center={center} zoom={5} maxZoom={12} className="h-full w-full z-0 owm-map">
        <MapReady
          onReady={(map) => {
            if (mapRef.current) return; // StrictMode guard
            mapRef.current = map;
            setMapReady(true);
          }}
        />

        {mapReady && (
          <>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> contributors'
            />

            <RainviewerLayer active={activeLayerKey === "rain"} rainviewerPath={rainviewerPath} />

            <ProvinceCentroidLayer
              items={provinceItems}
              layerKey={activeLayerKey}
              onPick={(p, latlng) => openProvince(p, { latlng, zoom: false })}
            />

            {popupPosition && (
              <Popup
                key={`${activeLayerKey}-${popupLoading ? "loading" : "ready"}`}
                className={["meteo-popup", popupLoading ? "is-loading" : ""].join(" ")}
                maxWidth={360}
                minWidth={260}
                closeButton={true}
                position={popupPosition}
                eventHandlers={{ remove: resetPopup }}
              >
            {activeLayerKey === "temp" ? (
                <TemperaturePopup
                    data={tempData}
                    loading={popupLoading}
                    error={popupError}
                    regionName={selectedRegionName}
                />
                ) : activeLayerKey === "wind" ? (
                <WindPopup
                    data={windData}
                    loading={popupLoading}
                    error={popupError}
                    regionName={selectedRegionName}
                />
                ) : activeLayerKey === "rain" ? (
                <RainPopup
                    data={rainData}
                    loading={popupLoading}
                    error={popupError}
                    regionName={selectedRegionName}
                />
                ) : activeLayerKey === "humidity" ? (
                <HumidityPopup
                    data={humidityData}
                    loading={popupLoading}
                    error={popupError}
                    regionName={selectedRegionName}
                />
                ) : activeLayerKey === "cloud" ? (
                <CloudPopup
                    data={cloudData}
                    loading={popupLoading}
                    error={popupError}
                    regionName={selectedRegionName}
                />
                ) : (
                <div className="text-[12px]">Không hỗ trợ layer này.</div>
                )}

              </Popup>
            )}
          </>
        )}
      </MapContainer>

      {/* SearchBar */}
      <div className="absolute top-20 left-5 z-[1000]">
        <ProvinceSearchBar
          items={provinceIndex}
          onSelect={(it: ProvinceIndexItem) => openProvinceByCode(it.code, { name: it.name, zoom: true })}
          placeholder="Tìm theo tên tỉnh/thành..."
        />
      </div>

      <TempDrawer
        open={tempForecastOpen && showShortTerm && activeLayerKey === "temp"}
        onClose={() => {
          setTempForecastOpen(false);
          showShortTermRef.current = false;
          setShowShortTerm(false);
        }}
        data={tempData}
      />

      <WindDrawer
        open={windForecastOpen && showShortTerm && activeLayerKey === "wind"}
        onClose={() => {
          setWindForecastOpen(false);
          showShortTermRef.current = false;
          setShowShortTerm(false);
        }}
        data={windData}
      />

      <RainDrawer
        open={rainForecastOpen && showShortTerm && activeLayerKey === "rain"}
        onClose={() => {
          setRainForecastOpen(false);
          showShortTermRef.current = false;
          setShowShortTerm(false);
        }}
        data={rainData}
      />

      {/* FABs + checkbox */}
      <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-3">
        <label className="flex items-center gap-2 rounded-xl bg-slate-900/80 text-slate-100 px-3 py-2 shadow-lg backdrop-blur">
          <input
            type="checkbox"
            className="h-4 w-4"
            checked={showShortTerm}
            onChange={(e) => {
              const checked = e.target.checked;

              showShortTermRef.current = checked;
              setShowShortTerm(checked);

              if (!checked) {
                setTempForecastOpen(false);
                setWindForecastOpen(false);
                setRainForecastOpen(false);
                return;
              }

              const k = activeLayerKeyRef.current;
              if (k === "temp") setTempForecastOpen(true);
              else if (k === "wind") setWindForecastOpen(true);
              else if (k === "rain") setRainForecastOpen(true);
            }}
          />
          <span className="text-xs font-medium">Dự báo ngắn hạn</span>
        </label>

        <div className="flex flex-col gap-2 rounded-2xl bg-slate-900/80 p-2 shadow-lg backdrop-blur">
          <FabButton label="Nhiệt Độ" icon={<Thermometer className="h-4 w-4" />} active={activeLayerKey === "temp"} onClick={() => toggleLayer("temp")} />
          <FabButton label="Gió" icon={<WindIcon className="h-4 w-4" />} active={activeLayerKey === "wind"} onClick={() => toggleLayer("wind")} />
          <FabButton label="Mưa" icon={<Umbrella className="h-4 w-4" />} active={activeLayerKey === "rain"} onClick={() => toggleLayer("rain")} />
          <FabButton label="Độ Ẩm" icon={<Droplet className="h-4 w-4" />} active={activeLayerKey === "humidity"} onClick={() => toggleLayer("humidity")} />
          <FabButton label="Mây" icon={<Cloudy className="h-4 w-4" />} active={activeLayerKey === "cloud"} onClick={() => toggleLayer("cloud")} />
        </div>
      </div>
    </div>
  );
}
