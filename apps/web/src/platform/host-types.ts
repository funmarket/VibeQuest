import type { LocationAdapter } from "./location";
export type HostScheme = "light" | "dark";
export type HostSnapshot = {
  kind: "browser" | "telegram";
  safeTop: number;
  safeBottom: number;
  scheme?: HostScheme;
};
export type TelegramWebApp = {
  initData?: string;
  colorScheme?: string;
  safeAreaInset?: { top?: number; bottom?: number };
  contentSafeAreaInset?: { top?: number; bottom?: number };
  onEvent?: (event: string, handler: () => void) => void;
  offEvent?: (event: string, handler: () => void) => void;
  BackButton?: {
    show: () => void;
    hide: () => void;
    onClick: (handler: () => void) => void;
    offClick: (handler: () => void) => void;
  };
  HapticFeedback?: { impactOccurred: (style: "light") => void };
};
export type HostAdapter = {
  location: LocationAdapter;
  snapshot: () => HostSnapshot;
  subscribe: (listener: () => void) => () => void;
  back: (handler?: () => void) => () => void;
  haptic: () => void;
};
