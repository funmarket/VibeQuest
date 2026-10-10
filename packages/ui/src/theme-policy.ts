export type ThemePreference = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";
export const storageKey = "vq.theme";

export function normalizeThemePreference(value: unknown): ThemePreference {
  return value === "light" || value === "dark" ? value : "system";
}
export function resolveTheme(
  preference: ThemePreference,
  hostScheme: ResolvedTheme | undefined,
  osScheme: ResolvedTheme,
): ResolvedTheme {
  return preference === "system" ? (hostScheme ?? osScheme) : preference;
}

// Server-safe string imported by the document head; browser access occurs only on execution.
export const themeBootstrap = `(function(){var p='system',w=window,r=document.documentElement;try{var v=w.localStorage.getItem('${storageKey}');if(v==='light'||v==='dark')p=v}catch(e){}var t=p;if(p==='system'){var a=w.Telegram&&w.Telegram.WebApp;var h=a&&typeof a.initData==='string'&&a.initData.length>0&&a.colorScheme;t=h==='light'||h==='dark'?h:w.matchMedia&&w.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}r.dataset.theme=t;r.style.colorScheme=t})();`;
