"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

interface AuthContextType {
  isAuthenticated: boolean;
  user: { username: string; role: string } | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  login: () => false,
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

const CREDENTIALS = [
  { username: "admin", password: "Thmanyah2026!", role: "culture_admin", displayName: "مدير النظام" },
  { username: "zakiah", password: "Thmanyah2026!", role: "approver", displayName: "زكية حكمي" },
  { username: "albaraa", password: "Thmanyah2026!", role: "approver", displayName: "البراء العوهلي" },
  { username: "demo", password: "demo", role: "requester", displayName: "مستخدم تجريبي" },
];

const AUTH_KEY = "thmanyah_auth";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<{ username: string; role: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(AUTH_KEY);
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {}
    }
    setLoading(false);
  }, []);

  const login = useCallback((username: string, password: string): boolean => {
    const found = CREDENTIALS.find(
      (c) => c.username === username && c.password === password
    );
    if (found) {
      const u = { username: found.username, role: found.role };
      setUser(u);
      localStorage.setItem(AUTH_KEY, JSON.stringify(u));
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(AUTH_KEY);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-thmanyah-black flex items-center justify-center">
        <div className="animate-pulse-soft">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/thamanyah.png" alt="ثمانية" className="w-12 h-12 rounded-xl mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated: !!user, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
