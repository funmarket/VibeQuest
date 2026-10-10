"use client";
import { useEffect, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { profileRequest } from "@vq/api-client";
import type { Profile } from "@vq/contracts";
import { ProfilePhoto } from "./profile-photo";

export function ProfileForm() {
  const t = useTranslations("identity");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    let live = true;
    profileRequest("/api")
      .then((result) => {
        if (live) setProfile(result.profile);
      })
      .catch(() => {
        if (live) setError(t("profileUnavailable"));
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [t]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setBusy(true);
    setSaved(false);
    setError(null);
    try {
      const result = await profileRequest("/api", {
        name: String(data.get("name")),
        bio: String(data.get("bio")),
        handle: String(data.get("handle")).trim() || null,
        favoriteVibe: String(data.get("favoriteVibe")),
        version: profile?.version ?? 0,
      });
      setProfile(result.profile);
      setSaved(true);
    } catch (error) {
      setError(
        t(
          error instanceof Error && error.message === "STALE_PROFILE"
            ? "staleProfile"
            : error instanceof Error && error.message === "HANDLE_UNAVAILABLE"
              ? "handleUnavailable"
              : "profileUnavailable",
        ),
      );
    } finally {
      setBusy(false);
    }
  }
  if (loading) return <p role="status">{t("loading")}</p>;
  return (
    <details>
      <summary>{t("editProfile")}</summary>
      <p>{t(profile?.completed ? "profileComplete" : "profileIncomplete")}</p>
      {profile && <ProfilePhoto profile={profile} onChange={setProfile} />}
      <form className="account-form" onSubmit={submit}>
        <label>
          {t("profileName")}
          <input
            name="name"
            defaultValue={profile?.name ?? ""}
            maxLength={80}
            autoComplete="nickname"
          />
        </label>
        <label>
          {t("biography")}
          <textarea
            name="bio"
            defaultValue={profile?.bio ?? ""}
            maxLength={1000}
            rows={3}
          />
        </label>
        <label>
          {t("handle")}
          <input
            name="handle"
            defaultValue={profile?.handle ?? ""}
            pattern="[a-zA-Z0-9_]{3,30}"
            maxLength={30}
          />
        </label>
        <label>
          {t("favoriteVibe")}
          <input
            name="favoriteVibe"
            defaultValue={profile?.favoriteVibe ?? "Cozy"}
            required
            maxLength={32}
          />
        </label>
        <button className="primary-button" disabled={busy} type="submit">
          {busy ? t("loading") : t("saveProfile")}
        </button>
      </form>
      {saved && <p role="status">{t("profileSaved")}</p>}
      {error && <p role="alert">{error}</p>}
    </details>
  );
}
