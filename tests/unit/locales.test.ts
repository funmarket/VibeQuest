import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

type Catalog = typeof import("../../apps/web/src/i18n/locales/en.json");
const locales = ["en", "fr", "ar", "es"] as const;
const catalogUrl = (locale: string) =>
  new URL(`../../apps/web/src/i18n/locales/${locale}.json`, import.meta.url);
const readCatalog = async (locale: string): Promise<Catalog> =>
  JSON.parse(await readFile(catalogUrl(locale), "utf8")) as Catalog;
const entries = (catalog: Catalog) =>
  Object.entries(catalog).flatMap(([namespace, messages]) =>
    Object.entries(messages).map(
      ([key, value]) => [`${namespace}.${key}`, value] as const,
    ),
  );

describe("first-release interface catalogs", () => {
  it("provides complete catalogs for the four supported locales", async () => {
    const contents = await Promise.all(
      locales.map(async (locale) => ({
        locale,
        exists: await readFile(catalogUrl(locale), "utf8").then(
          () => true,
          () => false,
        ),
      })),
    );
    expect(
      contents.filter(({ exists }) => !exists).map(({ locale }) => locale),
    ).toEqual([]);
  });

  it("keeps every translated namespace and key aligned with English without empty messages", async () => {
    const english = await readCatalog("en");
    expect(Object.keys(english).sort()).toEqual([
      "activities",
      "common",
      "content",
      "explore",
      "geo",
      "home",
      "identity",
      "nav",
      "officialEvents",
      "purse",
      "share",
      "social",
      "vibe",
    ]);
    const expectedKeys = entries(english)
      .map(([key]) => key)
      .sort();
    expect(expectedKeys.length).toBeGreaterThan(150);
    for (const locale of locales) {
      const catalog = await readCatalog(locale);
      expect(
        entries(catalog)
          .map(([key]) => key)
          .sort(),
        locale,
      ).toEqual(expectedKeys);
      for (const [key, value] of entries(catalog)) {
        expect(typeof value, `${locale}.${key}`).toBe("string");
        expect(value.trim().length, `${locale}.${key}`).toBeGreaterThan(0);
      }
    }
  });

  it("renders all messages and plural counts without missing-key or ICU errors", async () => {
    const { createTranslator } = await import("next-intl");
    const english = await readCatalog("en");
    const englishArguments = new Map(
      entries(english).map(([key, value]) => [
        key,
        [...value.matchAll(/\{\s*([a-zA-Z][\w]*)\s*[,}]/g)]
          .map((match) => match[1])
          .sort(),
      ]),
    );
    for (const locale of locales) {
      const catalog = await readCatalog(locale);
      const errors: string[] = [];
      const translate = createTranslator({
        locale,
        messages: catalog,
        onError: (error) => errors.push(error.message),
      });
      for (const [key, value] of entries(catalog)) {
        const argumentsFound = [
          ...value.matchAll(/\{\s*([a-zA-Z][\w]*)\s*[,}]/g),
        ]
          .map((match) => match[1])
          .sort();
        expect(argumentsFound, `${locale}.${key}`).toEqual(
          englishArguments.get(key),
        );
        expect(
          translate(key as Parameters<typeof translate>[0], {
            count: 2,
            state: "granted",
          }),
        ).not.toBe(key);
      }
      for (const count of [0, 1, 2, 3, 11, 100]) {
        const rendered = translate("explore.results", { count });
        expect(rendered.trim()).not.toBe("");
        expect(rendered).not.toContain("{count");
      }
      expect(errors, locale).toEqual([]);
    }
  });
});
