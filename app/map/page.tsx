'use client';
import dynamic from "next/dynamic";


const MapClient = dynamic(() => import("@/components/map/MapClient"), {
  ssr: false,
  loading: () => (
    <div className="h-[100vh] w-full flex items-center justify-center bg-slate-900">
      <p className="text-sm text-slate-300">Đang tải bản đồ...</p>
    </div>
  ),
});

export default function Map() {
  const handleSearch = (value: string) => {
    console.log("Từ khóa tìm kiếm:", value);
  };

  return (

    <div className="w-screen px-0">
      <div className="h-[82vh] min-h-[520px]">
        <MapClient />
      </div>
    </div>



  );
}


