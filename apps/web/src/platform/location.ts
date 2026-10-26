import type { GeoReading } from "@vq/contracts";
export type LocationPermission = PermissionState | "unknown" | "unavailable";
export type LocationAdapter = {
  permission(): Promise<LocationPermission>;
  subscribe(listener: (state: LocationPermission) => void): () => void;
  acquire(signal: AbortSignal): Promise<GeoReading>;
};
export function createLocationAdapter(
  device?: Pick<Navigator, "geolocation"> &
    Partial<Pick<Navigator, "permissions">>,
): LocationAdapter {
  async function query() {
    if (!device?.geolocation) return null;
    try {
      return (await device.permissions?.query({ name: "geolocation" })) ?? null;
    } catch {
      return null;
    }
  }
  return {
    async permission() {
      return !device?.geolocation
        ? "unavailable"
        : ((await query())?.state ?? "unknown");
    },
    subscribe(listener) {
      let disposed = false,
        release: (() => void) | undefined;
      void query().then((status) => {
        if (disposed || !status) return;
        const update = () => listener(status.state);
        status.addEventListener("change", update);
        release = () => status.removeEventListener("change", update);
      });
      return () => {
        disposed = true;
        release?.();
      };
    },
    acquire(signal) {
      return new Promise((resolve, reject) => {
        if (!device?.geolocation) {
          reject(Error("unavailable"));
          return;
        }
        if (signal.aborted) {
          reject(Error("cancelled"));
          return;
        }
        let finished = false;
        const finish = (work: () => void) => {
          if (finished) return;
          finished = true;
          signal.removeEventListener("abort", cancel);
          work();
        };
        const cancel = () => finish(() => reject(Error("cancelled")));
        signal.addEventListener("abort", cancel, { once: true });
        try {
          device.geolocation.getCurrentPosition(
            (position) =>
              finish(() => {
                const timestamp = position.timestamp;
                if (!Number.isFinite(timestamp)) {
                  reject(Error("invalid"));
                  return;
                }
                resolve({
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude,
                  accuracy: position.coords.accuracy,
                  observedAt: new Date(timestamp).toISOString(),
                });
              }),
            (error) =>
              finish(() =>
                reject(
                  Error(
                    error.code === 1
                      ? "denied"
                      : error.code === 3
                        ? "timeout"
                        : "unavailable",
                  ),
                ),
              ),
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
          );
        } catch {
          finish(() => reject(Error("unavailable")));
        }
      });
    },
  };
}
