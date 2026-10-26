"use client";
import {
  useState,
  useEffect,
  useRef,
  type ReactNode,
  type CSSProperties,
} from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  Compass,
  Heart,
  Users,
  Bell,
  CircleUser,
  Sun,
  Moon,
} from "lucide-react";
import { useTheme } from "@vq/ui/theme";
import { HomeGlyph, WalletGlyph } from "./icon-glyphs";
import { useHost } from "../platform/host";
import { NoticeDialog } from "./presentation";
import { LocationEntry } from "../features/geo/location-display";
import { useGeo } from "../features/geo/geo-provider";
import { ProfileMenu } from "./profile-menu";
import { useAccount } from "../features/identity/account-provider";
import { advanceNavigationScroll } from "./navigation-scroll";

const destinations = [
  { id: "home", icon: HomeGlyph },
  { id: "explore", icon: Compass },
  { id: "share", icon: Heart },
  { id: "vibe", icon: Users },
  { id: "purse", icon: WalletGlyph },
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
  const geo = useGeo();
  const theme = useTheme();
  const themeAction = c(
    theme.theme === "dark" ? "switchToLightTheme" : "switchToDarkTheme",
  );
  const [dialog, setDialog] = useState<"account" | "notifications" | null>(
    null,
  );
  const closeConsole = useRef<(() => void) | null>(null);
  const destination = path.split("/")[2] ?? "home";
  const [navigationHidden, setNavigationHidden] = useState(false);
  useEffect(() => {
    // This app scrolls the document; nested feeds and dialogs do not own the shell.
    let state = { anchor: Math.max(0, window.scrollY), hidden: false };
    setNavigationHidden(false);
    const onScroll = () => {
      state = advanceNavigationScroll(state, window.scrollY);
      setNavigationHidden(state.hidden);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [path]);
  useEffect(
    () =>
      host.back(
        geo.settingsOpen
          ? geo.closeSettings
          : dialog === "account"
            ? () => closeConsole.current?.()
            : dialog
              ? () => setDialog(null)
              : destination === "home"
                ? undefined
                : () => router.back(),
      ),
    [host, destination, router, dialog, geo.settingsOpen, geo.closeSettings],
  );
  useEffect(() => {
    setDialog(null);
  }, [path]);
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
            type="button"
            className="icon-button quick-theme"
            aria-label={themeAction}
            title={themeAction}
            onClick={() => {
              host.haptic();
              theme.setPreference(theme.theme === "dark" ? "light" : "dark");
            }}
          >
            {theme.theme === "dark" ? (
              <Sun data-icon-role="action" aria-hidden />
            ) : (
              <Moon data-icon-role="action" aria-hidden />
            )}
          </button>
          <button
            className="icon-button notifications"
            aria-label={c("notificationsTitle")}
            onClick={() => setDialog("notifications")}
          >
            <Bell data-icon-role="action" aria-hidden />
          </button>
          <button
            className="icon-button account"
            aria-label={c("accountTitle")}
            onClick={() => setDialog("account")}
          >
            <CircleUser data-icon-role="action" aria-hidden />
          </button>
        </div>
      </header>
      <div className="context-strip">
        <LocationEntry />
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
      <main id="main" className="main-content" tabIndex={-1}>
        {children}
      </main>
      <nav
        className="bottom-nav"
        data-scroll-hidden={navigationHidden}
        aria-label={t("primary")}
      >
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
              <Glyph data-icon-role="navigation" fill="none" aria-hidden />
            </span>
            <span className="nav-label">{t(id)}</span>
            {destination === id && id !== "share" && (
              <span className="nav-active-dot" aria-hidden />
            )}
          </Link>
        ))}
      </nav>
      {dialog === "account" && (
        <ProfileMenu
          onClose={() => setDialog(null)}
          closeRequest={closeConsole}
        />
      )}
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
