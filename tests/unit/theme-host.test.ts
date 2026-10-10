import { describe, expect, it } from "vitest";
import { runInNewContext } from "node:vm";
import {
  normalizeThemePreference,
  resolveTheme,
  themeBootstrap,
} from "../../packages/ui/src/theme-policy";
import { createHostAdapter } from "../../apps/web/src/platform/host";
import type { TelegramWebApp } from "../../apps/web/src/platform/host-types";

describe("theme authority", () => {
  it("prioritizes explicit preference, then host, then operating system", () => {
    expect(resolveTheme("light", "dark", "dark")).toBe("light");
    expect(resolveTheme("dark", "light", "light")).toBe("dark");
    expect(resolveTheme("system", "dark", "light")).toBe("dark");
    expect(resolveTheme("system", undefined, "dark")).toBe("dark");
    expect(resolveTheme("system", undefined, "light")).toBe("light");
    expect(normalizeThemePreference("sepia")).toBe("system");
    expect(normalizeThemePreference(null)).toBe("system");
  });

  it("applies persisted preference before paint and survives blocked storage", () => {
    const root = {
      dataset: {} as Record<string, string>,
      style: {} as Record<string, string>,
    };
    runInNewContext(themeBootstrap, {
      document: { documentElement: root },
      window: {
        localStorage: { getItem: () => "light" },
        matchMedia: () => ({ matches: true }),
      },
    });
    expect(root.dataset.theme).toBe("light");
    expect(root.style.colorScheme).toBe("light");
    runInNewContext(themeBootstrap, {
      document: { documentElement: root },
      window: {
        get localStorage() {
          throw new Error("denied");
        },
        matchMedia: () => ({ matches: true }),
      },
    });
    expect(root.dataset.theme).toBe("dark");
  });
  it("uses launched host hints without identity and preserves explicit preference", () => {
    const root = {
      dataset: {} as Record<string, string>,
      style: {} as Record<string, string>,
    };
    const sdk = {
      initData: "launch-fixture",
      colorScheme: "dark",
      get initDataUnsafe() {
        throw new Error("identity read");
      },
    };
    const hostWindow = {
      Telegram: { WebApp: sdk },
      localStorage: { getItem: () => "system" },
      matchMedia: () => ({ matches: false }),
    };
    runInNewContext(themeBootstrap, {
      document: { documentElement: root },
      window: hostWindow,
    });
    expect(root.dataset.theme).toBe("dark");
    hostWindow.localStorage.getItem = () => "light";
    runInNewContext(themeBootstrap, {
      document: { documentElement: root },
      window: hostWindow,
    });
    expect(root.dataset.theme).toBe("light");
    sdk.initData = "";
    hostWindow.localStorage.getItem = () => "invalid";
    runInNewContext(themeBootstrap, {
      document: { documentElement: root },
      window: hostWindow,
    });
    expect(root.dataset.theme).toBe("light");
  });
});

describe("host adapter (SDK fixtures are simulation, not Telegram acceptance)", () => {
  it("renders ordinary browser capabilities without Telegram globals", () => {
    const host = createHostAdapter();
    expect(host.snapshot()).toEqual({
      kind: "browser",
      safeTop: 0,
      safeBottom: 0,
    });
    expect(() => host.haptic()).not.toThrow();
    expect(() => host.back()()).not.toThrow();
  });

  it("does not treat an unlaunched SDK as Telegram or read unsafe identity", () => {
    const sdk = {
      initData: "",
      colorScheme: "dark",
      get initDataUnsafe() {
        throw new Error("identity read");
      },
    };
    expect(createHostAdapter(sdk as TelegramWebApp).snapshot().kind).toBe(
      "browser",
    );
  });

  it("uses launched host hints, updates insets, and releases router back handlers", () => {
    const handlers = new Map<string, () => void>();
    let click: (() => void) | undefined;
    let hidden = 0;
    let pulses = 0;
    const sdk: TelegramWebApp = {
      initData: "host-launch-fixture",
      colorScheme: "dark",
      safeAreaInset: { top: 20, bottom: 10 },
      contentSafeAreaInset: { top: 25, bottom: 2 },
      onEvent: (event, fn) => {
        handlers.set(event, fn);
      },
      offEvent: (event) => {
        handlers.delete(event);
      },
      BackButton: {
        show: () => {},
        hide: () => {
          hidden++;
        },
        onClick: (fn) => {
          click = fn;
        },
        offClick: () => {
          click = undefined;
        },
      },
      HapticFeedback: {
        impactOccurred: (style) => {
          if (style === "light") pulses++;
        },
      },
    };
    const host = createHostAdapter(sdk);
    expect(host.snapshot()).toEqual({
      kind: "telegram",
      scheme: "dark",
      safeTop: 25,
      safeBottom: 10,
    });
    let update = 0;
    const stop = host.subscribe(() => {
      update++;
    });
    sdk.colorScheme = "light";
    handlers.get("themeChanged")?.();
    expect(host.snapshot().scheme).toBe("light");
    expect(update).toBe(1);
    sdk.safeAreaInset = { top: Number.NaN, bottom: -5 };
    sdk.contentSafeAreaInset = { top: 8, bottom: 4 };
    handlers.get("safeAreaChanged")?.();
    expect(host.snapshot().safeTop).toBe(8);
    expect(host.snapshot().safeBottom).toBe(4);
    let backs = 0;
    const release = host.back(() => {
      backs++;
    });
    click?.();
    expect(backs).toBe(1);
    release();
    expect(click).toBeUndefined();
    expect(hidden).toBe(1);
    host.haptic();
    expect(pulses).toBe(1);
    stop();
    expect(handlers.size).toBe(0);
  });
});
