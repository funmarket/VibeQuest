"use client";

import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useState,
  type ReactNode,
} from "react";

import {
  normalizeThemePreference,
  resolveTheme,
  storageKey,
  type ThemePreference,
  type ResolvedTheme,
} from "./theme-policy";
export {
  normalizeThemePreference,
  resolveTheme,
  storageKey,
  themeBootstrap,
  type ThemePreference,
  type ResolvedTheme,
} from "./theme-policy";

type ThemeContextValue = {
  preference: ThemePreference;
  theme: ResolvedTheme;
  setPreference: (value: ThemePreference) => void;
};
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);
const useBeforePaint =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

export function ThemeProvider({
  children,
  hostScheme,
}: {
  children: ReactNode;
  hostScheme?: ResolvedTheme;
}) {
  const [preference, setState] = useState<ThemePreference>("system");
  const [osScheme, setOsScheme] = useState<ResolvedTheme>("light");
  const [ready, setReady] = useState(false);
  const theme = resolveTheme(preference, hostScheme, osScheme);
  useBeforePaint(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const update = () => setOsScheme(media.matches ? "dark" : "light");
    update();
    try {
      setState(
        normalizeThemePreference(window.localStorage.getItem(storageKey)),
      );
    } catch {
      /* Private mode keeps session preference. */
    }
    setReady(true);
    media.addEventListener("change", update);
    const storage = (event: StorageEvent) => {
      if (event.key === storageKey || event.key === null)
        setState(normalizeThemePreference(event.newValue));
    };
    window.addEventListener("storage", storage);
    return () => {
      media.removeEventListener("change", update);
      window.removeEventListener("storage", storage);
    };
  }, []);
  useBeforePaint(() => {
    if (!ready) return;
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  }, [theme, ready]);
  const setPreference = (value: ThemePreference) => {
    const next = normalizeThemePreference(value);
    setState(next);
    try {
      window.localStorage.setItem(storageKey, next);
    } catch {
      /* Theme still works without persistence. */
    }
  };
  return (
    <ThemeContext.Provider value={{ preference, theme, setPreference }}>
      {children}
    </ThemeContext.Provider>
  );
}
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme requires ThemeProvider");
  return context;
}
