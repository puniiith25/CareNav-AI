"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import { Hospital } from "@/types";

// Custom modern SVG Pin Icons for Leaflet
const createPinIcon = (isEmergency: boolean, isSelected: boolean) => {
  const color = isEmergency ? "#9b2c2c" : isSelected ? "#0b4f4f" : "#0f6e6e";
  const size = isSelected ? 38 : 30;

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}" fill="${color}" stroke="#ffffff" stroke-width="1.5">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>
  `;

  return L.divIcon({
    className: "custom-leaflet-marker",
    html: svg,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
};

export default function LeafletMap({
  hospitals,
  selectedHospital,
  onSelectHospital,
}: {
  hospitals: Hospital[];
  selectedHospital: Hospital | null;
  onSelectHospital: (h: Hospital) => void;
}) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [id: string]: L.Marker }>({});

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current).setView([12.9716, 77.5946], 13);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Clear old markers
    Object.values(markersRef.current).forEach((m) => m.remove());
    markersRef.current = {};

    // Add new markers
    hospitals.forEach((h) => {
      const isSelected = selectedHospital?.id === h.id;
      const marker = L.marker([h.latitude, h.longitude], {
        icon: createPinIcon(h.emergency_available, isSelected),
      })
        .addTo(map)
        .bindPopup(
          `<div style="font-family:sans-serif; padding:2px; max-width:200px;">
            <div style="font-weight:bold; font-size:12px; color:#15232b;">${h.name}</div>
            <div style="font-size:11px; color:#5c6b73; margin-top:2px;">${h.address}</div>
            ${h.emergency_available ? '<div style="color:#9b2c2c; font-weight:bold; font-size:10px; margin-top:4px;">🚨 24/7 Emergency</div>' : ""}
          </div>`
        )
        .on("click", () => {
          onSelectHospital(h);
        });

      markersRef.current[h.id] = marker;
    });

    return () => {
      // Keep map alive during tab transitions
    };
  }, [hospitals]);

  useEffect(() => {
    if (selectedHospital && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([selectedHospital.latitude, selectedHospital.longitude], 14, {
        duration: 0.8,
      });
      const marker = markersRef.current[selectedHospital.id];
      if (marker) {
        marker.openPopup();
      }
    }
  }, [selectedHospital]);

  return (
    <div
      ref={mapContainerRef}
      className="w-full h-full min-h-[400px] rounded-2xl z-0"
      style={{ height: "100%", width: "100%" }}
    />
  );
}
