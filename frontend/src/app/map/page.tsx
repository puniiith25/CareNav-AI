"use client";

import { Suspense, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, MapPin, Phone, Star, AlertTriangle, Calendar, ChevronRight, List, Map as MapIcon, Check, Stethoscope, Navigation, LocateFixed, Compass } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { api } from "@/lib/api";
import { Hospital } from "@/types";

// Dynamic import for Leaflet map component to prevent SSR hydration issues
const LeafletMap = dynamic(() => import("@/components/map/LeafletMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-[#f3efe6] rounded-2xl text-[#5c6b73] text-sm">
      Loading interactive map tiles...
    </div>
  ),
});

// Haversine formula to compute distance in km
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function HealthcareMapContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>(searchParams.get("specialty") || "all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [viewMode, setViewMode] = useState<"map" | "list">("map");
  const [loading, setLoading] = useState(true);

  // User Geolocation State
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [targetCenter, setTargetCenter] = useState<{ latitude: number; longitude: number; zoom?: number; timestamp?: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<"detecting" | "granted" | "denied" | "fallback">("detecting");
  const [locationName, setLocationName] = useState("Locating GPS...");

  const categories = [
    { label: "All Facilities", key: "all" },
    { label: "Cardiology", key: "cardiology" },
    { label: "Orthopedics", key: "orthopedics" },
    { label: "Neurology", key: "neurology" },
    { label: "Ophthalmology", key: "ophthalmology" },
    { label: "Pediatrics", key: "pediatrics" },
    { label: "Emergency 24/7", key: "emergency" },
    { label: "Diagnostics", key: "diagnostics" },
  ];

  // Request user GPS position & pan map to it
  function requestUserLocation() {
    setLocationStatus("detecting");
    if (typeof window !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const userCoords = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          };
          setUserLocation(userCoords);
          setTargetCenter({
            latitude: userCoords.latitude,
            longitude: userCoords.longitude,
            zoom: 14,
            timestamp: Date.now(),
          });
          setLocationStatus("granted");
          setLocationName("Your Current Location (GPS)");
        },
        (err) => {
          console.warn("Geolocation denied or unavailable:", err.message);
          // Fallback to central Bengaluru coordinates
          const fallbackCoords = { latitude: 12.9716, longitude: 77.5946 };
          setUserLocation(fallbackCoords);
          setTargetCenter({
            latitude: fallbackCoords.latitude,
            longitude: fallbackCoords.longitude,
            zoom: 14,
            timestamp: Date.now(),
          });
          setLocationStatus("fallback");
          setLocationName("Central Bengaluru (Default Demo)");
        },
        { timeout: 8000, enableHighAccuracy: true }
      );
    } else {
      const fallbackCoords = { latitude: 12.9716, longitude: 77.5946 };
      setUserLocation(fallbackCoords);
      setTargetCenter({
        latitude: fallbackCoords.latitude,
        longitude: fallbackCoords.longitude,
        zoom: 14,
        timestamp: Date.now(),
      });
      setLocationStatus("fallback");
      setLocationName("Central Bengaluru (Default Demo)");
    }
  }

  useEffect(() => {
    requestUserLocation();
  }, []);

  useEffect(() => {
    const spec = searchParams.get("specialty");
    if (spec) setSelectedSpecialty(spec);
    fetchHospitals();
  }, [searchParams]);

  async function fetchHospitals() {
    setLoading(true);
    try {
      const data = await api<{ hospitals: Hospital[] }>("/api/hospitals");
      setHospitals(data.hospitals || []);
    } catch (err) {
      console.error("Error fetching hospitals:", err);
    } finally {
      setLoading(false);
    }
  }

  // Calculate distance from user location and sort nearest first
  const hospitalsWithDistance = hospitals.map((h) => {
    let distanceKm = 0;
    if (userLocation) {
      distanceKm = calculateDistanceKm(userLocation.latitude, userLocation.longitude, h.latitude, h.longitude);
    }
    return {
      ...h,
      distanceKm,
    };
  });

  // Sort nearest first
  const sortedHospitals = [...hospitalsWithDistance].sort((a, b) => {
    return (a.distanceKm || 0) - (b.distanceKm || 0);
  });

  const filteredHospitals = sortedHospitals.filter((h) => {
    const matchesQuery =
      !searchQuery ||
      h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (h.description || "").toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesQuery) return false;
    if (selectedSpecialty === "all") return true;
    if (selectedSpecialty === "emergency") return h.emergency_available;
    return (
      h.departments?.some((d) => (d.name + (d.specialty_code || "")).toLowerCase().includes(selectedSpecialty.toLowerCase())) ||
      (h.description || "").toLowerCase().includes(selectedSpecialty.toLowerCase())
    );
  });

  // Select nearest hospital automatically on first load or list change
  useEffect(() => {
    if (filteredHospitals.length > 0 && !selectedHospital) {
      setSelectedHospital(filteredHospitals[0]);
    }
  }, [filteredHospitals, selectedHospital]);

  return (
    <div className="space-y-4 flex flex-col h-[calc(100vh-8.5rem)]">
      {/* Top Controls: Search with Suggestions Dropdown + GPS Location Pill + Categories */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between relative z-30">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-[#5c6b73]" />
          <input
            type="text"
            placeholder="Search Bengaluru hospitals, specialties, emergency..."
            value={searchQuery}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setTimeout(() => setIsSearchFocused(false), 250)}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-white border border-[#d9d1c3] text-sm text-[#15232b] placeholder-[#5c6b73] outline-none focus:ring-2 focus:ring-[#0f6e6e] shadow-xs"
          />

          {/* Autocomplete / Suggested Hospitals Dropdown */}
          {isSearchFocused && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-[#d9d1c3] rounded-2xl shadow-xl overflow-hidden z-50 max-h-72 overflow-y-auto animate-in fade-in slide-in-from-top-2">
              <div className="p-2.5 bg-[#fbf9f4] border-b border-[#ece6d9] text-[11px] font-bold text-[#5c6b73] uppercase tracking-wider flex items-center justify-between">
                <span>Hospital & Specialty Suggestions</span>
                <span className="text-[#0f6e6e] font-semibold">{filteredHospitals.length} matches</span>
              </div>
              <div className="p-1">
                {filteredHospitals.slice(0, 6).map((h) => (
                  <button
                    key={h.id}
                    type="button"
                    onMouseDown={() => {
                      setSelectedHospital(h);
                      setSearchQuery(h.name);
                      setTargetCenter({
                        latitude: h.latitude,
                        longitude: h.longitude,
                        zoom: 15,
                        timestamp: Date.now(),
                      });
                      setIsSearchFocused(false);
                    }}
                    className="w-full text-left p-2.5 hover:bg-[#e4f2f1] rounded-xl transition-colors flex items-center justify-between group"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="text-xs font-bold text-[#15232b] group-hover:text-[#0f6e6e] truncate">{h.name}</p>
                      <p className="text-[11px] text-[#5c6b73] truncate flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-[#0f6e6e] shrink-0" />
                        <span className="truncate">{h.address}</span>
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      {h.emergency_available && (
                        <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">
                          24/7 ER
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
          {/* User Location Pill */}
          <button
            onClick={requestUserLocation}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#e4f2f1] text-[#0f6e6e] border border-[#bce2df] text-xs font-semibold hover:bg-[#d0ecea] transition-all shadow-2xs"
            title="Recalculate Nearest from Your Current GPS Location"
          >
            <LocateFixed className="w-3.5 h-3.5 text-[#0f6e6e] animate-pulse" />
            <span className="truncate max-w-[160px] sm:max-w-xs">{locationName}</span>
          </button>

          <div className="flex bg-white p-1 rounded-xl border border-[#d9d1c3]">
            <button
              onClick={() => setViewMode("map")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                viewMode === "map" ? "bg-[#0f6e6e] text-white" : "text-[#5c6b73] hover:text-[#15232b]"
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>Map</span>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                viewMode === "list" ? "bg-[#0f6e6e] text-white" : "text-[#5c6b73] hover:text-[#15232b]"
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>List ({filteredHospitals.length})</span>
            </button>
          </div>
      </div>

      {/* Quick Suggested Hospital Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
        <span className="text-[11px] font-bold text-[#5c6b73] shrink-0">Suggestions:</span>
        {[
          { name: "Apollo Bannerghatta", query: "Apollo" },
          { name: "Manipal Hospital", query: "Manipal" },
          { name: "Fortis Cunningham", query: "Fortis" },
          { name: "Aster CMI", query: "Aster" },
          { name: "Bengaluru Heart", query: "Bengaluru Heart" },
          { name: "24/7 Emergency", query: "emergency" },
        ].map((sug) => (
          <button
            key={sug.name}
            onClick={() => {
              setSearchQuery(sug.query);
              const found = hospitals.find((h) => h.name.toLowerCase().includes(sug.query.toLowerCase()));
              if (found) {
                setSelectedHospital(found);
                setTargetCenter({
                  latitude: found.latitude,
                  longitude: found.longitude,
                  zoom: 15,
                  timestamp: Date.now(),
                });
              }
            }}
            className="px-2.5 py-1 rounded-lg bg-white border border-[#d9d1c3] text-[#15232b] hover:bg-[#e4f2f1] hover:border-[#0f6e6e] text-[11px] font-medium whitespace-nowrap transition-colors shadow-2xs"
          >
            {sug.name}
          </button>
        ))}
      </div>

      {/* Category Filter Chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((c) => (
          <button
            key={c.key}
            onClick={() => setSelectedSpecialty(c.key)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedSpecialty === c.key
                ? "bg-[#0f6e6e] text-white shadow-xs"
                : "bg-white border border-[#d9d1c3] text-[#15232b] hover:bg-[#e4f2f1]"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Map & Preview Split Screen */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 relative min-h-0">
        {/* Interactive Map View */}
        <div className={`flex-1 card overflow-hidden relative ${viewMode === "list" ? "hidden lg:block" : "block"}`}>
          <LeafletMap
            hospitals={filteredHospitals}
            selectedHospital={selectedHospital}
            userLocation={userLocation}
            targetCenter={targetCenter}
            onSelectHospital={(h) => setSelectedHospital(h)}
          />

          {/* Floating Hospital Quick Preview Card on Map */}
          {selectedHospital && (
            <div className="absolute bottom-4 left-4 right-4 md:right-auto md:max-w-sm bg-[#fffcf7] rounded-2xl border border-[#d9d1c3] p-4 shadow-xl z-[400] animate-in fade-in slide-in-from-bottom-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-[#15232b]">{selectedHospital.name}</h4>
                  </div>
                  <p className="text-xs text-[#5c6b73] flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-[#0f6e6e] shrink-0" />
                    <span className="truncate">{selectedHospital.address}</span>
                  </p>
                  {(selectedHospital as any).distanceKm !== undefined && (
                    <div className="flex items-center gap-1 text-[11px] font-bold text-[#0f6e6e] mt-1">
                      <Navigation className="w-3 h-3" />
                      <span>{((selectedHospital as any).distanceKm).toFixed(1)} km away from you</span>
                    </div>
                  )}
                </div>
                {selectedHospital.rating && (
                  <span className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200 shrink-0">
                    <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                    <span>{selectedHospital.rating}</span>
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-1.5 my-2.5">
                {selectedHospital.emergency_available && (
                  <span className="text-[0.68rem] font-bold px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">
                    24/7 Emergency
                  </span>
                )}
                {selectedHospital.departments?.slice(0, 3).map((d) => (
                  <span key={d.id} className="text-[0.68rem] px-2 py-0.5 rounded bg-[#e4f2f1] text-[#0f6e6e] font-semibold">
                    {d.name}
                  </span>
                ))}
              </div>

              {selectedHospital.description && (
                <p className="text-[11px] text-[#5c6b73] line-clamp-2 mb-2 leading-relaxed">
                  {selectedHospital.description}
                </p>
              )}

              {selectedHospital.phone && (
                <div className="text-[11px] text-[#15232b] flex items-center gap-1.5 mb-2 font-medium">
                  <Phone className="w-3 h-3 text-[#0f6e6e]" />
                  <span>{selectedHospital.phone}</span>
                </div>
              )}

              <div className="flex items-center gap-2 pt-2 border-t border-[#d9d1c3]">
                <button
                  onClick={() => router.push(`/hospitals/${selectedHospital.id}`)}
                  className="btn btn-primary text-xs flex-1 justify-center"
                >
                  View Hospital & Doctors
                </button>
                <a
                  href={`https://maps.google.com/?q=${selectedHospital.latitude},${selectedHospital.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-ghost text-xs px-3 bg-white"
                >
                  Directions
                </a>
              </div>
            </div>
          )}
        </div>

        {/* List Sidebar View */}
        <div
          className={`w-full lg:w-96 card p-4 overflow-y-auto space-y-3 ${
            viewMode === "map" ? "hidden lg:block" : "block"
          }`}
        >
          <div className="font-bold text-sm text-[#15232b] flex items-center justify-between">
            <span>Verified Healthcare Providers</span>
            <span className="text-xs text-[#5c6b73]">{filteredHospitals.length} in Bengaluru</span>
          </div>

          {filteredHospitals.map((h) => {
            const isSelected = selectedHospital?.id === h.id;
            return (
              <div
                key={h.id}
                onClick={() => setSelectedHospital(h)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? "bg-[#e4f2f1]/40 border-[#0f6e6e] shadow-xs"
                    : "bg-white border-[#d9d1c3] hover:border-[#0f6e6e]/60"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="font-bold text-sm text-[#15232b]">{h.name}</h4>
                      {filteredHospitals[0]?.id === h.id && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                          Nearest
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#5c6b73] mt-0.5 line-clamp-1">{h.address}</p>
                    {(h as any).distanceKm !== undefined && (
                      <span className="inline-block text-[11px] font-bold text-[#0f6e6e] mt-1">
                        📍 {((h as any).distanceKm).toFixed(1)} km away
                      </span>
                    )}
                  </div>
                  {h.rating && (
                    <span className="flex items-center gap-1 text-xs font-bold text-amber-800 shrink-0">
                      <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                      <span>{h.rating}</span>
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-1 mt-2">
                  {h.emergency_available && (
                    <span className="text-[0.65rem] font-bold px-1.5 py-0.5 bg-red-100 text-red-700 rounded">
                      Emergency
                    </span>
                  )}
                  {h.departments?.slice(0, 3).map((d) => (
                    <span key={d.id} className="text-[0.65rem] px-1.5 py-0.5 bg-[#f3efe6] text-[#15232b] rounded">
                      {d.name}
                    </span>
                  ))}
                </div>

                <div className="mt-3 pt-2 border-t border-[#d9d1c3]/50 flex items-center justify-between">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/hospitals/${h.id}`);
                    }}
                    className="text-xs font-semibold text-[#0f6e6e] hover:underline flex items-center gap-1"
                  >
                    <span>Doctors & Booking</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                  <span className="text-[0.7rem] text-[#5c6b73]">Demo Coordinates</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function HealthcareMapPage() {
  return (
    <AppShell>
      <Suspense fallback={<div className="py-20 text-center text-sm text-[#5c6b73]">Loading healthcare map...</div>}>
        <HealthcareMapContent />
      </Suspense>
    </AppShell>
  );
}
