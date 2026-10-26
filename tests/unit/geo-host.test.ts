import { expect, it } from "vitest";
import { createLocationAdapter } from "../../apps/web/src/platform/location";
it("reports unsupported acquisition without manufacturing coordinates", async () => {
  const location = createLocationAdapter();
  expect(await location.permission()).toBe("unavailable");
  await expect(location.acquire(new AbortController().signal)).rejects.toThrow(
    "unavailable",
  );
});
it("ignores a delayed reading after cancellation and exposes permission denial", async () => {
  let success: PositionCallback | undefined;
  const adapter = createLocationAdapter({
    geolocation: {
      getCurrentPosition(ok) {
        success = ok;
      },
    } as Geolocation,
  });
  const controller = new AbortController();
  const reading = adapter.acquire(controller.signal);
  controller.abort();
  await expect(reading).rejects.toThrow("cancelled");
  success?.({
    coords: { latitude: 1, longitude: 2, accuracy: 4 },
    timestamp: Date.now(),
  } as GeolocationPosition);
  expect(await adapter.permission()).toBe("unknown");
});
