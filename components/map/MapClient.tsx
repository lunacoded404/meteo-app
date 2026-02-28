"use client";
import "leaflet/dist/leaflet.css";

import type { LatLngExpression, Map as LeafletMap, LatLng } from "leaflet";
import { latLng } from "leaflet";
import React, { useMemo, useRef, useState, useEffect } from "react";
import { MapContainer, TileLayer, Popup, useMap } from "react-leaflet";

import {
  Thermometer,
  Wind,
  Umbrella,
  Droplet,
  Cloudy,
  Layers as LayersIcon,
  Map as MapIcon,
} from "lucide-react";

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
import { trackRegion } from "@/lib/track";

const center: LatLngExpression = [16.047, 108.206];
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

export type WeatherLayerKey = "temp" | "wind" | "rain" | "humidity" | "cloud";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Thermometer,
  Wind,
  Umbrella,
  Droplet,
  Cloudy,
  Layers: LayersIcon,
  Map: MapIcon,
};

const LAYER_DEFS: Array<{
  key: WeatherLayerKey;
  fallbackName: string;
  fallbackIcon: string;
  defaultVisible: boolean;
}> = [
  { key: "temp", fallbackName: "Nhiệt Độ", fallbackIcon: "Thermometer", defaultVisible: true },
  { key: "wind", fallbackName: "Gió", fallbackIcon: "Wind", defaultVisible: false },
  { key: "rain", fallbackName: "Mưa", fallbackIcon: "Umbrella", defaultVisible: false },
  { key: "humidity", fallbackName: "Độ Ẩm", fallbackIcon: "Droplet", defaultVisible: false },
  { key: "cloud", fallbackName: "Mây", fallbackIcon: "Cloudy", defaultVisible: false },
];

type LayerSetting = {
  key: WeatherLayerKey;
  name: string;
  is_enabled: boolean;
  icon: string;
};

type PlaceItem = {
  id: number;
  code: string;
  name: string;
  centroid: { lat: number; lon: number };
};

function MapReady({ onReady }: { onReady: (map: LeafletMap) => void }) {
  const map = useMap();
  useEffect(() => onReady(map), [map, onReady]);
  return null;
}

function ZoomWatcher({ onZoom }: { onZoom: (z: number) => void }) {
  const map = useMap();
  useEffect(() => {
    const fn = () => onZoom(map.getZoom());
    fn();
    map.on("zoomend", fn);
    return () => {
      map.off("zoomend", fn);
    };
  }, [map, onZoom]);
  return null;
}

