'use client';
import dynamic from "next/dynamic";

const Map = dynamic(() => import("@/components/Map"), {
  ssr: false, // quan trọng: tránh lỗi window is not defined
});

export default function MapTest() {
  return (
    <main style={{ width: "100%", height: "100vh" }}>
      <Map />
    </main>
  );
}
