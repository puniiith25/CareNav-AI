"use client";

import { useState } from "react";
import Link from "next/link";
import { Stethoscope, ArrowLeft, Mail, CheckCircle } from "lucide-react";

export default function DoctorForgotPasswordPage() {
  const [email, setEmail] = useState("dr.sharma@carenav.demo");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 py-12 text-slate-100">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-teal-600/20 text-teal-400 border border-teal-500/30">
            <Stethoscope className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Reset Doctor Password</h1>
          <p className="text-xs text-slate-400">CareNav Doctor Clinical Portal</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
          {submitted ? (
            <div className="text-center space-y-4">
              <CheckCircle className="w-10 h-10 text-teal-400 mx-auto" />
              <p className="text-sm text-slate-300">
                In prototype mode, use default synthetic credential <code className="text-teal-300">CareNavDemo!23</code>.
              </p>
              <Link
                href="/doctor/login"
                className="inline-block w-full py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs rounded-lg transition-colors"
              >
                Back to Sign In
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Registered Doctor Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-teal-500 transition-colors"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-semibold text-sm rounded-lg shadow-md transition-colors"
              >
                Send Password Reset Instructions
              </button>
            </form>
          )}

          <div className="text-center">
            <Link href="/doctor/login" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-teal-400 transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
