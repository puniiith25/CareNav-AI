"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Stethoscope, MapPin, Calendar, Clock, Award, Globe, ShieldCheck, ChevronRight } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { api } from "@/lib/api";
import { Doctor } from "@/types";

export default function DoctorDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDoctor() {
      try {
        const res = await api<Doctor>(`/api/doctors/${id}`);
        setDoctor(res);
      } catch (err) {
        console.error("Error loading doctor:", err);
      } finally {
        setLoading(false);
      }
    }
    if (id) loadDoctor();
  }, [id]);

  if (loading) {
    return (
      <AppShell>
        <div className="py-20 text-center text-sm text-[#5c6b73]">Loading doctor profile...</div>
      </AppShell>
    );
  }

  if (!doctor) {
    return (
      <AppShell>
        <div className="py-20 text-center text-sm text-[#5c6b73]">Doctor could not be found.</div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6 max-w-4xl mx-auto">
        <button
          onClick={() => router.back()}
          className="text-xs font-semibold text-[#0f6e6e] hover:underline flex items-center gap-1"
        >
          ← Back
        </button>

        <div className="card p-6 md:p-8 bg-white space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 pb-6 border-b border-[#d9d1c3]/60">
            <div className="w-16 h-16 rounded-2xl bg-[#0f6e6e]/10 text-[#0f6e6e] flex items-center justify-center font-bold text-xl border border-[#0f6e6e]/20">
              {doctor.full_name.replace("Dr. ", "").split(" ").map((n) => n[0]).join("")}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-[#15232b]">{doctor.full_name}</h1>
              <div className="text-sm font-semibold text-[#0f6e6e] mt-0.5">{doctor.specialty}</div>
              <p className="text-xs text-[#5c6b73] mt-1">{doctor.qualifications}</p>
            </div>
            <button
              onClick={() => router.push(`/appointments/book?doctorId=${doctor.id}&hospitalId=${doctor.hospital_id}`)}
              className="btn btn-primary text-sm shrink-0"
            >
              Book Consultation
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#5c6b73] mb-1">
                  Hospital & Department
                </h3>
                <div className="text-sm font-semibold text-[#15232b]">{doctor.hospital?.name}</div>
                <div className="text-xs text-[#5c6b73] flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-[#0f6e6e]" />
                  <span>{doctor.hospital?.address}</span>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#5c6b73] mb-1">
                  Clinical Experience
                </h3>
                <div className="text-sm text-[#15232b]">{doctor.experience_years} years of specialized practice</div>
              </div>

              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#5c6b73] mb-1">
                  Spoken Languages
                </h3>
                <div className="text-sm text-[#15232b]">{doctor.languages?.join(", ")}</div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#5c6b73] mb-1">
                  About the Specialist
                </h3>
                <p className="text-xs text-[#15232b] leading-relaxed">{doctor.bio}</p>
              </div>

              <div className="p-4 rounded-xl bg-[#e4f2f1] border border-[#bce2df] space-y-1">
                <div className="text-xs font-bold text-[#0b4f4f] flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#0f6e6e]" />
                  <span>Privacy-First Consultation</span>
                </div>
                <p className="text-xs text-[#15232b]">
                  When booking with this clinician, you control exactly which medical reports or timeline events to share.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
