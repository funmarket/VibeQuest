"use client";
import { useState, useEffect, type ReactNode, type CSSProperties } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  Home,
  Compass,
  Heart,
  Users,
  Bitcoin,
  Bell,
  CircleUser,
  MapPin,
} from "lucide-react";
import { useHost } from "../platform/host";
import { NoticeDialog } from "./presentation";
import { ProfileMenu } from "./profile-menu";
import { useAccount } from "../features/identity/account-provider";

const destinations = [
  { id: "home", icon: Home },
  { id: "explore", icon: Compass },
  { id: "share", icon: Heart },
  { id: "vibe", icon: Users },
  { id: "purse", icon: Bitcoin },
] as const;

export function Shell({ children }: { children: ReactNode }) {
  const locale = useLocale();
  const t = useTranslations("nav");
  const c = useTranslations("common");
  const identity = useTranslations("identity");
  const path = usePathname();
  const router = useRouter();
  const account = useAccount();
  const host = useHost();
  const [dialog, setDialog] = useState<"account" | "notifications" | null>(
    null,
  );
  const destination = path.split("/")[2] ?? "home";
  useEffect(
    () => host.back(destination === "home" ? undefined : () => router.back()),
    [host, destination, router],
  );
  return (
    <div
      className={`app-shell page-${destination}`}
      data-host={host.kind}
      style={
        {
          "--host-safe-top": `${host.safeTop}px`,
          "--host-safe-bottom": `${host.safeBottom}px`,
        } as CSSProperties
      }
    >
      <a className="skip-link" href="#main">
        {c("skip")}
      </a>
      <header className="app-header">
        <Link className="brand" href={`/${locale}/home`} aria-label="VibeQuest">
          <span className="brand-mark" aria-hidden>
            🤪
          </span>
          <span className="brand-type">
            VIBE<span>QUEST</span>
            <small>{c("brandTagline")}</small>
          </span>
        </Link>
        <div className="header-tools">
          <button
            className="icon-button notifications"
            aria-label={c("notificationsTitle")}
            onClick={() => setDialog("notifications")}
          >
            <Bell size={18} />
          </button>
          <button
            className="icon-button account"
            aria-label={c("accountTitle")}
            onClick={() => setDialog("account")}
          >
            <CircleUser size={22} />
          </button>
        </div>
      </header>
      <div className="context-strip">
        <Link href={`/${locale}/explore`}>
          <MapPin size={14} aria-hidden />
          {c("chooseArea")}
        </Link>
        <span className="guest-label">
          {account.account
            ? account.account.email
            : account.unavailable
              ? identity("unavailable")
              : account.loading
                ? c("loading")
                : c("guest")}
        </span>
      </div>
      <main id="main" className="main-content">
        {children}
      </main>
      <nav className="bottom-nav" aria-label={t("primary")}>
        {destinations.map(({ id, icon: Glyph }) => (
          <Link
            key={id}
            className={`nav-destination nav-${id}`}
            href={`/${locale}/${id}`}
            aria-label={t(id)}
            aria-current={destination === id ? "page" : undefined}
            onClick={() => host.haptic()}
          >
            <span className="nav-icon">
              <Glyph
                size={id === "share" ? 22 : 18}
                strokeWidth={2}
                fill="none"
                aria-hidden
              />
            </span>
            <span className="nav-label">{t(id)}</span>
            {destination === id && id !== "share" && (
              <span className="nav-active-dot" aria-hidden />
            )}
          </Link>
        ))}
      </nav>
      {dialog === "account" && <ProfileMenu onClose={() => setDialog(null)} />}
      {dialog === "notifications" && (
        <NoticeDialog
          title={c(`${dialog}Title`)}
          onClose={() => setDialog(null)}
        >
          <p>{c(`${dialog}Body`)}</p>
        </NoticeDialog>
      )}
    </div>
  );
}
