import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { themeBootstrap } from "@vq/ui/theme-policy";
import { Providers } from "../../components/providers";
import { Shell } from "../../components/shell";
import "@vq/ui/tokens.css";
import "@vq/ui/icons.css";
import "../../styles/global.css";
import "../../features/activities/activities.css";
import "../../features/events/events.css";
import "../../features/social/social.css";

export const metadata = {
  title: "VibeQuest — Gather & Discover",
  description: "Gather, discover and share your city with VibeQuest.",
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!["en", "fr", "ar", "es"].includes(locale)) notFound();
  setRequestLocale(locale);
  const messages = await getMessages();
  return (
    <html
      lang={locale}
      dir={locale === "ar" ? "rtl" : "ltr"}
      suppressHydrationWarning
    >
      <head>
        <script src="https://telegram.org/js/telegram-web-app.js" />
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Providers>
            <Shell>{children}</Shell>
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
