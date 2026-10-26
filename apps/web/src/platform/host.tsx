"use client";

import {
  createContext,
  createElement,
  useContext,
  useEffect,
  useLayoutEffect,
  useState,
  type ReactNode,
} from "react";
import { createLocationAdapter } from "./location";
import type { HostAdapter, HostSnapshot, TelegramWebApp } from "./host-types";

const browser: HostSnapshot = { kind: "browser", safeTop: 0, safeBottom: 0 };
const inset = (value?: number) =>
  typeof value === "number" && Number.isFinite(value) ? Math.max(0, value) : 0;
const safely = (action: () => void) => {
  try {
    action();
  } catch {
    /* Optional host capability unavailable. */
  }
};

export function createHostAdapter(
  candidate?: TelegramWebApp,
  device?: Navigator,
): HostAdapter {
  // Launch data is used only as a host-presence hint; it grants no identity or permission.
  const sdk =
    candidate &&
    typeof candidate.initData === "string" &&
    candidate.initData.length > 0
      ? candidate
      : undefined;
  return {
    location: createLocationAdapter(device),
    snapshot: () =>
      sdk
        ? {
            kind: "telegram",
            safeTop: Math.max(
              inset(sdk.safeAreaInset?.top),
              inset(sdk.contentSafeAreaInset?.top),
            ),
            safeBottom: Math.max(
              inset(sdk.safeAreaInset?.bottom),
              inset(sdk.contentSafeAreaInset?.bottom),
            ),
            ...(sdk.colorScheme === "light" || sdk.colorScheme === "dark"
              ? { scheme: sdk.colorScheme }
              : {}),
          }
        : { ...browser },
    subscribe(listener) {
      const events = [
        "themeChanged",
        "safeAreaChanged",
        "contentSafeAreaChanged",
      ];
      for (const event of events) safely(() => sdk?.onEvent?.(event, listener));
      return () => {
        for (const event of events)
          safely(() => sdk?.offEvent?.(event, listener));
      };
    },
    back(handler) {
      const button = sdk?.BackButton;
      if (!button || !handler) {
        safely(() => button?.hide());
        return () => {};
      }
      safely(() => {
        button.onClick(handler);
        button.show();
      });
      return () => {
        safely(() => button.offClick(handler));
        safely(() => button.hide());
      };
    },
    haptic() {
      safely(() => sdk?.HapticFeedback?.impactOccurred("light"));
    },
  };
}
type HostValue = HostSnapshot &
  Pick<HostAdapter, "back" | "haptic" | "location">;
const HostContext = createContext<HostValue | undefined>(undefined);
const useBeforePaint =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

export function HostProvider({ children }: { children: ReactNode }) {
  const [adapter, setAdapter] = useState(() => createHostAdapter());
  const [snapshot, setSnapshot] = useState<HostSnapshot>(browser);
  useBeforePaint(() => {
    const hostWindow = window as Window & {
      Telegram?: { WebApp?: TelegramWebApp };
    };
    const next = createHostAdapter(
      hostWindow.Telegram?.WebApp,
      window.navigator,
    );
    setAdapter(next);
    const update = () => setSnapshot(next.snapshot());
    update();
    return next.subscribe(update);
  }, []);
  return createElement(
    HostContext.Provider,
    {
      value: {
        ...snapshot,
        back: adapter.back,
        haptic: adapter.haptic,
        location: adapter.location,
      },
    },
    children,
  );
}
export function useHost() {
  const context = useContext(HostContext);
  if (!context) throw new Error("useHost requires HostProvider");
  return context;
}
