"use client";

import React, { useMemo } from "react";
import { TileLayer } from "react-leaflet";

const RAINVIEWER_TILE_HOST = "https://tilecache.rainviewer.com";

export default function RainviewerLayer({
  active,
  rainviewerPath,
}: {
  active: boolean;
  rainviewerPath: string | null;
}) {
  const activeTileUrl = useMemo(() => {
    if (!active) return null;
    if (!rainviewerPath) return null;
    return `${RAINVIEWER_TILE_HOST}${rainviewerPath}/256/{z}/{x}/{y}/2/1_1.png`;
  }, [active, rainviewerPath]);

  if (!activeTileUrl) return null;

  return (
    <TileLayer
      key="tile-rainviewer"
      url={activeTileUrl}
      opacity={0.6}
      zIndex={70}
      attribution={"Weather radar data © RainViewer"}
    />
  );
}
