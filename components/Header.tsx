"use client";

import React from "react";
import { MapPin } from "lucide-react";
import CardNav, { CardNavItem } from "./CardNav";
import SplitText from "./SplitText";



const Header: React.FC = () => {
  const items: CardNavItem[] = [
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
