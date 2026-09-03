"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bot, ArrowRight, ShieldCheck, Sparkles, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const router = useRouter();
  const { login, loginDemo } = useAuth();
  const [email, setEmail] = useState("demo.patient@carenav.demo");
  const [password, setPassword] = useState("demo-password-2026");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      router.push("/");
    } catch (err: any) {
      alert(`Login failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleDemoLogin() {
    setLoading(true);
    try {
      await loginDemo();
      router.push("/");
    } catch (err: any) {
      alert(`Demo login failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f3efe6] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-[#0f6e6e] text-white flex items-center justify-center font-bold text-xl mx-auto shadow-md">
            CN
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#15232b]">
            Welcome to CareNav <span className="text-[#0f6e6e]">AI</span>
          </h1>
          <p className="text-xs md:text-sm text-[#5c6b73]">
            Understand your health. Find the right care. Navigate your healthcare journey.
          </p>
        </div>

        {/* Demo Fast Login Banner */}
        <div className="card p-5 bg-[#e4f2f1] border-[#bce2df] space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-[#0b4f4f]">
            <Sparkles className="w-4 h-4 text-[#0f6e6e]" />
            <span>Instant Demo Experience</span>
          </div>
          <p className="text-xs text-[#15232b]">
            Explore CareNav AI preloaded with synthetic records for Arjun Mehta (Bengaluru, 34y).
          </p>
          <button
            onClick={handleDemoLogin}
            disabled={loading}
            className="btn btn-primary text-xs w-full justify-center shadow-xs"
          >
            <span>{loading ? "Loading Patient..." : "1-Click Login as Demo Patient"}</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>
        </div>

        {/* Standard Patient Login Form */}
        <form onSubmit={handleLogin} className="card p-6 md:p-8 bg-white space-y-4 shadow-sm">
          <h2 className="font-bold text-base text-[#15232b]">Patient Login</h2>

          <div>
            <label className="text-xs font-bold text-[#5c6b73] block mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-[#f3efe6] border border-[#d9d1c3] text-sm text-[#15232b] outline-none focus:ring-2 focus:ring-[#0f6e6e]"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-[#5c6b73] block mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-[#f3efe6] border border-[#d9d1c3] text-sm text-[#15232b] outline-none focus:ring-2 focus:ring-[#0f6e6e]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary text-xs w-full justify-center"
          >
            Sign In to Patient Portal
          </button>

          <div className="pt-2 text-center text-xs text-[#5c6b73]">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-[#0f6e6e] font-bold hover:underline">
              Create Patient Account
            </Link>
          </div>
        </form>

        <div className="text-center text-[0.7rem] text-[#5c6b73] flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-[#0f6e6e]" />
          <span>Patient-only access portal with strict clinical authorization</span>
        </div>
      </div>
    </div>
  );
}
