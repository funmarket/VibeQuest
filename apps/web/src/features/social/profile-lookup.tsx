"use client";
import { useState, type FormEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
export function ProfileLookup() {
  const t = useTranslations("social");
  const locale = useLocale();
  const router = useRouter();
  const [handle, setHandle] = useState("");
  function submit(event: FormEvent) {
    event.preventDefault();
    const value = handle.trim().replace(/^@/, "").toLowerCase();
    if (/^[a-z0-9_]{3,30}$/.test(value))
      router.push(`/${locale}/people/${encodeURIComponent(value)}`);
  }
  return (
    <form className="social-lookup" onSubmit={submit}>
      <label>
        {t("lookup")}
        <input
          value={handle}
          onChange={(e) => setHandle(e.target.value)}
          required
          pattern="@?[a-zA-Z0-9_]{3,30}"
          maxLength={31}
          autoCapitalize="none"
          autoCorrect="off"
        />
      </label>
      <button type="submit">{t("openProfile")}</button>
    </form>
  );
}
