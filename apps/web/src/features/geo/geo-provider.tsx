"use client";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { geoRequest } from "@vq/api-client";
import type { GeoState } from "@vq/contracts";
import { useAccount } from "../identity/account-provider";
import { useHost } from "../../platform/host";
import type { LocationPermission } from "../../platform/location";

type GeoValue = {
  state: GeoState | null;
  status: string;
  permission: LocationPermission;
  busy: boolean;
  settingsOpen: boolean;
  openSettings: () => void;
  closeSettings: () => void;
  apply: (location: boolean, social: boolean) => Promise<void>;
  refresh: () => Promise<void>;
};
const Context = createContext<GeoValue | null>(null);
export function GeoProvider({ children }: { children: ReactNode }) {
  const { account } = useAccount(),
    host = useHost();
  const [state, setState] = useState<GeoState | null>(null),
    [status, setStatus] = useState("idle"),
    [permission, setPermission] = useState<LocationPermission>("unknown"),
    [busy, setBusy] = useState(false),
    [settingsOpen, setSettingsOpen] = useState(false);
  const current = useRef<GeoState | null>(null),
    operation = useRef<AbortController | null>(null),
    generation = useRef(0),
    mounted = useRef(true),
    actor = useRef<string | null>(null);
  const channel = useRef<BroadcastChannel | null>(null);
  const notify = useCallback((kind: "clear" | "changed") => {
    if (actor.current)
      channel.current?.postMessage({ kind, actorId: actor.current });
  }, []);
  const isCurrent = useCallback(
    (owner: string | null, ticket: number) =>
      mounted.current &&
      owner === actor.current &&
      ticket === generation.current,
    [],
  );
  const publish = useCallback((next: GeoState) => {
    current.current = next;
    setState(next);
  }, []);
  const stop = useCallback(() => {
    generation.current++;
    operation.current?.abort();
    operation.current = null;
    setBusy(false);
  }, []);
  const invalidate = useCallback(async () => {
    stop();
    notify("clear");
    current.current = current.current
      ? { ...current.current, presence: null }
      : null;
    setState(current.current);
    const owner = actor.current,
      ticket = generation.current;
    if (!owner) return;
    try {
      const next = await geoRequest("/api", "unavailable", {});
      if (
        mounted.current &&
        owner === actor.current &&
        ticket === generation.current
      ) {
        publish(next);
      }
      // A committed mutation must wake other tabs even if a newer local
      // operation made this response obsolete for rendering.
      if (mounted.current && owner === actor.current) notify("changed");
    } catch {
      if (mounted.current && owner === actor.current) setStatus("error");
    }
  }, [stop, publish, notify]);
  const refresh = useCallback(async () => {
    if (
      !actor.current ||
      (current.current && !current.current.locationConsent)
    ) {
      setSettingsOpen(true);
      return;
    }
    if (document.visibilityState === "hidden") return;
    stop();
    const ticket = generation.current,
      owner = actor.current,
      controller = new AbortController();
    operation.current = controller;
    setBusy(true);
    setStatus("locating");
    try {
      // Revalidate remembered consent before any resumed/on-demand acquisition.
      const remembered = await geoRequest(
        "/api",
        "read",
        undefined,
        controller.signal,
      );
      if (!isCurrent(owner, ticket)) return;
      publish(remembered);
      if (!remembered.locationConsent) {
        setStatus("off");
        return;
      }
      const actual = await host.location.permission();
      if (!isCurrent(owner, ticket)) return;
      setPermission(actual);
      if (actual === "denied" || actual === "unavailable") {
        setStatus(actual);
        await invalidate();
        return;
      }
      if (ticket !== generation.current) return;
      const reading = await host.location.acquire(controller.signal);
      if (
        ticket !== generation.current ||
        String(document.visibilityState) === "hidden" ||
        actor.current !== owner
      )
        return;
      const next = await geoRequest(
        "/api",
        "observation",
        { ...reading, version: current.current!.version },
        controller.signal,
      );
      if (ticket === generation.current && actor.current === owner) {
        publish(next);
        setPermission("granted");
        setStatus("active");
      }
    } catch (error) {
      if (ticket !== generation.current) return;
      const code = error instanceof Error ? error.message : "error";
      if (code === "denied" || code === "unavailable") {
        setPermission(code);
        setStatus(code);
        await invalidate();
      } else {
        setStatus(
          code === "timeout"
            ? "timeout"
            : code === "INVALID_GEO_READING"
              ? "invalid"
              : "error",
        );
        if (code === "AUTH_REQUIRED") {
          current.current = null;
          setState(null);
          setStatus("signIn");
        }
        if (code === "GEO_CONFLICT") {
          try {
            const next = await geoRequest(
              "/api",
              "read",
              undefined,
              controller.signal,
            );
            if (isCurrent(owner, ticket)) publish(next);
          } catch {
            if (isCurrent(owner, ticket)) {
              current.current = null;
              setState(null);
              setStatus("error");
            }
          }
        }
      }
    } finally {
      if (ticket === generation.current) {
        setBusy(false);
        operation.current = null;
      }
    }
  }, [host.location, stop, invalidate, publish, isCurrent]);
  useEffect(() => {
    mounted.current = true;
    actor.current = account?.id ?? null;
    stop();
    current.current = null;
    setState(null);
    setStatus("idle");
    let disposed = false;
    const owner = actor.current,
      ticket = generation.current,
      controller = new AbortController();
    operation.current = controller;
    if (account)
      void geoRequest("/api", "read", undefined, controller.signal)
        .then((next) => {
          if (disposed || !isCurrent(owner, ticket)) return;
          publish(next);
          if (next.locationConsent && document.visibilityState !== "hidden")
            void refresh();
        })
        .catch(() => {
          if (!disposed && isCurrent(owner, ticket)) setStatus("error");
        });
    return () => {
      disposed = true;
      mounted.current = false;
      stop();
    };
  }, [account?.id, publish, refresh, stop, isCurrent]);
  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return;
    const connection = new BroadcastChannel("vq.geo");
    channel.current = connection;
    connection.onmessage = (event) => {
      const data = event.data;
      if (
        !data ||
        data.actorId !== actor.current ||
        !["clear", "changed"].includes(data.kind)
      )
        return;
      stop();
      current.current = null;
      setState(null);
      setStatus("idle");
      if (data.kind === "clear") return;
      const owner = actor.current,
        ticket = generation.current,
        controller = new AbortController();
      operation.current = controller;
      void geoRequest("/api", "read", undefined, controller.signal)
        .then((next) => {
          if (isCurrent(owner, ticket)) {
            publish(next);
            setStatus(
              next.presence ? "active" : next.locationConsent ? "idle" : "off",
            );
          }
        })
        .catch(() => {
          if (isCurrent(owner, ticket)) setStatus("error");
        });
    };
    return () => {
      connection.close();
      if (channel.current === connection) channel.current = null;
    };
  }, [publish, stop, isCurrent]);
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        stop();
        return;
      }
      if (!current.current || current.current.locationConsent) void refresh();
    };
    const onLogout = () => {
      actor.current = null;
      stop();
      current.current = null;
      setState(null);
      setStatus("idle");
    };
    void host.location.permission().then(setPermission);
    const onSignoutFailed = () => {
      actor.current = account?.id ?? null;
      const owner = actor.current,
        ticket = generation.current;
      void geoRequest("/api")
        .then((next) => {
          if (isCurrent(owner, ticket)) publish(next);
        })
        .catch(() => {
          if (isCurrent(owner, ticket)) setStatus("error");
        });
    };
    window.addEventListener("vq:signout-failed", onSignoutFailed);
    const release = host.location.subscribe((actual) => {
      setPermission(actual);
      if (
        actual === "denied" ||
        actual === "unavailable" ||
        actual === "prompt"
      ) {
        setStatus(actual === "prompt" ? "unavailable" : actual);
        void invalidate();
      }
    });
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", stop);
    window.addEventListener("vq:signing-out", onLogout);
    return () => {
      release();
      window.removeEventListener("vq:signout-failed", onSignoutFailed);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", stop);
      window.removeEventListener("vq:signing-out", onLogout);
    };
  }, [
    host.location,
    stop,
    refresh,
    invalidate,
    account?.id,
    publish,
    isCurrent,
  ]);
  useEffect(() => {
    if (!state?.presence) return;
    const timer = setTimeout(
      () => {
        current.current = current.current
          ? { ...current.current, presence: null }
          : null;
        setState(current.current);
        setStatus("expired");
      },
      Math.max(0, Date.parse(state.presence.expiresAt) - Date.now()),
    );
    return () => clearTimeout(timer);
  }, [state?.presence]);
  async function apply(location: boolean, social: boolean) {
    if (!actor.current) {
      setStatus("signIn");
      return;
    }
    stop();
    const owner = actor.current,
      ticket = generation.current;
    setBusy(true);
    if (!location) {
      notify("clear");
      current.current = current.current
        ? { ...current.current, presence: null }
        : null;
      setState(current.current);
    }
    try {
      const next = await geoRequest("/api", "consent", {
        version: current.current?.version ?? 0,
        locationConsent: location,
        socialSharing: location && social,
      });
      if (mounted.current && owner === actor.current) notify("changed");
      if (owner !== actor.current || ticket !== generation.current) return;
      publish(next);
      setStatus(location ? "idle" : "off");
      setSettingsOpen(false);
      if (location) await refresh();
    } catch {
      if (!isCurrent(owner, ticket)) return;
      setStatus("error");
      try {
        const next = await geoRequest("/api");
        if (isCurrent(owner, ticket))
          publish(location ? next : { ...next, presence: null });
      } catch {
        /* Failure remains visible; no successful write is claimed. */
      }
    } finally {
      if (isCurrent(owner, ticket)) setBusy(false);
    }
  }
  return (
    <Context.Provider
      value={{
        state,
        status,
        permission,
        busy,
        settingsOpen,
        openSettings: () => setSettingsOpen(true),
        closeSettings: () => setSettingsOpen(false),
        apply,
        refresh,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useGeo() {
  const value = useContext(Context);
  if (!value) throw Error("GeoProvider required");
  return value;
}
