"use client";


import { MapContainer, TileLayer, GeoJSON, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type {
  LatLngExpression,
  PathOptions,
  LeafletMouseEvent,
  Map as LeafletMap,
} from "leaflet";
import { useState, useEffect, useRef, useMemo } from "react";
import type { GeoJsonObject } from "geojson";
import "leaflet.vectorgrid";
import L from "leaflet";

import { Thermometer, Wind as WindIcon, Umbrella, Droplet, Cloudy } from "lucide-react";

import TemperaturePopup, { ProvinceWeather } from "./TemperaturePopup";
import TempDrawer from "./TempDrawer";
import WindPopup, { ProvinceWind } from "./WindPopup";
import WindDrawer from "./WindDrawer";
import RainPopup, { ProvinceRain } from "./RainPopup";
import RainDrawer from "./RainDrawer";
import HumidityPopup, { ProvinceHumidity } from "./HumidityPopup";
import CloudPopup, { ProvinceCloud } from "./CloudPopup";

import ProvinceSearchBar from "./ProvinceSearchBar";
import type { ProvinceIndexItem } from "./ProvinceSearchBar";


const center: LatLngExpression = [16.047, 108.206];
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

// 🌧 RainViewer
const RAINVIEWER_API = "https://api.rainviewer.com/public/weather-maps.json";
const RAINVIEWER_TILE_HOST = "https://tilecache.rainviewer.com";

type WeatherLayerKey = "temp" | "wind" | "rain" | "humidity" | "cloud";

type WeatherLayerConfig = {
  key: WeatherLayerKey;
  name: string;
  tileProvider: "rainviewer" | "none";
  urlTemplate: string | null;
  defaultVisible: boolean;
  zIndex: number;
};

const WEATHER_LAYERS: WeatherLayerConfig[] = [
  { key: "temp", name: "Temperature", tileProvider: "none", urlTemplate: null, defaultVisible: true, zIndex: 0 },
  { key: "wind", name: "Wind", tileProvider: "none", urlTemplate: null, defaultVisible: false, zIndex: 0 },
  { key: "rain", name: "Rain (Radar)", tileProvider: "rainviewer", urlTemplate: null, defaultVisible: false, zIndex: 70 },
  { key: "humidity", name: "Humidity", tileProvider: "none", urlTemplate: null, defaultVisible: false, zIndex: 0 },
  { key: "cloud", name: "Cloud", tileProvider: "none", urlTemplate: null, defaultVisible: false, zIndex: 0 },
];

// 🎨 Overlay styles theo layer
const OVERLAY_STYLES: Record<WeatherLayerKey, { base: PathOptions; hover: PathOptions }> = {
  temp: {
    base: { color: "#e67e22", weight: 1.2, fillColor: "#fed7aa", fillOpacity: 0.65 },
    hover: { color: "#ea580c", weight: 2.2, fillColor: "#fb923c", fillOpacity: 0.92 },
  },
  wind: {
    base: { color: "#16a34a", weight: 1.2, fillColor: "#bbf7d0", fillOpacity: 0.58 },
    hover: { color: "#15803d", weight: 2.2, fillColor: "#22c55e", fillOpacity: 0.85 },
  },
  rain: {
    base: { color: "#2563eb", weight: 1.2, fillColor: "#bfdbfe", fillOpacity: 0.55 },
    hover: { color: "#1d4ed8", weight: 2.2, fillColor: "#60a5fa", fillOpacity: 0.82 },
  },
  humidity: {
    base: { color: "#7c3aed", weight: 1.2, fillColor: "#ddd6fe", fillOpacity: 0.55 },
    hover: { color: "#6d28d9", weight: 2.2, fillColor: "#a78bfa", fillOpacity: 0.82 },
  },
  cloud: {
    base: { color: "#6b7280", weight: 1.2, fillColor: "#e5e7eb", fillOpacity: 0.55 },
    hover: { color: "#374151", weight: 2.2, fillColor: "#d1d5db", fillOpacity: 0.82 },
  },
};

export default function MapClient() {

  const DEFAULT_LAYER: WeatherLayerKey =
  WEATHER_LAYERS.find((l) => l.defaultVisible)?.key ?? WEATHER_LAYERS[0].key;

  const [activeLayerKey, setActiveLayerKey] = useState<WeatherLayerKey>(DEFAULT_LAYER);

  

  // checkbox chung
  const [showShortTerm, setShowShortTerm] = useState(false);

  // GeoJSON provinces
  const [provinceGeojson, setProvinceGeojson] = useState<GeoJsonObject | null>(null);
  const provincesLayerRef = useRef<L.GeoJSON | null>(null);

  // ✅ Leaflet map ref (lấy qua ref của MapContainer)
  const mapRef = useRef<LeafletMap | null>(null);

  // highlight polygon đang chọn
  const selectedLayerRef = useRef<L.Path | null>(null);

  // Popup state
  const [popupPosition, setPopupPosition] = useState<LatLngExpression | null>(null);

  // data
  const [tempData, setTempData] = useState<ProvinceWeather | null>(null);
  const [windData, setWindData] = useState<ProvinceWind | null>(null);
  const [rainData, setRainData] = useState<ProvinceRain | null>(null);
  const [humidityData, setHumidityData] = useState<ProvinceHumidity | null>(null);
  const [cloudData, setCloudData] = useState<ProvinceCloud | null>(null);

  // drawers open
  const [tempForecastOpen, setTempForecastOpen] = useState(false);
  const [windForecastOpen, setWindForecastOpen] = useState(false);
  const [rainForecastOpen, setRainForecastOpen] = useState(false);

  // popup load/error
  const [popupLoading, setPopupLoading] = useState(false);
  const [popupError, setPopupError] = useState<string | null>(null);

  // RainViewer path
  const [rainviewerPath, setRainviewerPath] = useState<string | null>(null);

  // ✅ refs để tránh stale state khi click nhanh (checkbox + polygon)
  const showShortTermRef = useRef(showShortTerm);
  const activeLayerKeyRef = useRef(activeLayerKey);


  useEffect(() => {
    showShortTermRef.current = showShortTerm;
  }, [showShortTerm]);

  useEffect(() => {
    activeLayerKeyRef.current = activeLayerKey;
  }, [activeLayerKey]);

  // ✅ index provinces cho SearchBar
  const provinceIndex: ProvinceIndexItem[] = useMemo(() => {
    const fc: any = provinceGeojson as any;
    const feats: any[] = Array.isArray(fc?.features) ? fc.features : [];
    return feats
      .map((f) => ({
        code: String(f?.properties?.code ?? ""),
        name: String(f?.properties?.name ?? ""),
      }))
      .filter((x) => x.code && x.name)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [provinceGeojson]);

  const resetPopup = () => {
    setPopupPosition(null);

    // ✅ reset highlight polygon đã chọn
    if (selectedLayerRef.current && provincesLayerRef.current) {
      try {
        (provincesLayerRef.current as any).resetStyle(selectedLayerRef.current);
      } catch {}
    }
    selectedLayerRef.current = null;

    setTempData(null);
    setWindData(null);
    setRainData(null);
    setHumidityData(null);
    setCloudData(null);

    setPopupLoading(false);
    setPopupError(null);

    // ✅ đóng drawer + tắt checkbox
    setTempForecastOpen(false);
    setWindForecastOpen(false);
    setRainForecastOpen(false);

    showShortTermRef.current = false;
    setShowShortTerm(false);
  };

  const toggleLayer = (key: WeatherLayerKey) => {
    // ✅ Nếu bấm đúng layer đang active -> không làm gì (vẫn giữ 1 layer luôn được chọn)
    if (activeLayerKeyRef.current === key) return;

    setActiveLayerKey(key);
    resetPopup(); // ✅ chỉ reset khi đổi layer thật sự
  };



  // Fetch provinces GeoJSON
useEffect(() => {
  const fetchProvinces = async () => {
    try {
      const url = new URL("/api/provinces/", API_BASE).toString();
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(`Failed to load provinces: HTTP ${res.status} @ ${url}`);
      const data = await res.json();
      setProvinceGeojson(data);
    } catch (err) {
      console.error("Error loading provinces:", err);
    }
  };
  fetchProvinces();
}, []);


  // Fetch RainViewer path
  useEffect(() => {
    const fetchRainviewer = async () => {
      try {
        const res = await fetch(RAINVIEWER_API);
        if (!res.ok) return;
        const json = await res.json();
        const nowcast = json?.radar?.nowcast;
        const past = json?.radar?.past;
        const frame =
          (Array.isArray(nowcast) && nowcast[0]) ||
          (Array.isArray(past) && past[past.length - 1]) ||
          null;

        if (frame?.path) setRainviewerPath(frame.path as string);
      } catch (err) {
        console.error("Error loading RainViewer:", err);
      }
    };
    fetchRainviewer();
  }, []);

  const styleProvince = (): PathOptions => {
    return OVERLAY_STYLES[activeLayerKey].base;
  };


  // helper: fetch json safe
  async function fetchJsonSafe<T>(url: string): Promise<T> {
    const res = await fetch(url);

    if (res.status === 204) throw new Error("No content (204)");

    const text = await res.text();
    if (!res.ok) throw new Error(text || res.statusText);

    try {
      return JSON.parse(text) as T;
    } catch {
      throw new Error("Response is not valid JSON");
    }
  }

  type OpenProvinceOpts = {
  name?: string;
  latlng?: L.LatLng;
  zoom?: boolean; // ✅ chỉ zoom khi search
};

const openProvinceByCode = async (code: string, opts?: OpenProvinceOpts) => {

  const { name, latlng, zoom = false } = opts ?? {};

   // ✅ đảm bảo có tên (fallback lấy từ GeoJSON layer nếu opts.name thiếu)
  let regionName = name ?? "";
  if (!regionName && provincesLayerRef.current) {
    provincesLayerRef.current.eachLayer((l: any) => {
      if (l?.feature?.properties?.code === code) {
        regionName = String(l?.feature?.properties?.name ?? "");
      }
    });
  }


  const k = activeLayerKeyRef.current; // luôn có


  let centerLL: L.LatLng | null = latlng ?? null;

  if (provincesLayerRef.current) {
    // reset highlight cũ
    if (selectedLayerRef.current) {
      try {
        (provincesLayerRef.current as any).resetStyle(selectedLayerRef.current);
      } catch {}
      selectedLayerRef.current = null;
    }

    // tìm layer theo code
    let found: any = null;
    provincesLayerRef.current.eachLayer((l: any) => {
      if (l?.feature?.properties?.code === code) found = l;
    });

    if (found) {
      const styleKey = (activeLayerKeyRef.current ?? "temp") as WeatherLayerKey;
      found.setStyle(OVERLAY_STYLES[styleKey].hover);
      found.bringToFront();
      selectedLayerRef.current = found as L.Path;

      const b = found.getBounds?.();
      if (b) {
        // ✅ CHỈ zoom khi search (zoom = true)
        if (zoom && mapRef.current) {
          mapRef.current.fitBounds(b.pad(0.15), { maxZoom: 8 });
        }

        // nếu chưa có latlng -> lấy center bounds để đặt popup
        if (!centerLL) centerLL = b.getCenter();
      }
    }
  }

  const popupPos =
    centerLL ??
    (mapRef.current ? mapRef.current.getCenter() : L.latLng(16.047, 108.206));

  setPopupPosition(popupPos);
  setPopupLoading(true);
  setPopupError(null);

  setTempData(null);
  setWindData(null);
  setRainData(null);
  setHumidityData(null);
  setCloudData(null);

  // reset drawers
  setTempForecastOpen(false);
  setWindForecastOpen(false);
  setRainForecastOpen(false);

  // nếu checkbox bật -> mở drawer ngay
  if (showShortTermRef.current) {
    if (k === "temp") setTempForecastOpen(true);
    else if (k === "wind") setWindForecastOpen(true);
    else if (k === "rain") setRainForecastOpen(true);
  }

  try {
    if (k === "temp") {
      const res = await fetch(`${API_BASE}/api/provinces/${code}/weather/`);
      if (!res.ok) throw new Error("Temp API error");
      const d: ProvinceWeather = await res.json();
      setTempData(d);
      if (!showShortTermRef.current) setTempForecastOpen(false);
    } else if (k === "wind") {
      const res = await fetch(`${API_BASE}/api/provinces/${code}/wind/`);
      if (!res.ok) throw new Error("Wind API error");
      const d: ProvinceWind = await res.json();
      setWindData(d);
      if (!showShortTermRef.current) setWindForecastOpen(false);
    } else if (k === "rain") {
      const res = await fetch(`${API_BASE}/api/provinces/${code}/rain/`);
      if (!res.ok) throw new Error("Rain API error");
      const d: ProvinceRain = await res.json();
      setRainData(d);
      if (!showShortTermRef.current) setRainForecastOpen(false);
    } else if (k === "humidity") {
      const res = await fetch(`${API_BASE}/api/provinces/${code}/humidity/`);
      if (!res.ok) throw new Error("Humidity API error");
      setHumidityData(await res.json());
    } else if (k === "cloud") {
      const d = await fetchJsonSafe<ProvinceCloud>(`${API_BASE}/api/provinces/${code}/cloud/`);
      setCloudData(d);
    }
  } catch (err) {
    console.error(err);
    setPopupError(`Không lấy được dữ liệu cho ${name ?? code}.`);

    setTempForecastOpen(false);
    setWindForecastOpen(false);
    setRainForecastOpen(false);
  } finally {
    setPopupLoading(false);
  }
};



  // events polygon
  const onEachProvince = (feature: any, layer: L.Layer) => {
    const props = feature.properties || {};
    const code = props.code as string;
    const name = props.name as string;

    if (name) {
      (layer as any).bindTooltip(name, {
        direction: "center",
        permanent: false,
        sticky: true,
        opacity: 0.95,
        className: "province-tooltip",
      });
    }

    layer.on({
      mouseover(e: LeafletMouseEvent) {
        const target = e.target as L.Path;
        const k = (activeLayerKeyRef.current ?? "temp") as WeatherLayerKey;
        target.setStyle(OVERLAY_STYLES[k].hover);
        target.bringToFront();
        (target as any).openTooltip();
      },
      mouseout(e: LeafletMouseEvent) {
        const target = e.target as L.Path;

        // ✅ nếu đang là tỉnh được chọn, giữ highlight
        if (selectedLayerRef.current && target === selectedLayerRef.current) {
          const k = (activeLayerKeyRef.current ?? "temp") as WeatherLayerKey;
          target.setStyle(OVERLAY_STYLES[k].hover);
          (target as any).closeTooltip();
          return;
        }

        if (provincesLayerRef.current) provincesLayerRef.current.resetStyle(target);
        (target as any).closeTooltip();
      },

      click: (e: LeafletMouseEvent) => {
        const k = activeLayerKeyRef.current;
        if (!k) return;
        openProvinceByCode(code, { name, latlng: e.latlng, zoom: false });
      },
    });
  };

  const activeTileUrl = useMemo(() => {
    if (activeLayerKey !== "rain") return null;
    if (!rainviewerPath) return null;
    return `${RAINVIEWER_TILE_HOST}${rainviewerPath}/256/{z}/{x}/{y}/2/1_1.png`;
  }, [activeLayerKey, rainviewerPath]);

  return (
    <div className="h-full w-full relative">
      <MapContainer
        ref={mapRef}
        center={center}
        zoom={5}
        maxZoom={12}
        className="h-full w-full z-0 owm-map"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> contributors'
        />

        {activeTileUrl && (
          <TileLayer
            key="tile-rainviewer"
            url={activeTileUrl}
            opacity={0.6}
            zIndex={70}
            attribution={"Weather radar data © RainViewer"}
          />
        )}

        {provinceGeojson && (
          <GeoJSON
            key={`overlay-${activeLayerKey}`}
            data={provinceGeojson as any}
            style={styleProvince}
            onEachFeature={onEachProvince}
            ref={provincesLayerRef as any}
          />
        )}


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
              <TemperaturePopup data={tempData} loading={popupLoading} error={popupError} />
            ) : activeLayerKey === "wind" ? (
              <WindPopup data={windData} loading={popupLoading} error={popupError} />
            ) : activeLayerKey === "rain" ? (
              <RainPopup data={rainData} loading={popupLoading} error={popupError} />
            ) : activeLayerKey === "humidity" ? (
              <HumidityPopup data={humidityData} loading={popupLoading} error={popupError} />
            ) : activeLayerKey === "cloud" ? (
              <CloudPopup data={cloudData} loading={popupLoading} error={popupError} />
            ) : (
              <div className="text-[12px]">Không hỗ trợ layer này.</div>
            )}
          </Popup>
        )}
      </MapContainer>

      {/* ✅ SearchBar góc trái */}
      <div className="absolute top-20 left-5 z-[1000]">
        <ProvinceSearchBar
          items={provinceIndex}
         onSelect={(it: ProvinceIndexItem) => openProvinceByCode(it.code, { name: it.name, zoom: true })}
          placeholder="Tìm theo tên tỉnh/thành..."
        />
      </div>

      {/* ✅ Drawer Temperature */}
      <TempDrawer
        open={tempForecastOpen && showShortTerm && activeLayerKey === "temp"}
        onClose={() => {
          setTempForecastOpen(false);
          showShortTermRef.current = false;
          setShowShortTerm(false);
        }}
        data={tempData}
      />

      {/* ✅ Drawer Wind */}
      <WindDrawer
        open={windForecastOpen && showShortTerm && activeLayerKey === "wind"}
        onClose={() => {
          setWindForecastOpen(false);
          showShortTermRef.current = false;
          setShowShortTerm(false);
        }}
        data={windData}
      />

      {/* ✅ Drawer Rain */}
      <RainDrawer
        open={rainForecastOpen && showShortTerm && activeLayerKey === "rain"}
        onClose={() => {
          setRainForecastOpen(false);
          showShortTermRef.current = false;
          setShowShortTerm(false);
        }}
        data={rainData}
      />

      {/* Floating Action Buttons + checkbox */}
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
              if (!k) return;

              if (k === "temp") setTempForecastOpen(true);
              else if (k === "wind") setWindForecastOpen(true);
              else if (k === "rain") setRainForecastOpen(true);
            }}
          />
          <span className="text-xs font-medium">Dự báo ngắn hạn</span>
        </label>

        <div className="flex flex-col gap-2 rounded-2xl bg-slate-900/80 p-2 shadow-lg backdrop-blur">
          <FabButton
            label="Nhiệt Độ"
            icon={<Thermometer className="h-4 w-4" />}
            active={activeLayerKey === "temp"}
            onClick={() => toggleLayer("temp")}
          />
          <FabButton
            label="Gió"
            icon={<WindIcon className="h-4 w-4" />}
            active={activeLayerKey === "wind"}
            onClick={() => toggleLayer("wind")}
          />
          <FabButton
            label="Mưa"
            icon={<Umbrella className="h-4 w-4" />}
            active={activeLayerKey === "rain"}
            onClick={() => toggleLayer("rain")}
          />
          <FabButton
            label="Độ Ẩm"
            icon={<Droplet className="h-4 w-4" />}
            active={activeLayerKey === "humidity"}
            onClick={() => toggleLayer("humidity")}
          />
          <FabButton
            label="Mây"
            icon={<Cloudy className="h-4 w-4" />}
            active={activeLayerKey === "cloud"}
            onClick={() => toggleLayer("cloud")}
          />
        </div>
      </div>
    </div>
  );
}

function FabButton({
  label,
  icon,
  active,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "flex items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-semibold transition",
        active ? "bg-white text-slate-900" : "bg-slate-800/60 text-slate-100 hover:bg-slate-700/70",
      ].join(" ")}
      type="button"
    >
      <span className="inline-flex items-center justify-center">{icon}</span>
      <span className="whitespace-nowrap">{label}</span>
    </button>
  );
}
