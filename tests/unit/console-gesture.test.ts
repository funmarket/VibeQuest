import { describe, expect, it } from "vitest";
import {
  consoleVelocity,
  shouldCloseConsole,
} from "../../apps/web/src/components/console-gesture";

describe("Console reference gesture", () => {
  it("uses strict offset and px/second velocity thresholds", () => {
    expect(shouldCloseConsole(80, 300)).toBe(false);
    expect(shouldCloseConsole(81, 0)).toBe(true);
    expect(shouldCloseConsole(10, 301)).toBe(true);
    expect(shouldCloseConsole(-100, -1000)).toBe(false);
    expect(
      consoleVelocity([
        { x: 0, time: 0 },
        { x: 31, time: 100 },
      ]),
    ).toBe(310);
  });
  it("measures recent movement and lets a held short drag settle", () => {
    expect(
      consoleVelocity([
        { x: 0, time: 0 },
        { x: 0, time: 1000 },
        { x: 40, time: 1100 },
      ]),
    ).toBe(400);
    expect(
      consoleVelocity([
        { x: 0, time: 0 },
        { x: 40, time: 100 },
        { x: 40, time: 300 },
      ]),
    ).toBe(0);
    expect(consoleVelocity([])).toBe(0);
  });
});
