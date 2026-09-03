export function getApiUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
    return "https://care-nav-ai-nine.vercel.app";
  }
  return "http://localhost:8000";
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("carenav_token");
}

export function setToken(token: string) {
  localStorage.setItem("carenav_token", token);
}

export function clearToken() {
  localStorage.removeItem("carenav_token");
}

const apiCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL_MS = 60 * 1000; // 1 minute in-memory cache for ultra-fast instant page switching

export function invalidateApiCache(pathPrefix?: string) {
  if (!pathPrefix) {
    apiCache.clear();
  } else {
    for (const key of apiCache.keys()) {
      if (key.includes(pathPrefix)) apiCache.delete(key);
    }
  }
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const method = (init.method || "GET").toUpperCase();
  const isGet = method === "GET";

  // Check fast in-memory cache for instant client-side page switching
  if (isGet) {
    const cached = apiCache.get(path);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data as T;
    }
  } else {
    // Invalidate cache on mutations (POST, PUT, PATCH, DELETE)
    invalidateApiCache();
  }

  const headers = new Headers(init.headers);
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (!(init.body instanceof FormData) && !headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }
  const res = await fetch(`${getApiUrl()}${path}`, { ...init, headers, cache: "no-store" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = (data as { detail?: string }).detail || "Something went wrong. Please try again.";
    throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
  }

  if (isGet) {
    apiCache.set(path, { data, timestamp: Date.now() });
  }

  return data as T;
}
