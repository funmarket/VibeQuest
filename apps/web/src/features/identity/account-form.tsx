"use client";
import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { AccountRequestError } from "@vq/api-client";
import { useAccount } from "./account-provider";
import { ProfileForm } from "../profile/profile-form";
import { BusinessConsole } from "../business/business-console";
export function AccountForm() {
  const t = useTranslations("identity");
  const { account, loading, unavailable, authenticate, logout } = useAccount();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  function report(error: unknown) {
    const code =
      error instanceof AccountRequestError
        ? error.code
        : "IDENTITY_UNAVAILABLE";
    setError(
      t(
        code === "INVALID_CREDENTIALS"
          ? "invalidCredentials"
          : code === "EMAIL_UNAVAILABLE"
            ? "emailUnavailable"
            : code === "RATE_LIMITED"
              ? "rateLimited"
              : "unavailable",
      ),
    );
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setBusy(true);
    setError(null);
    try {
      await authenticate(mode, {
        email: String(data.get("email")),
        password: String(data.get("password")),
      });
    } catch (error) {
      report(error);
    } finally {
      setBusy(false);
    }
  }
  async function signOut() {
    setBusy(true);
    setError(null);
    try {
      await logout();
    } catch (error) {
      report(error);
    } finally {
      setBusy(false);
    }
  }
  if (loading) return <p role="status">{t("loading")}</p>;
  return (
    <div className="account-content">
      {unavailable && <p role="status">{t("unavailable")}</p>}
      {account ? (
        <>
          <p className="account-email">{account.email}</p>
          <p>{t(account.emailVerified ? "verified" : "unverified")}</p>
          <ProfileForm key={account.id} />
          <BusinessConsole key={`business-${account.id}`} />
          <button className="soft-button" disabled={busy} onClick={signOut}>
            {t("logout")}
          </button>
        </>
      ) : (
        <>
          <div className="account-modes">
            <button
              type="button"
              className="soft-button"
              aria-pressed={mode === "login"}
              onClick={() => {
                setMode("login");
                setError(null);
              }}
            >
              {t("login")}
            </button>
            <button
              type="button"
              className="soft-button"
              aria-pressed={mode === "register"}
              onClick={() => {
                setMode("register");
                setError(null);
              }}
            >
              {t("create")}
            </button>
          </div>
          <form onSubmit={submit} className="account-form">
            <label>
              {t("email")}
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                maxLength={254}
              />
            </label>
            <label>
              {t("password")}
              <input
                name="password"
                type="password"
                autoComplete={
                  mode === "register" ? "new-password" : "current-password"
                }
                required
                minLength={12}
                maxLength={128}
              />
            </label>
            <p>{t("passwordHint")}</p>
            <button className="primary-button" disabled={busy} type="submit">
              {busy
                ? t("loading")
                : t(mode === "register" ? "register" : "signIn")}
            </button>
          </form>
        </>
      )}
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
