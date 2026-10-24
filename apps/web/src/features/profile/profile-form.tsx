"use client";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { profileRequest, profileHandleAvailable } from "@vq/api-client";
import {
  interestSchema,
  profileInputSchema,
  profileInterestPresets,
  type Profile,
  type ProfileInput,
} from "@vq/contracts";
import { ProfilePhoto } from "./profile-photo";

function editValues(profile: Profile | null): ProfileInput {
  return {
    name: profile?.name ?? "",
    bio: profile?.bio ?? "",
    handle: profile?.handle ?? null,
    favoriteVibe: profile?.favoriteVibe ?? "Cozy",
    version: profile?.version ?? 0,
    interests: profile?.interests ?? [],
    location: profile?.location ?? "",
    contactMethod: profile?.contactMethod ?? "telegram",
    contactEmail: profile?.contactEmail ?? "",
    phoneNumber: profile?.phoneNumber ?? "",
    xHandle: profile?.xHandle ?? "",
    telegramHandle: profile?.telegramHandle ?? "",
    cozyDiary: profile?.cozyDiary ?? false,
  };
}
type HandleState =
  "idle" | "checking" | "available" | "taken" | "unknown" | "invalid";
export function ProfileForm() {
  const t = useTranslations("identity");
  const handleStatusId = useId();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [draft, setDraft] = useState(() => editValues(null));
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stale, setStale] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editing, setEditing] = useState(false);
  const [custom, setCustom] = useState("");
  const [availability, setAvailability] = useState<{
    handle: string;
    status: HandleState;
  }>({ handle: "", status: "idle" });
  const editor = useRef<HTMLDetailsElement>(null);
  const editButton = useRef<HTMLElement>(null);
  useEffect(() => {
    let live = true;
    profileRequest("/api")
      .then((result) => {
        if (live) {
          setProfile(result.profile);
          setDraft(editValues(result.profile));
        }
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
  const handle = (draft.handle ?? "").trim().toLowerCase();
  useEffect(() => {
    if (!editing || !handle || handle === profile?.handle) return;
    if (!profileInputSchema.shape.handle.safeParse(handle).success) return;
    let live = true;
    const abort = new AbortController();
    const timer = setTimeout(() => {
      setAvailability({ handle, status: "checking" });
      profileHandleAvailable("/api", handle, abort.signal)
        .then((available) => {
          if (live)
            setAvailability({
              handle,
              status: available ? "available" : "taken",
            });
        })
        .catch(() => {
          if (live) setAvailability({ handle, status: "unknown" });
        });
    }, 450);
    return () => {
      live = false;
      abort.abort();
      clearTimeout(timer);
    };
  }, [handle, editing, profile?.handle]);
  const handleState: HandleState = !handle
    ? "idle"
    : !profileInputSchema.shape.handle.safeParse(handle).success
      ? "invalid"
      : handle === profile?.handle
        ? "available"
        : availability.handle === handle
          ? availability.status
          : "idle";
  function closeEdit() {
    setDraft(editValues(profile));
    setCustom("");
    setError(null);
    setStale(false);
    if (editor.current) editor.current.open = false;
    setEditing(false);
    editButton.current?.focus();
  }
  async function reload() {
    setBusy(true);
    setError(null);
    try {
      const result = await profileRequest("/api");
      setProfile(result.profile);
      setDraft(editValues(result.profile));
      setStale(false);
      setSaved(false);
    } catch {
      setError(t("profileUnavailable"));
    } finally {
      setBusy(false);
    }
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaved(false);
    setError(null);
    const parsed = profileInputSchema.safeParse({
      ...draft,
      handle: handle || null,
    });
    if (!parsed.success) {
      setError(t("profileInvalid"));
      return;
    }
    setBusy(true);
    try {
      const result = await profileRequest("/api", parsed.data);
      setProfile(result.profile);
      setDraft(editValues(result.profile));
      setSaved(true);
      setStale(false);
      if (editor.current) editor.current.open = false;
      setEditing(false);
      editButton.current?.focus();
    } catch (error) {
      const code = error instanceof Error ? error.message : "";
      setStale(code === "STALE_PROFILE");
      setError(
        t(
          code === "STALE_PROFILE"
            ? "staleProfile"
            : code === "HANDLE_UNAVAILABLE"
              ? "handleUnavailable"
              : "profileUnavailable",
        ),
      );
    } finally {
      setBusy(false);
    }
  }
  function toggleInterest(value: string) {
    const selected = draft.interests ?? [];
    setDraft({
      ...draft,
      interests: selected.includes(value)
        ? selected.filter((tag) => tag !== value)
        : [...selected, value],
    });
  }
  function addInterest() {
    const parsed = interestSchema.safeParse(custom);
    if (!parsed.success || (draft.interests?.length ?? 0) >= 50) {
      setError(t("profileInvalid"));
      return;
    }
    setDraft({
      ...draft,
      interests: [...new Set([...(draft.interests ?? []), parsed.data])],
    });
    setCustom("");
  }
  if (loading) return <p role="status">{t("loading")}</p>;
  return (
    <section className="self-profile" aria-label={t("selfProfile")}>
      <h3>{t("selfProfile")}</h3>
      {!editing && (
        <div className="self-profile-summary">
          {profile?.photoMediaId && (
            <img
              src={`/api/v1/media/${profile.photoMediaId}/thumbnail`}
              width={96}
              height={96}
              alt={t("profilePhoto")}
            />
          )}
          {profile?.name && <strong>{profile.name}</strong>}
          {profile?.handle && <p dir="ltr">@{profile.handle}</p>}
          {profile?.bio && <p>{profile.bio}</p>}
          {profile?.location && <p>{profile.location}</p>}
          <div className="profile-interests">
            {profile?.interests.map((tag) => (
              <span key={tag}>#{tag}</span>
            ))}
          </div>
        </div>
      )}
      <p>{t(profile?.completed ? "profileComplete" : "profileIncomplete")}</p>
      <details
        ref={editor}
        onToggle={(event) => {
          const open = event.currentTarget.open;
          setEditing(open);
          if (open) {
            setSaved(false);
            setAvailability({ handle: "", status: "idle" });
          }
          if (!open) {
            setDraft(editValues(profile));
            setCustom("");
          }
        }}
      >
        <summary ref={editButton}>{t("editProfile")}</summary>
        {editing && (
          <>
            <p>{t("profilePrivateHint")}</p>
            {profile && (
              <ProfilePhoto
                profile={profile}
                disabled={busy || stale}
                onBusy={setPhotoBusy}
                onStale={() => {
                  setStale(true);
                  setError(t("staleProfile"));
                }}
                onChange={(next) => {
                  setProfile(next);
                  setDraft((current) => ({
                    ...current,
                    version: next.version,
                  }));
                }}
              />
            )}
            <form className="account-form" onSubmit={submit}>
              <fieldset disabled={busy || photoBusy || stale}>
                <label>
                  {t("profileName")}
                  <input
                    name="name"
                    value={draft.name}
                    maxLength={80}
                    autoComplete="nickname"
                    onChange={(event) =>
                      setDraft({ ...draft, name: event.target.value })
                    }
                  />
                </label>
                <label>
                  {t("handle")}
                  <input
                    name="handle"
                    value={draft.handle ?? ""}
                    pattern="[a-zA-Z0-9_]{3,30}"
                    maxLength={30}
                    aria-describedby={handleStatusId}
                    onChange={(event) => {
                      setAvailability({ handle: "", status: "idle" });
                      setDraft({ ...draft, handle: event.target.value });
                    }}
                  />
                </label>
                <p id={handleStatusId} role="status">
                  {t(`handleStatus_${handleState}`)}
                </p>
                <label>
                  {t("biography")}
                  <textarea
                    name="bio"
                    value={draft.bio}
                    maxLength={1000}
                    rows={3}
                    onChange={(event) =>
                      setDraft({ ...draft, bio: event.target.value })
                    }
                  />
                </label>
                <label>
                  {t("favoriteVibe")}
                  <input
                    name="favoriteVibe"
                    value={draft.favoriteVibe}
                    required
                    maxLength={32}
                    onChange={(event) =>
                      setDraft({ ...draft, favoriteVibe: event.target.value })
                    }
                  />
                </label>
                <fieldset className="profile-interest-controls">
                  <legend>{t("interests")}</legend>
                  <div className="profile-interests">
                    {profileInterestPresets.map((tag) => (
                      <button
                        className="soft-button"
                        key={tag}
                        type="button"
                        aria-pressed={draft.interests?.includes(tag) ?? false}
                        onClick={() => toggleInterest(tag)}
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                  <label>
                    {t("customInterest")}
                    <input
                      value={custom}
                      maxLength={64}
                      onChange={(event) =>
                        setCustom(event.target.value.replace(/\s+/g, "-"))
                      }
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          addInterest();
                        }
                      }}
                    />
                  </label>
                  <button
                    className="soft-button"
                    type="button"
                    onClick={addInterest}
                  >
                    {t("addInterest")}
                  </button>
                  <div className="profile-interests">
                    {draft.interests
                      ?.filter(
                        (tag) =>
                          !profileInterestPresets.some(
                            (preset) => preset === tag,
                          ),
                      )
                      .map((tag) => (
                        <button
                          className="soft-button"
                          type="button"
                          key={tag}
                          onClick={() => toggleInterest(tag)}
                          aria-label={`${t("removeInterest")} ${tag}`}
                        >
                          #{tag} ×
                        </button>
                      ))}
                  </div>
                  <p>
                    {t("interestCount", {
                      count: draft.interests?.length ?? 0,
                    })}
                  </p>
                </fieldset>
                <label>
                  {t("location")}
                  <input
                    name="location"
                    value={draft.location}
                    maxLength={200}
                    onChange={(event) =>
                      setDraft({ ...draft, location: event.target.value })
                    }
                  />
                </label>
                <label>
                  {t("contactMethod")}
                  <select
                    name="contactMethod"
                    aria-label={t("contactMethod")}
                    value={draft.contactMethod}
                    onChange={(event) =>
                      setDraft({
                        ...draft,
                        contactMethod: event.target
                          .value as ProfileInput["contactMethod"],
                      })
                    }
                  >
                    <option value="telegram">{t("contactTelegram")}</option>
                    <option value="x">{t("contactX")}</option>
                    <option value="email">{t("contactEmail")}</option>
                  </select>
                </label>
                <label>
                  {t("contactEmail")}
                  <input
                    name="contactEmail"
                    type="email"
                    maxLength={254}
                    value={draft.contactEmail}
                    onChange={(event) =>
                      setDraft({ ...draft, contactEmail: event.target.value })
                    }
                  />
                </label>
                <label>
                  {t("phoneNumber")}
                  <input
                    name="phoneNumber"
                    type="tel"
                    maxLength={40}
                    value={draft.phoneNumber}
                    onChange={(event) =>
                      setDraft({ ...draft, phoneNumber: event.target.value })
                    }
                  />
                </label>
                <label>
                  {t("xHandle")}
                  <input
                    name="xHandle"
                    maxLength={33}
                    value={draft.xHandle}
                    onChange={(event) =>
                      setDraft({ ...draft, xHandle: event.target.value })
                    }
                  />
                </label>
                <label>
                  {t("telegramHandle")}
                  <input
                    name="telegramHandle"
                    maxLength={33}
                    value={draft.telegramHandle}
                    onChange={(event) =>
                      setDraft({ ...draft, telegramHandle: event.target.value })
                    }
                  />
                </label>
                <label className="profile-checkbox">
                  <input
                    type="checkbox"
                    name="cozyDiary"
                    checked={draft.cozyDiary}
                    onChange={(event) =>
                      setDraft({ ...draft, cozyDiary: event.target.checked })
                    }
                  />
                  {t("cozyDiary")}
                </label>
                <p>{t("cozyDiaryHint")}</p>
                <button
                  className="primary-button"
                  disabled={handleState === "taken"}
                  type="submit"
                >
                  {busy ? t("loading") : t("saveProfile")}
                </button>
              </fieldset>
              <button
                className="soft-button"
                disabled={busy || photoBusy}
                type="button"
                onClick={closeEdit}
              >
                {t("cancelProfile")}
              </button>
            </form>
          </>
        )}
      </details>
      {saved && <p role="status">{t("profileSaved")}</p>}
      {error && <p role="alert">{error}</p>}
      {(stale || (error && !profile)) && (
        <button
          className="soft-button"
          disabled={busy || photoBusy}
          onClick={reload}
        >
          {t("reloadProfile")}
        </button>
      )}
    </section>
  );
}
