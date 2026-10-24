"use client";
import { useEffect, useState, type ChangeEvent } from "react";
import { useTranslations } from "next-intl";
import type { Profile } from "@vq/contracts";
import { uploadImage, attachProfilePhoto, deleteMedia } from "@vq/api-client";

export function ProfilePhoto({
  profile,
  onChange,
  onBusy,
  onStale,
  disabled,
}: {
  profile: Profile;
  onChange: (profile: Profile) => void;
  onBusy: (busy: boolean) => void;
  onStale: () => void;
  disabled: boolean;
}) {
  const t = useTranslations("identity");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [selected, setSelected] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    if (!selected) return;
    const url = URL.createObjectURL(selected);
    setPreview(url);
    return () => {
      URL.revokeObjectURL(url);
      setPreview(null);
    };
  }, [selected]);
  function select(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setSaved(false);
    setError(false);
    setSelected(file ?? null);
    event.target.value = "";
  }
  async function upload() {
    const file = selected;
    if (!file) return;
    setBusy(true);
    onBusy(true);
    setSaved(false);
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
      setSelected(null);
      setSaved(true);
      uploadedId = undefined;
    } catch (error) {
      setError(true);
      if (error instanceof Error && error.message === "STALE_PROFILE")
        onStale();
      if (uploadedId)
        await deleteMedia("/api", uploadedId).catch(() => {
          /* Pending cleanup remains server-owned. */
        });
    } finally {
      setBusy(false);
      onBusy(false);
    }
  }
  async function remove() {
    setBusy(true);
    onBusy(true);
    setSaved(false);
    setError(false);
    try {
      const saved = await attachProfilePhoto("/api", null, profile.version);
      if (!saved) throw new Error("Profile response missing");
      onChange(saved);
      setSelected(null);
      setSaved(true);
    } catch (error) {
      setError(true);
      if (error instanceof Error && error.message === "STALE_PROFILE")
        onStale();
    } finally {
      setBusy(false);
      onBusy(false);
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
          <button
            className="soft-button"
            onClick={remove}
            disabled={busy || disabled}
          >
            {t("removePhoto")}
          </button>
        </>
      )}
      <label>
        {t("profilePhoto")}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={busy || disabled}
          onChange={select}
        />
      </label>
      <p>{t("photoSaveHint")}</p>
      {preview && (
        <img src={preview} width={96} height={96} alt={t("photoPreview")} />
      )}
      {selected && (
        <>
          <button
            className="soft-button"
            disabled={busy || disabled}
            onClick={upload}
          >
            {t("updatePhoto")}
          </button>
          <button
            className="soft-button"
            disabled={busy}
            onClick={() => setSelected(null)}
          >
            {t("cancelPhoto")}
          </button>
        </>
      )}
      {saved && <p role="status">{t("photoSaved")}</p>}
      {busy && <p role="status">{t("loading")}</p>}
      {error && <p role="alert">{t("photoFailed")}</p>}
    </div>
  );
}
