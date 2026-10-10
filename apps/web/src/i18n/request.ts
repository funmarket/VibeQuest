import { getRequestConfig } from "next-intl/server";

const supportedLocales = ["en", "fr", "ar", "es"] as const;
type Locale = (typeof supportedLocales)[number];
const catalogs = {
  en: () => import("./locales/en.json"),
  fr: () => import("./locales/fr.json"),
  ar: () => import("./locales/ar.json"),
  es: () => import("./locales/es.json"),
};

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale: Locale =
    supportedLocales.find((supported) => supported === requested) ?? "en";
  return {
    locale,
    messages: (await catalogs[locale]()).default,
  };
});
