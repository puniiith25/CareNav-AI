"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { api, clearToken, getToken, setToken } from "@/lib/api";
import { Patient, Profile } from "@/types";

interface User {
  id: string;
  email: string;
  role: string;
  profile?: Profile;
}

interface AuthContextType {
  user: User | null;
  patient: Patient | null;
  loading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  loginDemo: () => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);

  async function refreshUser() {
    try {
      const token = getToken();
      if (!token) {
        await loginDemo();
        return;
      }
      const data = await api<{ user: User; profile: Profile; patient_id?: string; doctor_id?: string; hospital_id?: string }>("/api/auth/me");
      setUser({ ...data.user, profile: data.profile });
    } catch {
      clearToken();
      setUser(null);
      await loginDemo().catch(() => {});
    } finally {
      setLoading(false);
    }
  }

  async function login(email: string, password = "CareNavDemo!23") {
    setLoading(true);
    try {
      const res = await api<{ access_token: string; user: User }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setToken(res.access_token);
      await refreshUser();
    } finally {
      setLoading(false);
    }
  }

  async function loginDemo() {
    try {
      const res = await api<{ access_token: string; user: User }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: "dr.sharma@carenav.demo", password: "CareNavDemo!23" }),
      });
      setToken(res.access_token);
      const meData = await api<{ user: User; profile: Profile }>("/api/auth/me");
      setUser({ ...meData.user, profile: meData.profile });
    } catch (err) {
      console.error("Doctor demo login error:", err);
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    clearToken();
    setUser(null);
    setPatient(null);
  }

  useEffect(() => {
    refreshUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, patient, loading, login, loginDemo, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
