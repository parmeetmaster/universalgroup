"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { apps, AppConfig } from "@/config/apps";

interface AppContextType {
  currentApp: AppConfig;
  setCurrentApp: (appId: string) => void;
  activePage: string;
  setActivePage: (pageId: string) => void;
  apps: AppConfig[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

function updateUrl(appId: string, pageId: string) {
  const url = new URL(window.location.href);
  url.searchParams.set("app", appId);
  url.searchParams.set("page", pageId);
  window.history.replaceState({}, "", url.toString());
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentApp, setCurrentAppState] = useState<AppConfig>(apps[0]);
  const [activePage, setActivePageState] = useState("dashboard");

  // Sync from URL on mount (client-side only)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const appId = params.get("app");
    const pageId = params.get("page");
    const app = apps.find((a) => a.id === appId);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (app) setCurrentAppState(app);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (pageId) setActivePageState(pageId);
  }, []);

  const setActivePage = useCallback((pageId: string) => {
    setActivePageState(pageId);
    setCurrentAppState((app) => {
      updateUrl(app.id, pageId);
      return app;
    });
  }, []);

  const setCurrentApp = useCallback((appId: string) => {
    const app = apps.find((a) => a.id === appId);
    if (app) {
      setCurrentAppState(app);
      setActivePageState("dashboard");
      updateUrl(appId, "dashboard");
    }
  }, []);

  return (
    <AppContext.Provider
      value={{ currentApp, setCurrentApp, activePage, setActivePage, apps }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
}
