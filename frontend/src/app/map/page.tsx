"use client";

import { Suspense, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, MapPin, Phone, Star, AlertTriangle, Calendar, ChevronRight, List, Map as MapIcon, Check, Stethoscope } from "lucide-react";
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

function HealthcareMapContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>(searchParams.get("specialty") || "all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [viewMode, setViewMode] = useState<"map" | "list">("map");
  const [loading, setLoading] = useState(true);

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
      if (data.hospitals?.length) {
        setSelectedHospital(data.hospitals[0]);
      }
    } catch (err) {
      console.error("Error fetching hospitals:", err);
    } finally {
      setLoading(false);
    }
  }

  const filteredHospitals = hospitals.filter((h) => {
    const matchesQuery = !searchQuery || h.name.toLowerCase().includes(searchQuery.toLowerCase()) || (h.description || "").toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesQuery) return false;
    if (selectedSpecialty === "all") return true;
    if (selectedSpecialty === "emergency") return h.emergency_available;
    return h.departments?.some((d) => (d.name + (d.specialty_code || "")).toLowerCase().includes(selectedSpecialty.toLowerCase())) ||
      (h.description || "").toLowerCase().includes(selectedSpecialty.toLowerCase());
  });

  return (
    <div className="space-y-4 flex flex-col h-[calc(100vh-8.5rem)]">
      {/* Top Controls: Search + Categories */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-[#5c6b73]" />
          <input
            type="text"
            placeholder="Search Bengaluru hospitals, specialties, emergency..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-white border border-[#d9d1c3] text-sm text-[#15232b] placeholder-[#5c6b73] outline-none focus:ring-2 focus:ring-[#0f6e6e]"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
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
            onSelectHospital={(h) => setSelectedHospital(h)}
          />

          {/* Floating Hospital Quick Preview Card on Map */}
          {selectedHospital && (
            <div className="absolute bottom-4 left-4 right-4 md:right-auto md:max-w-sm bg-[#fffcf7] rounded-2xl border border-[#d9d1c3] p-4 shadow-xl z-[400] animate-in fade-in slide-in-from-bottom-3">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-sm text-[#15232b]">{selectedHospital.name}</h4>
                  <p className="text-xs text-[#5c6b73] flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-[#0f6e6e] shrink-0" />
                    <span className="truncate">{selectedHospital.address}</span>
                  </p>
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
                {selectedHospital.departments?.slice(0, 2).map((d) => (
                  <span key={d.id} className="text-[0.68rem] px-2 py-0.5 rounded bg-[#e4f2f1] text-[#0f6e6e] font-semibold">
                    {d.name}
                  </span>
                ))}
              </div>

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
                    <h4 className="font-bold text-sm text-[#15232b]">{h.name}</h4>
                    <p className="text-xs text-[#5c6b73] mt-0.5 line-clamp-1">{h.address}</p>
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
