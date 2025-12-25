"use client";

import React from "react";
import { MapPin } from "lucide-react";
import CardNav, { CardNavItem } from "./CardNav";
import SplitText from "./SplitText";



const Header: React.FC = () => {
  const items: CardNavItem[] = [
     {
    label: "KHÁM PHÁ",
    bgColor: "#0D0716",
    textColor: "#ffffff",
    links: [
      {
        label: "Tổng Quan",
        href: "/discover/overview",
        ariaLabel: "Go to Discover page",
      },
      {
        label: "Dự Báo Theo Giờ",
        href: "/discover/hourly",
        ariaLabel: "Go to Discover page",
      },
      {
        label: "Dự Báo Theo Ngày",
        href: "/discover/day",
        ariaLabel: "Go to Discover page",
      },
      {
        label: "Đăng Nhập",
        href: "/discover/login",
        ariaLabel: "Go to Discover page",
      },
    ],
  },
  {
    label: "THỜI TIẾT",
    bgColor: "#170D27",
    textColor: "#ffffff",
    links: [
      {
        label: "Nhiệt Độ",
        href: "/weather/temperature",
        ariaLabel: "Go to Weather page",
      },
      {
        label: "Độ Ẩm",
        href: "/weather/humidity",
        ariaLabel: "Go to Weather page",
      },
      {
        label: "Gió",
        href: "/weather/windy",
        ariaLabel: "Go to Weather page",
      },
      {
        label: "Mây",
        href: "/weather/cloud",
        ariaLabel: "Go to Weather page",
      },
      {
        label: "Mưa",
        href: "/weather/rain",
        ariaLabel: "Go to Weather page",
      },
    ],
  },
  {
    label: "BẢN ĐỒ",
    bgColor: "#271E37",
    textColor: "#ffffff",
    links: [
      {
        label: "Bản Đồ Thời Tiết",
        href: "/map",
        ariaLabel: "Go to Map page",
      },
    ],
  },

  ];

  return (
    <header className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-[800px]">
      <CardNav
        logo={
          <div className="flex items-center gap-2">
            <MapPin className="w-10 h-10 text-[var(--meteo-color)]" />
            <SplitText
                text="Weather App"
                className="text-2xl font-semibold text-center text-black"
            />
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
