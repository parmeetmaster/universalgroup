"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

interface AuthUser {
  name: string;
  email: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: AuthUser | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AUTH_KEY = "universal_dashboard_auth";
const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const clearAuth = useCallback(() => {
    localStorage.removeItem(AUTH_KEY);
    setIsAuthenticated(false);
    setUser(null);
    setToken(null);
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const stored = localStorage.getItem(AUTH_KEY);
        if (!stored) {
          setIsLoading(false);
          return;
        }

        const parsed = JSON.parse(stored);
        if (!parsed.token || !parsed.expiresAt || parsed.expiresAt < Date.now()) {
          clearAuth();
          setIsLoading(false);
          return;
        }

        setIsAuthenticated(true);
        setUser(parsed.user);
        setToken(parsed.token);

        const res = await fetch("/api/auth/verify", {
          headers: { "X-Admin-Token": parsed.token },
        });

        if (!res.ok) {
          clearAuth();
        }
      } catch {
        clearAuth();
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [clearAuth]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Invalid credentials");
    }

    const data = await res.json();
    const authData = {
      token: data.token,
      user: { name: data.name, email: data.email },
      expiresAt: Date.now() + THIRTY_DAYS,
    };

    localStorage.setItem(AUTH_KEY, JSON.stringify(authData));
    setToken(data.token);
    setUser({ name: data.name, email: data.email });
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(() => {
    clearAuth();
  }, [clearAuth]);

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
