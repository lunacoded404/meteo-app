"use client";

import React, { useMemo } from "react";
import { Marker, Tooltip } from "react-leaflet";
import type { LeafletMouseEvent } from "leaflet";
import L from "leaflet";

import type { ProvinceIndexApiItem } from "../hooks/useProvinceIndex";
import type { WeatherLayerKey } from "../MapClient";

const ICON_BY_LAYER: Record<WeatherLayerKey, string> = {
  temp: "/temp_icon.png",
  wind: "/wind_icon.png",
  humidity: "/humid_icon.png",
  rain: "/rain_icon.png",
  cloud: "/cloud_icon.png",
};

function makePngIcon(src: string) {
  const size: [number, number] = [28, 28];
  return L.icon({
    iconUrl: src,
    iconSize: size,
    iconAnchor: [size[0] / 2, size[1] / 2],
    popupAnchor: [0, -size[1] / 2],
    tooltipAnchor: [0, -size[1] / 2],
  });
}

export default function ProvinceCentroidLayer({
  items,
  layerKey,
  onPick,
}: {
  items: ProvinceIndexApiItem[];
  layerKey: WeatherLayerKey;
  onPick: (p: ProvinceIndexApiItem, latlng?: L.LatLng) => void;
}) {
  const icon = useMemo(() => makePngIcon(ICON_BY_LAYER[layerKey] ?? "/temp_icon.png"), [layerKey]);

  return (
    <>
      {items.map((p) => (
        <Marker
          key={p.code}
          position={[p.centroid.lat, p.centroid.lon]}
          icon={icon}
          eventHandlers={{
            click: (e: LeafletMouseEvent) => onPick(p, e.latlng),
          }}
        >
          <Tooltip direction="top" offset={[0, -12]} opacity={0.95} sticky>
            {p.name}
          </Tooltip>
        </Marker>
      ))}
    </>
  );
}
