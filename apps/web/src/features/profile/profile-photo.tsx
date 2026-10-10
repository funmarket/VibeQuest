"use client";
import { useState, type ChangeEvent } from "react";
import { useTranslations } from "next-intl";
import type { Profile } from "@vq/contracts";
import { uploadImage, attachProfilePhoto, deleteMedia } from "@vq/api-client";

export function ProfilePhoto({
  profile,
  onChange,
}: {
  profile: Profile;
  onChange: (profile: Profile) => void;
}) {
  const t = useTranslations("identity");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError(false);
    let uploadedId: string | undefined;
    try {
      const uploaded = await uploadImage("/api", file);
      uploadedId = uploaded.id;
      const saved = await attachProfilePhoto(
        "/api",
        uploaded.id,
        profile.version,
      );
      if (!saved) throw new Error("Profile response missing");
      onChange(saved);
      uploadedId = undefined;
    } catch {
      setError(true);
      if (uploadedId)
        await deleteMedia("/api", uploadedId).catch(() => {
          /* Pending cleanup remains server-owned. */
        });
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    setBusy(true);
    setError(false);
    try {
      const saved = await attachProfilePhoto("/api", null, profile.version);
      if (!saved) throw new Error("Profile response missing");
      onChange(saved);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="profile-photo">
      {profile.photoMediaId && (
        <>
          <img
            src={`/api/v1/media/${profile.photoMediaId}/thumbnail`}
            width={96}
            height={96}
            alt={t("profilePhoto")}
          />
          <button className="soft-button" onClick={remove} disabled={busy}>
            {t("removePhoto")}
          </button>
        </>
      )}
      <label>
        {t("profilePhoto")}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={busy}
          onChange={upload}
        />
      </label>
      {busy && <p role="status">{t("loading")}</p>}
      {error && <p role="alert">{t("photoFailed")}</p>}
    </div>
  );
}