export default function MapClient() {
  const DEFAULT_LAYER: WeatherLayerKey =
    LAYER_DEFS.find((l) => l.defaultVisible)?.key ?? LAYER_DEFS[0].key;

  const [activeLayerKey, setActiveLayerKey] = useState<WeatherLayerKey>(DEFAULT_LAYER);
  const activeLayerKeyRef = useRef(activeLayerKey);

  const [showShortTerm, setShowShortTerm] = useState(false);
  const showShortTermRef = useRef(showShortTerm);

  const mapRef = useRef<LeafletMap | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(5);

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

  // =========================
  // HCM districts
  // =========================
  const [hcmDistricts, setHcmDistricts] = useState<PlaceItem[]>([]);
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/places/hcm-districts/`, { cache: "no-store" });
        if (!res.ok) {
          const t = await res.text().catch(() => "");
          throw new Error(`${res.status} ${res.statusText}${t ? ` - ${t}` : ""}`);
        }
        const data = (await res.json()) as PlaceItem[];
        setHcmDistricts(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("Load HCM districts failed:", e);
        setHcmDistricts([]);
      }
    })();
  }, []);

  // =========================
  // Kiên Giang places
  // =========================
  const [kgPlaces, setKgPlaces] = useState<PlaceItem[]>([]);
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/places/kien-giang/`, { cache: "no-store" });
        if (!res.ok) {
          const t = await res.text().catch(() => "");
          throw new Error(`${res.status} ${res.statusText}${t ? ` - ${t}` : ""}`);
        }
        const data = (await res.json()) as PlaceItem[];
        setKgPlaces(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("Load Kien Giang places failed:", e);
        setKgPlaces([]);
      }
    })();
  }, []);

  const hcmIndex: ProvinceIndexItem[] = useMemo(
    () => hcmDistricts.map((d) => ({ code: d.code, name: d.name, centroid: d.centroid })),
    [hcmDistricts]
  );

  const kgIndex: ProvinceIndexItem[] = useMemo(
    () => kgPlaces.map((d) => ({ code: d.code, name: d.name, centroid: d.centroid })),
    [kgPlaces]
  );

  const searchItems: ProvinceIndexItem[] = useMemo(() => {
    return [...provinceIndex, ...hcmIndex, ...kgIndex];
  }, [provinceIndex, hcmIndex, kgIndex]);

  const [layerSettings, setLayerSettings] = useState<Record<WeatherLayerKey, LayerSetting> | null>(
    null
  );

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/map/layers/`, { cache: "no-store" });
        if (!res.ok) {
          const t = await res.text().catch(() => "");
          throw new Error(`${res.status} ${res.statusText}${t ? ` - ${t}` : ""}`);
        }
        const data = (await res.json()) as LayerSetting[];

        const map = {} as Record<WeatherLayerKey, LayerSetting>;
        for (const x of data) {
          if (x && (x.key === "temp" || x.key === "wind" || x.key === "rain" || x.key === "humidity" || x.key === "cloud")) {
            map[x.key] = x;
          }
        }
        setLayerSettings(map);
      } catch (e) {
        console.error("Load map layer settings failed:", e);
        setLayerSettings(null);
      }
    })();
  }, []);

  const visibleLayers = useMemo(() => {
    return LAYER_DEFS
      .map((d) => {
        const s = layerSettings?.[d.key];
        return {
          key: d.key,
          label: s?.name ?? d.fallbackName,
          iconName: s?.icon ?? d.fallbackIcon,
          enabled: s ? !!s.is_enabled : true,
          defaultVisible: d.defaultVisible,
        };
      })
      .filter((x) => x.enabled);
  }, [layerSettings]);

  useEffect(() => {
    if (!visibleLayers.length) return;
    if (!visibleLayers.some((x) => x.key === activeLayerKeyRef.current)) {
      setActiveLayerKey(visibleLayers[0].key);
      resetPopup();
    }
  }, [visibleLayers]);


  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const apply = () => setIsMobile(window.matchMedia("(max-width: 640px)").matches);
    apply();
    window.addEventListener("resize", apply);
    return () => window.removeEventListener("resize", apply);
  }, []);

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
    if (activeLayerKeyRef.current === key) return;
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
    const popupPos = centerLL ?? (mapRef.current ? mapRef.current.getCenter() : latLng(16.047, 108.206));

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
        setTempData(await fetchJsonSafe<ProvinceWeather>(`${API_BASE}/api/provinces/${safeCode}/weather/`));
      } else if (k === "wind") {
        setWindData(await fetchJsonSafe<ProvinceWind>(`${API_BASE}/api/provinces/${safeCode}/wind/`));
      } else if (k === "rain") {
        setRainData(await fetchJsonSafe<ProvinceRain>(`${API_BASE}/api/provinces/${safeCode}/rain/`));
      } else if (k === "humidity") {
        setHumidityData(await fetchJsonSafe<ProvinceHumidity>(`${API_BASE}/api/provinces/${safeCode}/humidity/`));
      } else if (k === "cloud") {
        setCloudData(await fetchJsonSafe<ProvinceCloud>(`${API_BASE}/api/provinces/${safeCode}/cloud/`));
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

  const openRegionByCode = async (code: string, opts?: { name?: string; latlng?: LatLng; zoom?: boolean }) => {
    const foundProvince = provinceItems.find((x) => x.code === code);
    if (foundProvince) return openProvince(foundProvince, { latlng: opts?.latlng, zoom: opts?.zoom });

    const foundHcm = hcmDistricts.find((x) => x.code === code);
    if (foundHcm) {
      return openProvince(
        { id: foundHcm.id, code: foundHcm.code, name: foundHcm.name, centroid: foundHcm.centroid } as any,
        { latlng: opts?.latlng, zoom: opts?.zoom }
      );
    }

    const foundKg = kgPlaces.find((x) => x.code === code);
    if (foundKg) {
      return openProvince(
        { id: foundKg.id, code: foundKg.code, name: foundKg.name, centroid: foundKg.centroid } as any,
        { latlng: opts?.latlng, zoom: opts?.zoom }
      );
    }

    const pFallback = { id: 0, code, name: opts?.name ?? code, centroid: { lat: 16.047, lon: 108.206 } };
    return openProvince(pFallback as any, { latlng: opts?.latlng, zoom: opts?.zoom });
  };

  const w = typeof window !== "undefined" ? window.innerWidth : 1200;
  const popupMaxW = isMobile ? Math.min(420, Math.floor(w * 0.92)) : 360;
  const popupMinW = isMobile ? Math.min(320, Math.floor(w * 0.8)) : 260;

  const lastTrackedRef = useRef<string>("");

  return (
    <div className="h-full w-full relative">
      <MapContainer center={center} zoom={5} maxZoom={12} className="h-full w-full z-0 owm-map">
        <MapReady
          onReady={(map) => {
            if (mapRef.current) return;
            mapRef.current = map;
            setMapReady(true);
          }}
        />
        <ZoomWatcher onZoom={setZoomLevel} />

        {mapReady && (
          <>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> contributors'
            />

            <RainviewerLayer active={activeLayerKey === "rain"} rainviewerPath={rainviewerPath} />

            {/* Marker tỉnh */}
            <ProvinceCentroidLayer
              items={provinceItems}
              layerKey={activeLayerKey}
              onPick={(p, latlng) => {
                trackRegion({
                  province_code: p.code,
                  province_name: p.name,
                  source: "map",
                  meta: { layer: activeLayerKey, kind: "province_centroid" },
                });
                openProvince(p, { latlng, zoom: false });
              }}
            />

            {/* Marker HCM: hiện khi zoom gần */}
            {zoomLevel >= 9 && (
              <ProvinceCentroidLayer
                items={hcmDistricts as any}
                layerKey={activeLayerKey}
                onPick={(p: any, latlng) => {
                  trackRegion({
                    province_code: p.code,
                    province_name: p.name,
                    source: "map",
                    meta: { layer: activeLayerKey, kind: "hcm_district" },
                  });
                  openProvince(p, { latlng, zoom: false });
                }}
              />
            )}

            {/* Marker Kiên Giang: hiện khi zoom >= 8 */}
            {zoomLevel >= 8 && (
              <ProvinceCentroidLayer
                items={kgPlaces as any}
                layerKey={activeLayerKey}
                onPick={(p: any, latlng) => {
                  trackRegion({
                    province_code: p.code,
                    province_name: p.name,
                    source: "map",
                    meta: { layer: activeLayerKey, kind: "kien_giang_place" },
                  });
                  openProvince(p, { latlng, zoom: false });
                }}
              />
            )}

            {popupPosition && (
              <Popup
                key={`${activeLayerKey}-${popupLoading ? "loading" : "ready"}`}
                className={["meteo-popup", popupLoading ? "is-loading" : ""].join(" ")}
                maxWidth={popupMaxW}
                minWidth={popupMinW}
                closeButton={true}
                position={popupPosition}
                eventHandlers={{ remove: resetPopup }}
              >
                {activeLayerKey === "temp" ? (
                  <TemperaturePopup data={tempData} loading={popupLoading} error={popupError} regionName={selectedRegionName} />
                ) : activeLayerKey === "wind" ? (
                  <WindPopup data={windData} loading={popupLoading} error={popupError} regionName={selectedRegionName} />
                ) : activeLayerKey === "rain" ? (
                  <RainPopup data={rainData} loading={popupLoading} error={popupError} regionName={selectedRegionName} />
                ) : activeLayerKey === "humidity" ? (
                  <HumidityPopup data={humidityData} loading={popupLoading} error={popupError} regionName={selectedRegionName} />
                ) : activeLayerKey === "cloud" ? (
                  <CloudPopup data={cloudData} loading={popupLoading} error={popupError} regionName={selectedRegionName} />
                ) : (
                  <div className="text-[12px]">Không hỗ trợ layer này.</div>
                )}
              </Popup>
            )}
          </>
        )}
      </MapContainer>

      {/* Search */}
      <div
        className="
          absolute z-[1000] pointer-events-auto
          left-3 right-3 top-3
          sm:left-13 sm:right-auto sm:top-4
          sm:w-[360px]
          lg:w-[420px]
        "
        style={{ top: "calc(env(safe-area-inset-top, 0px) + 12px)" }}
      >
        <ProvinceSearchBar
          items={searchItems}
          onSelect={(it: ProvinceIndexItem) => {
            if (lastTrackedRef.current !== it.code) {
              lastTrackedRef.current = it.code;
              trackRegion({
                province_code: it.code,
                province_name: it.name,
                source: "search",
              });
            }
            openRegionByCode(it.code, { name: it.name, zoom: true });
          }}
          placeholder="Tìm theo tên tỉnh/thành hoặc địa điểm..."
        />
      </div>

      {/* Drawers */}
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

      {/* Right controls */}
      <div
        className="
          absolute z-[1000] pointer-events-auto
          right-3 top-[72px]
          sm:right-4 sm:top-4
          flex flex-col gap-3
        "
        style={{
          top: isMobile ? "calc(env(safe-area-inset-top, 0px) + 72px)" : "calc(env(safe-area-inset-top, 0px) + 12px)",
          right: "calc(env(safe-area-inset-right, 0px) + 12px)",
        }}
      >
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
          {visibleLayers.map((l) => {
            const Icon = ICON_MAP[l.iconName] ?? ICON_MAP.Layers;
            return (
              <FabButton
                key={l.key}
                label={l.label}
                icon={<Icon className="h-4 w-4" />}
                active={activeLayerKey === l.key}
                onClick={() => toggleLayer(l.key)}
              />
            );
          })}

          {!visibleLayers.length && <div className="px-2 py-2 text-xs text-white/70">Không có layer nào đang bật.</div>}
        </div>
      </div>
    </div>
  );
}
