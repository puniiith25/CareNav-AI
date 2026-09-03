"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bot, ArrowRight, ShieldCheck } from "lucide-react";
import { api, setToken } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function RegisterPage() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [dob, setDob] = useState("1992-04-15");
  const [phone, setPhone] = useState("+91 98765 43210");
  const [language, setLanguage] = useState("en");
  const [loading, setLoading] = useState(false);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api<{ access_token: string }>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          full_name: fullName,
          email,
          password,
          date_of_birth: dob,
          phone,
          preferred_language: language,
        }),
      });
      setToken(res.access_token);
      await refreshUser();
      router.push("/");
    } catch (err: any) {
      alert(`Registration failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f3efe6] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-[#0f6e6e] text-white flex items-center justify-center font-bold text-xl mx-auto shadow-md">
            CN
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#15232b]">Create Patient Account</h1>
          <p className="text-xs text-[#5c6b73]">
            Join CareNav AI to manage your personal health records and navigation.
          </p>
        </div>

        <form onSubmit={handleRegister} className="card p-6 md:p-8 bg-white space-y-4 shadow-sm">
          <div>
            <label className="text-xs font-bold text-[#5c6b73] block mb-1">Full Name</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Arjun Mehta"
              className="w-full p-2.5 rounded-xl bg-[#f3efe6] border border-[#d9d1c3] text-sm text-[#15232b] outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-[#5c6b73] block mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="patient@example.com"
              className="w-full p-2.5 rounded-xl bg-[#f3efe6] border border-[#d9d1c3] text-sm text-[#15232b] outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-[#5c6b73] block mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-[#f3efe6] border border-[#d9d1c3] text-sm text-[#15232b] outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-[#5c6b73] block mb-1">Date of Birth</label>
              <input
                type="date"
                required
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-[#f3efe6] border border-[#d9d1c3] text-xs text-[#15232b] outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[#5c6b73] block mb-1">Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-[#f3efe6] border border-[#d9d1c3] text-xs text-[#15232b] outline-none"
              >
                <option value="en">English</option>
                <option value="hi">Hindi</option>
                <option value="kn">Kannada</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary text-xs w-full justify-center mt-2"
          >
            {loading ? "Creating Account..." : "Create Patient Account"}
          </button>

          <div className="pt-2 text-center text-xs text-[#5c6b73]">
            Already have an account?{" "}
            <Link href="/login" className="text-[#0f6e6e] font-bold hover:underline">
              Sign In
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
