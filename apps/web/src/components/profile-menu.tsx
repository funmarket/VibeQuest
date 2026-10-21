"use client";
import { useCallback, useEffect, useId, useRef, type RefObject } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "@vq/ui/theme";
import { X } from "lucide-react";
import { AccountForm } from "../features/identity/account-form";
import "../features/identity/account.css";
import {
  consoleVelocity,
  shouldCloseConsole,
  type ConsolePoint,
} from "./console-gesture";
export function ProfileMenu({
  onClose,
  closeRequest,
}: {
  onClose: () => void;
  closeRequest: RefObject<(() => void) | null>;
}) {
  const t = useTranslations("identity");
  const c = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const path = usePathname();
  const theme = useTheme();
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  const closing = useRef(false);
  const animation = useRef<Animation | null>(null);
  const gesture = useRef<{
    pointer: number;
    x: number;
    y: number;
    dragging: boolean;
    points: ConsolePoint[];
  } | null>(null);
  const dragged = useRef(false);
  const requestClose = useCallback(() => {
    const dialog = ref.current;
    if (!dialog || closing.current) return;
    closing.current = true;
    animation.current?.cancel();
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      onClose();
      return;
    }
    const exit = dialog.animate(
      [
        { transform: getComputedStyle(dialog).transform },
        { transform: "translateX(100%)" },
      ],
      { duration: 220, easing: "cubic-bezier(.4,0,1,1)", fill: "forwards" },
    );
    animation.current = exit;
    void exit.finished.then(onClose, () => {});
  }, [onClose]);
  useEffect(() => {
    closeRequest.current = requestClose;
    return () => {
      closeRequest.current = null;
    };
  }, [closeRequest, requestClose]);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const dialog = ref.current;
    dialog?.showModal();
    return () => {
      animation.current?.cancel();
      dialog?.close();
      if (previous?.isConnected) previous.focus({ preventScroll: true });
    };
  }, []);
  function settle() {
    const dialog = ref.current;
    if (!dialog) return;
    const from = getComputedStyle(dialog).transform;
    dialog.style.transform = "";
    animation.current = dialog.animate(
      [{ transform: from }, { transform: "translateX(0)" }],
      {
        duration: matchMedia("(prefers-reduced-motion: reduce)").matches
          ? 0
          : 300,
        easing: "cubic-bezier(.22,1,.36,1)",
      },
    );
  }
  return (
    <dialog
      ref={ref}
      className="profile-menu"
      aria-labelledby={id}
      onCancel={(event) => {
        event.preventDefault();
        requestClose();
      }}
      onPointerDown={(event) => {
        dragged.current = false;
        const target = event.target as HTMLElement;
        // Keep text selection and every nested form/control native. Only the
        // drawer's blank space and heading are drag surfaces.
        if (
          !event.isPrimary ||
          event.button !== 0 ||
          closing.current ||
          (target !== event.currentTarget &&
            !target.closest(".profile-menu-heading")) ||
          target.closest(
            "button,a,input,textarea,select,summary,label,[contenteditable]",
          )
        )
          return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (
          event.clientX < bounds.left ||
          event.clientX > bounds.right ||
          event.clientY < bounds.top ||
          event.clientY > bounds.bottom
        )
          return;
        event.currentTarget
          .getAnimations()
          .forEach((running) => running.cancel());
        gesture.current = {
          pointer: event.pointerId,
          x: event.clientX,
          y: event.clientY,
          dragging: false,
          points: [{ x: event.clientX, time: event.timeStamp }],
        };
      }}
      onPointerMove={(event) => {
        const drag = gesture.current;
        if (!drag || drag.pointer !== event.pointerId) return;
        const dx = event.clientX - drag.x;
        const dy = event.clientY - drag.y;
        if (!drag.dragging) {
          if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 8) {
            gesture.current = null;
            return;
          }
          if (Math.abs(dx) <= 8) return;
          drag.dragging = true;
          dragged.current = true;
          event.currentTarget.setPointerCapture(event.pointerId);
        }
        drag.points.push({ x: event.clientX, time: event.timeStamp });
        while (
          drag.points.length > 2 &&
          event.timeStamp - drag.points[1].time > 100
        )
          drag.points.shift();
        event.currentTarget.style.transform = `translateX(${Math.max(0, dx)}px)`;
      }}
      onPointerUp={(event) => {
        const drag = gesture.current;
        gesture.current = null;
        if (!drag || drag.pointer !== event.pointerId || !drag.dragging) return;
        drag.points.push({ x: event.clientX, time: event.timeStamp });
        if (
          shouldCloseConsole(
            event.clientX - drag.x,
            consoleVelocity(drag.points),
          )
        )
          requestClose();
        else settle();
      }}
      onPointerCancel={() => {
        if (gesture.current?.dragging) settle();
        gesture.current = null;
      }}
      onClick={(event) => {
        if (dragged.current) {
          dragged.current = false;
          return;
        }
        if (event.target !== event.currentTarget) return;
        const rect = event.currentTarget.getBoundingClientRect();
        if (
          event.clientX < rect.left ||
          event.clientX > rect.right ||
          event.clientY < rect.top ||
          event.clientY > rect.bottom
        )
          requestClose();
      }}
    >
      <div className="profile-menu-heading">
        <h2 id={id}>{t("console")}</h2>
        <button
          className="icon-button"
          onClick={requestClose}
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
