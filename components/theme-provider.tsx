"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Theme } from "@/lib/colors";
import { DEFAULT_THEME } from "@/lib/site";

type Mode = "day" | "dusk";

type DiaryThemeValue = {
  mode: Mode;
  theme: Theme;
  follow: boolean;
  source: string | null;
  setMode: (mode: Mode) => void;
  toggleMode: () => void;
  applyTheme: (theme: Theme, source?: string | null) => void;
  setFollow: (follow: boolean) => void;
};

const STORAGE = {
  mode: "orange-isle:mode",
  theme: "orange-isle:theme",
  follow: "orange-isle:follow",
};

const DiaryThemeContext = createContext<DiaryThemeValue | null>(null);

function isTheme(value: unknown): value is Theme {
  if (!value || typeof value !== "object") return false;
  const theme = value as Partial<Theme>;
  return (
    typeof theme.accent === "string" &&
    typeof theme.accentInk === "string" &&
    typeof theme.onAccent === "string" &&
    Array.isArray(theme.palette)
  );
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<Mode>("day");
  const [theme, setTheme] = useState<Theme>(DEFAULT_THEME);
  const [follow, setFollowState] = useState(false);
  const [source, setSource] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Persisted preferences can only be read after hydration; this one-time
  // restore is exactly the post-mount synchronisation the effect is for.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    try {
      const savedMode = window.localStorage.getItem(STORAGE.mode);
      if (savedMode === "dusk" || savedMode === "day") {
        setModeState(savedMode);
      }
      const savedTheme = window.localStorage.getItem(STORAGE.theme);
      if (savedTheme) {
        const parsed = JSON.parse(savedTheme) as unknown;
        if (isTheme(parsed)) setTheme(parsed);
      }
      const savedFollow = window.localStorage.getItem(STORAGE.follow);
      if (savedFollow === "true") setFollowState(true);
    } catch {
      // Storage can be unavailable in private browsing; defaults still work.
    }
    setLoaded(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!loaded) return;
    const root = document.documentElement;
    root.dataset.theme = mode;
    root.style.colorScheme = mode === "dusk" ? "dark" : "light";
    root.style.setProperty("--accent", theme.accent);
    root.style.setProperty("--accent-ink", theme.accentInk);
    root.style.setProperty("--on-accent", theme.onAccent);
    document
      .querySelectorAll('meta[name="theme-color"]')
      .forEach((meta) =>
        meta.setAttribute("content", mode === "dusk" ? "#15100d" : "#f7f0e6"),
      );
    try {
      window.localStorage.setItem(STORAGE.mode, mode);
      window.localStorage.setItem(STORAGE.theme, JSON.stringify(theme));
      window.localStorage.setItem(STORAGE.follow, String(follow));
    } catch {
      // Ignore quota/private mode failures.
    }
  }, [mode, theme, follow, loaded]);

  const setMode = useCallback((next: Mode) => {
    setModeState(next);
  }, []);

  const toggleMode = useCallback(() => {
    setModeState((current) => (current === "day" ? "dusk" : "day"));
  }, []);

  const applyTheme = useCallback((next: Theme, from?: string | null) => {
    setTheme(next);
    setSource(from ?? null);
  }, []);

  const setFollow = useCallback((next: boolean) => {
    setFollowState(next);
    if (!next) setSource(null);
  }, []);

  const value = useMemo(
    () => ({
      mode,
      theme,
      follow,
      source,
      setMode,
      toggleMode,
      applyTheme,
      setFollow,
    }),
    [mode, theme, follow, source, setMode, toggleMode, applyTheme, setFollow],
  );

  return (
    <DiaryThemeContext.Provider value={value}>
      {children}
    </DiaryThemeContext.Provider>
  );
}

export function useDiaryTheme(): DiaryThemeValue {
  const value = useContext(DiaryThemeContext);
  if (!value) {
    throw new Error("useDiaryTheme must be used inside ThemeProvider");
  }
  return value;
}
