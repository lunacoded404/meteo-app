// src/components/discover/overview/DetailsSection.tsx
"use client";

import React from "react";
import { useDetailsBundle } from "./details/useDetailsBundle";
import DetailsCard from "./details/DetailsCard";

export default function DetailsSection() {
  const { vm, loading, err } = useDetailsBundle();
  return <DetailsCard vm={vm} loading={loading} err={err} />;
}
