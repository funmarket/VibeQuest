"use client";
import { useId, useRef, useEffect, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { X, ArrowUpRight, Clock } from "lucide-react";

export function Section({
  title,
  children,
  className = "",
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`panel ${className}`}>
      <h2>{title}</h2>
      {children}
    </section>
  );
}
export function Empty({ children }: { children: ReactNode }) {
  return <p className="empty-copy">{children}</p>;
}
export function PendingButton({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button className="soft-button" onClick={onClick}>
      {children}
      <ArrowUpRight data-icon-role="action" aria-hidden />
    </button>
  );
}
export function NoticeDialog({
  title,
  children,
  onClose,
  planned = true,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  planned?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  const t = useTranslations("common");
  useEffect(() => {
    const element = ref.current;
    const previous =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    element?.showModal();
    return () => {
      element?.close();
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="notice-dialog"
      aria-labelledby={id}
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="dialog-heading">
        {planned && (
          <span className="eyebrow">
            <Clock data-icon-role="metadata" aria-hidden />
            {t("planned")}
          </span>
        )}
        <button
          className="icon-button"
          aria-label={t("close")}
          onClick={onClose}
        >
          <X data-icon-role="action" aria-hidden />
        </button>
      </div>
      <h2 id={id}>{title}</h2>
      {children}
      <button className="primary-button" onClick={onClose}>
        {t("close")}
      </button>
    </dialog>
  );
}
export function PageEnd() {
  return <div data-page-end className="page-end" aria-hidden />;
}
