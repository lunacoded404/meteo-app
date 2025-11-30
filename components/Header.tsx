"use client";

import CardNav, { CardNavItem } from "@/components/CardNav";
import { MapPinned } from "lucide-react";
import SplitText from "@/components/SplitText";

const navItems: CardNavItem[] = [
  {
    label: "Discover",
    bgColor: "#0D0716",
    textColor: "#ffffff",
    links: [
        {
        label: "Overview",
        href: "/discover/overview",
        ariaLabel: "Go to Discover page",
        },
        {
        label: "Forecast",
        href: "/discover/forecast",
        ariaLabel: "Go to Discover page",
        },
        {
        label: "Login",
        href: "/discover/login",
        ariaLabel: "Go to Discover page",
        },
    ],
  },
  {
    label: "Weather",
    bgColor: "#170D27",
    textColor: "#ffffff",
    links: [
      {
        label: "Temperature",
        href: "/weather/temperature",
        ariaLabel: "Go to Weather page",
      },
            {
        label: "Humidity",
        href: "/weather/humidity",
        ariaLabel: "Go to Weather page",
      },
            {
        label: "Windy ",
        href: "/weather/windy",
        ariaLabel: "Go to Weather page",
      },
            {
        label: "Cloud",
        href: "/weather/cloud",
        ariaLabel: "Go to Weather page",
      },
            {
        label: "Rain",
        href: "/weather/rain",
        ariaLabel: "Go to Weather page",
      },
    ],
  },
  {
    label: "Map",
    bgColor: "#271E37",
    textColor: "#ffffff",
    links: [
      {
        label: "Map",
        href: "/map",
        ariaLabel: "Go to Map page",
      },
    ],
  },
];

const Header = () => {
  return (
    <header className="relative z-[50]">
      <CardNav
        logo={
          <div className="flex items-center gap-3">
            <MapPinned className="h-10 w-10 text-sky-400" />
            <SplitText
              text="Weather App"
              splitType="chars"
              className="text-lg md:text-xl font-semibold text-gray-900"
              stagger={0.03}
              textAlign="left"
            />
          </div>
        }
        logoAlt="Welcome to my WebGIS!!"
        items={navItems}
        baseColor="#ffffff"
        menuColor="#000000"
        buttonBgColor="#111827"
        buttonTextColor="#f9fafb"
        ease="power3.out"
      />
    </header>
  );
};

export default Header;
