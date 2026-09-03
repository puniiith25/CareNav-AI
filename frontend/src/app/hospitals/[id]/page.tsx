"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  MapPin,
  Phone,
  Star,
  Calendar,
  Clock,
  ShieldCheck,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  User,
  Stethoscope,
  Building,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { api } from "@/lib/api";
import { Hospital, Doctor, Department } from "@/types";

export default function HospitalDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [data, setData] = useState<{
    hospital: Hospital;
    departments: Department[];
    doctors: Doctor[];
    why_this_hospital: string[];
    services: any[];
    facilities: string[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHospital() {
      try {
        const res = await api<any>(`/api/hospitals/${id}`);
        setData(res);
      } catch (err) {
        console.error("Error loading hospital:", err);
      } finally {
        setLoading(false);
      }
    }
    if (id) loadHospital();
  }, [id]);

  if (loading) {
    return (
      <AppShell>
        <div className="py-20 text-center text-sm text-[#5c6b73]">Loading hospital profile...</div>
      </AppShell>
    );
  }

  if (!data?.hospital) {
    return (
      <AppShell>
        <div className="py-20 text-center text-sm text-[#5c6b73]">Hospital could not be found.</div>
      </AppShell>
    );
  }

  const { hospital, departments, doctors, why_this_hospital } = data;

  return (
    <AppShell>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Breadcrumb Back */}
        <button
          onClick={() => router.push("/map")}
          className="text-xs font-semibold text-[#0f6e6e] hover:underline flex items-center gap-1"
        >
          ← Back to Healthcare Map
        </button>

        {/* Hospital Hero Banner */}
        <div className="card p-6 md:p-8 bg-white space-y-4">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#e4f2f1] text-[#0b4f4f]">
                  Verified Facility
                </span>
                {hospital.emergency_available && (
                  <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-red-100 text-red-700">
                    24/7 Emergency
                  </span>
                )}
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#15232b] mt-2">{hospital.name}</h1>
              <p className="text-sm text-[#5c6b73] flex items-center gap-1.5 mt-1">
                <MapPin className="w-4 h-4 text-[#0f6e6e] shrink-0" />
                <span>{hospital.address}</span>
              </p>
            </div>

            {hospital.rating && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 self-start">
                <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                <span className="font-bold text-sm">{hospital.rating}</span>
                <span className="text-xs text-amber-700">(Verified rating)</span>
              </div>
            )}
          </div>

          <p className="text-sm text-[#15232b] leading-relaxed pt-2 border-t border-[#d9d1c3]/60">
            {hospital.description}
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <a
              href={`https://maps.google.com/?q=${hospital.latitude},${hospital.longitude}`}
              target="_blank"
              rel="noreferrer"
              className="btn btn-primary text-xs"
            >
              Get Directions
            </a>
            <a href={`tel:${hospital.phone}`} className="btn btn-ghost text-xs bg-[#f3efe6]">
              <Phone className="w-3.5 h-3.5 mr-1" />
              <span>Call Facility</span>
            </a>
          </div>
        </div>

        {/* AI Explanation: Why This Hospital? */}
        {why_this_hospital && why_this_hospital.length > 0 && (
          <div className="card p-5 bg-[#e4f2f1]/50 border-[#bce2df] space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#0b4f4f]">
              <ShieldCheck className="w-4 h-4 text-[#0f6e6e]" />
              <span>CareNav AI Provider Match Summary</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {why_this_hospital.map((point, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-[#15232b]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#0f6e6e] shrink-0" />
                  <span>{point}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Doctor Directory Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#15232b] flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-[#0f6e6e]" />
              <span>Doctors & Specialists at this Hospital</span>
            </h2>
            <span className="text-xs text-[#5c6b73]">{doctors.length} available</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {doctors.map((doc) => (
              <div key={doc.id} className="card p-5 bg-white flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#0f6e6e]/10 text-[#0f6e6e] flex items-center justify-center font-bold text-sm border border-[#0f6e6e]/20">
                        {doc.full_name.replace("Dr. ", "").split(" ").map((n) => n[0]).join("")}
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-[#15232b]">{doc.full_name}</h3>
                        <div className="text-xs font-semibold text-[#0f6e6e]">{doc.specialty}</div>
                      </div>
                    </div>
                    {doc.experience_years && (
                      <span className="text-[0.7rem] font-semibold px-2 py-0.5 rounded bg-[#f3efe6] text-[#5c6b73]">
                        {doc.experience_years} yrs exp
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-[#5c6b73] mt-3 line-clamp-2">{doc.bio}</p>

                  <div className="flex flex-wrap gap-1.5 mt-3 text-[0.7rem] text-[#5c6b73]">
                    <span className="font-semibold text-[#15232b]">Languages:</span>
                    <span>{doc.languages?.join(", ")}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#d9d1c3]/60 flex items-center gap-2">
                  <button
                    onClick={() => router.push(`/doctors/${doc.id}`)}
                    className="btn btn-ghost text-xs flex-1 justify-center bg-white"
                  >
                    View Doctor Profile
                  </button>
                  <button
                    onClick={() => router.push(`/appointments/book?doctorId=${doc.id}&hospitalId=${hospital.id}`)}
                    className="btn btn-primary text-xs flex-1 justify-center"
                  >
                    Book Appointment
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
