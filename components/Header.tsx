// src/components/Header.tsx
"use client";

import React from "react";
import { MapPin } from "lucide-react";
import CardNav, { CardNavItem } from "./CardNav";
import SplitText from "./SplitText";

const Header: React.FC = () => {
  const items: CardNavItem[] = [
    {
      label: "TRANG CHỦ",
      bgColor: "#0D0716",
      textColor: "#ffffff",
      links: [{ label: "Giới Thiệu", href: "/home", ariaLabel: "Go to Weather page" }],
    },
    {
      label: "KHÁM PHÁ",
      bgColor: "#170D27",
      textColor: "#ffffff",
      links: [
        { label: "Tổng Quan", href: "/discover/overview", ariaLabel: "Go to Discover page" },
        { label: "Dự Báo Theo Giờ", href: "/discover/hourly", ariaLabel: "Go to Discover page" },
        { label: "Dự Báo Theo Ngày", href: "/discover/day", ariaLabel: "Go to Discover page" },
      ],
    },
    {
      label: "BẢN ĐỒ",
      bgColor: "#271E37",
      textColor: "#ffffff",
      links: [{ label: "Bản Đồ Thời Tiết", href: "/map", ariaLabel: "Go to Map page" }],
    },
  ];

  return (
    <header className="w-full">
      <CardNav
        className="mx-auto w-full max-w-[800px]"
        logo={
          <div className="flex items-center gap-2">
            <MapPin className="w-9 h-9 sm:w-10 sm:h-10 text-[var(--meteo-color)]" />
            <SplitText text="Weather App" className="text-xl sm:text-2xl font-semibold text-center text-black" />
          </div>
        }
        logoAlt="Welcome to my WebGIS!"
        items={items}
        baseColor="#fff"
        menuColor="#000"
        buttonBgColor="#111"
        buttonTextColor="#fff"
        ease="power3.out"
      />
    </header>
  );
};

export default Header;
