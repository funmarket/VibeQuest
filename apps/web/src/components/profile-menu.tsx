"use client";
import { useEffect, useId, useRef } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "@vq/ui/theme";
import { X } from "lucide-react";
import { AccountForm } from "../features/identity/account-form";
import "../features/identity/account.css";
export function ProfileMenu({ onClose }: { onClose: () => void }) {
  const t = useTranslations("identity");
  const c = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const path = usePathname();
  const theme = useTheme();
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const dialog = ref.current;
    dialog?.showModal();
    return () => {
      dialog?.close();
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="profile-menu"
      aria-labelledby={id}
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="profile-menu-heading">
        <h2 id={id}>{t("console")}</h2>
        <button
          className="icon-button"
          onClick={onClose}
          aria-label={c("close")}
        >
          <X data-icon-role="action" aria-hidden />
        </button>
      </div>
      <details open>
        <summary>{t("settings")}</summary>
        <details>
          <summary>{t("appearance")}</summary>
          <label className="select-control">
            {c("theme")}
            <select
              aria-label={c("theme")}
              value={theme.preference}
              onChange={(event) =>
                theme.setPreference(
                  event.target.value as "light" | "dark" | "system",
                )
              }
            >
              <option value="light">{c("light")}</option>
              <option value="dark">{c("dark")}</option>
              <option value="system">{c("system")}</option>
            </select>
          </label>
        </details>
        <details>
          <summary>{c("language")}</summary>
          <label className="locale-control">
            {c("language")}
            <select
              aria-label={c("language")}
              value={locale}
              onChange={(event) => {
                const next = event.target.value;
                document.cookie = `vq.locale=${next};path=/;max-age=31536000;SameSite=Lax`;
                router.push(path.replace(/^\/(en|fr|ar|es)(?=\/)/, `/${next}`));
              }}
            >
              <option value="en">English</option>
              <option value="fr">Français</option>
              <option value="ar">العربية</option>
              <option value="es">Español</option>
            </select>
          </label>
        </details>
      </details>
      <details open>
        <summary>{t("account")}</summary>
        <AccountForm />
      </details>
    </dialog>
  );
}
