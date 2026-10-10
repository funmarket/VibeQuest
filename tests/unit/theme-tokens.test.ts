import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync("packages/ui/src/tokens.css", "utf8");
function palette(selector: string) {
  const block = css.slice(css.indexOf(selector)).split("}")[0];
  return Object.fromEntries(
    [...block.matchAll(/--([\w-]+):\s*(#[\da-f]{6})/gi)].map((match) => [
      match[1],
      match[2],
    ]),
  );
}
function rgb(hex: string) {
  return [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16));
}
function luminance(hex: string) {
  const channels = rgb(hex).map((value) => {
    const s = value / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return channels[0]! * 0.2126 + channels[1]! * 0.7152 + channels[2]! * 0.0722;
}
function contrast(a: string, b: string) {
  const values = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (values[0]! + 0.05) / (values[1]! + 0.05);
}

describe("canonical semantic palette", () => {
  for (const [theme, selector] of [
    ["light", ":root"],
    ["dark", '[data-theme="dark"]'],
  ]) {
    const tokens = palette(selector!);
    it(`${theme}: global surfaces, text and borders are neutral`, () => {
      for (const role of [
        "bg",
        "surface",
        "raised",
        "text",
        "muted",
        "border",
        "capsule",
      ]) {
        const channels = rgb(tokens[role]!);
        expect(Math.max(...channels) - Math.min(...channels), role).toBe(0);
      }
      if (theme === "dark") {
        expect(luminance(tokens.bg!)).toBeLessThan(luminance(tokens.surface!));
        expect(luminance(tokens.surface!)).toBeLessThan(
          luminance(tokens.raised!),
        );
        expect(luminance(tokens.raised!)).toBeLessThan(0.05);
      } else {
        expect(luminance(tokens.surface!)).toBeGreaterThan(
          luminance(tokens.bg!),
        );
        expect(luminance(tokens.bg!)).toBeGreaterThan(
          luminance(tokens.raised!),
        );
      }
    });
    it(`${theme}: copy, state colors, controls and focus remain readable`, () => {
      for (const surface of ["bg", "surface", "raised"]) {
        for (const text of [
          "text",
          "muted",
          "orange",
          "blue",
          "pink",
          "purple",
          "coral-ink",
          "teal-ink",
        ]) {
          expect(
            contrast(tokens[text]!, tokens[surface]!),
            `${text}/${surface}`,
          ).toBeGreaterThanOrEqual(4.5);
        }
        expect(
          contrast(tokens.focus!, tokens[surface]!),
        ).toBeGreaterThanOrEqual(3);
      }
      for (const accent of ["orange", "blue", "pink", "purple"]) {
        expect(
          contrast(tokens["on-accent"]!, tokens[accent]!),
          accent,
        ).toBeGreaterThanOrEqual(4.5);
      }
      expect(
        contrast(tokens["capsule-text"]!, tokens.capsule!),
      ).toBeGreaterThanOrEqual(4.5);
      expect(tokens["nav-orange"]).toBe("#f97316");
      expect(tokens["nav-blue"]).toBe("#3b82f6");
      expect(tokens["nav-pink"]).toBe("#f43f5e");
      expect(tokens["nav-purple"]).toBe("#a855f7");
      for (const accent of [
        "orange",
        "blue",
        "pink",
        "purple",
        "teal",
        "gold",
      ]) {
        const channels = rgb(tokens[accent]!);
        expect(
          Math.max(...channels) - Math.min(...channels),
          accent,
        ).toBeGreaterThan(40);
      }
    });
  }
  it("keeps identical semantic color roles in both themes", () => {
    expect(Object.keys(palette(":root")).sort()).toEqual(
      Object.keys(palette('[data-theme="dark"]')).sort(),
    );
  });
});
