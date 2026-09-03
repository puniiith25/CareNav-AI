"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Stethoscope, ShieldCheck, AlertCircle, ArrowRight, Lock, Mail } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function DoctorLoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("dr.sharma@carenav.demo");
  const [password, setPassword] = useState("CareNavDemo!23");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Invalid doctor credentials.");
    } finally {
      setLoading(false);
    }
  }

  function handleQuickDemo() {
    setEmail("dr.sharma@carenav.demo");
    setPassword("CareNavDemo!23");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 py-12 text-slate-100 selection:bg-teal-500">
      <div className="w-full max-w-md space-y-6">
        {/* Brand */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-teal-600/20 text-teal-400 border border-teal-500/30 shadow-lg shadow-teal-950/50">
            <Stethoscope className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">CareNav AI</h1>
          <p className="text-sm text-teal-400 font-medium">Doctor Clinical Portal</p>
        </div>

        {/* Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
          {error && (
            <div className="flex items-center gap-2 p-3 text-xs bg-rose-950/40 border border-rose-800 text-rose-300 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Doctor Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="dr.sharma@carenav.demo"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-teal-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300">Password</label>
                <Link href="/doctor/forgot-password" className="text-xs text-teal-400 hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-teal-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-500 text-white font-semibold text-sm rounded-lg shadow-md transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <span>Sign In to Clinical Station</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Demo credential helper */}
          <div className="pt-4 border-t border-slate-800/80 text-xs text-slate-400 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-300">Synthetic Demo Account:</span>
              <button
                type="button"
                onClick={handleQuickDemo}
                className="text-teal-400 hover:text-teal-300 font-medium"
              >
                Auto-fill
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              Dr. Ananya Sharma (Cardiology) • Password: <code className="text-slate-300">CareNavDemo!23</code>
            </p>
          </div>
        </div>

        {/* Patient Switcher */}
        <div className="text-center text-xs text-slate-500">
          Not a doctor?{" "}
          <Link href="/login" className="text-teal-400 hover:underline font-medium">
            Patient Portal
          </Link>{" "}
          •{" "}
          <Link href="/hospital/login" className="text-blue-400 hover:underline font-medium">
            Hospital Admin Portal
          </Link>
        </div>
      </div>
    </div>
  );
}
