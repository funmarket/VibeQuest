import { expect, it } from "vitest";
import { validateReading } from "../../packages/geo/src/index";
const now = Date.parse("2026-10-26T18:00:00.000Z");
const reading = {
  latitude: 36.8,
  longitude: 10.2,
  accuracy: 100,
  observedAt: "2026-10-26T17:55:00.000Z",
};
it("accepts the exact five-minute and 100-meter limits, rejects values beyond either limit", () => {
  expect(validateReading(reading, now)).toEqual(reading);
  for (const extra of [
    { accuracy: 100.0001 },
    { observedAt: "2026-10-26T17:54:59.999Z" },
    { observedAt: "2026-10-26T18:00:00.001Z" },
    { accuracy: NaN },
    { accuracy: Infinity },
    { latitude: 91 },
    { longitude: -181 },
    { observedAt: "invalid" },
  ])
    expect(() => validateReading({ ...reading, ...extra }, now)).toThrow(
      "INVALID_GEO_READING",
    );
  expect(() =>
    validateReading(
      { latitude: 36.8, longitude: 10.2, observedAt: reading.observedAt },
      now,
    ),
  ).toThrow();
});
