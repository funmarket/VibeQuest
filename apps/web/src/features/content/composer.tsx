"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import {
  gossipEmojis,
  gossipPostInputSchema,
  type GossipTextPost,
} from "@vq/contracts";
import {
  createOwnTextPost,
  editOwnTextPost,
  uploadImage,
  deleteMedia,
  ContentRequestError,
  readOwnTextPost,
} from "@vq/api-client";
import { useAccount } from "../identity/account-provider";
import { AccountForm } from "../identity/account-form";
import { X, Send, ImagePlus, MapPin } from "lucide-react";

const locations = [
  "Mission District",
  "SoMa Node",
  "Castro Street",
  "Chinatown Hub",
  "Ferry Building",
  "Golden Gate Park",
];
export function GossipComposer({
  post,
  onClose,
  onSaved,
}: {
  post?: GossipTextPost;
  onClose: () => void;
  onSaved: () => void;
}) {
  const t = useTranslations("content"),
    { account } = useAccount(),
    ref = useRef<HTMLDialogElement>(null);
  const [current, setCurrent] = useState(post),
    [text, setText] = useState(post?.text ?? ""),
    [label, setLabel] = useState(post?.locationLabel ?? ""),
    [emoji, setEmoji] = useState<(typeof gossipEmojis)[number]>(
      post?.emoji ?? "✨",
    );
  const [audience, setAudience] = useState<"PUBLIC" | "FOLLOWERS_ONLY">(
      post?.audience ?? "PUBLIC",
    ),
    [network, setNetwork] = useState(true),
    [mediaId, setMediaId] = useState(post?.mediaId ?? null),
    [file, setFile] = useState<File | null>(null),
    [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState<string | null>(null),
    [conflict, setConflict] = useState(false);
  useEffect(() => {
    const previous = document.activeElement;
    ref.current?.showModal();
    return () => {
      ref.current?.close();
      if (previous instanceof HTMLElement) previous.focus();
    };
  }, []);
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );
  async function reload() {
    if (!current) return;
    setBusy(true);
    try {
      const latest = await readOwnTextPost("/api", current.id);
      setCurrent(latest);
      setText(latest.text);
      setLabel(latest.locationLabel);
      setEmoji(latest.emoji);
      setAudience(latest.audience);
      setMediaId(latest.mediaId);
      setFile(null);
      setPreview(null);
      setConflict(false);
      setError(null);
    } catch {
      setError(t("failed"));
    } finally {
      setBusy(false);
    }
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!account || !network || busy) return;
    if (
      text.length > 280 ||
      label.length > 40 ||
      (!text.trim() && !file && !mediaId)
    ) {
      setError(t("invalid"));
      return;
    }
    if (
      file &&
      (!["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
        file.size > 8 * 1024 * 1024)
    ) {
      setError(t("imageFailed"));
      return;
    }
    setBusy(true);
    setError(null);
    let uploaded: string | undefined;
    try {
      let attachment = mediaId;
      if (file) {
        uploaded = (await uploadImage("/api", file, "content")).id;
        attachment = uploaded;
      }
      const input = gossipPostInputSchema.parse({
        text,
        locationLabel: label,
        emoji,
        audience,
        mediaId: attachment,
      });
      if (current)
        await editOwnTextPost("/api", current.id, {
          ...input,
          version: current.version,
        });
      else await createOwnTextPost("/api", input);
      onSaved();
    } catch (error) {
      let cleanupFailed = false;
      if (uploaded)
        try {
          await deleteMedia("/api", uploaded);
        } catch {
          cleanupFailed = true;
        }
      const stale =
        error instanceof ContentRequestError &&
        error.code === "CONTENT_CONFLICT";
      setConflict(stale);
      setError(t(stale ? "conflict" : cleanupFailed ? "uncertain" : "failed"));
    } finally {
      setBusy(false);
    }
  }
  const image =
    preview ??
    (mediaId && current
      ? `/api/v1/media/${mediaId}/image?postId=${current.id}`
      : null);
  return (
    <dialog
      ref={ref}
      className="gossip-composer"
      aria-labelledby="gossip-composer-title"
      onClick={(event) => {
        if (event.target === event.currentTarget && !busy) {
          const box = event.currentTarget.getBoundingClientRect();
          if (
            event.clientX < box.left ||
            event.clientX > box.right ||
            event.clientY < box.top ||
            event.clientY > box.bottom
          )
            onClose();
        }
      }}
      onCancel={(event) => {
        if (busy) event.preventDefault();
        else onClose();
      }}
    >
      <div className="gossip-composer-heading">
        <button
          type="button"
          className="icon-button"
          aria-label={t("close")}
          onClick={onClose}
          disabled={busy}
        >
          <X aria-hidden />
        </button>
        <h2 id="gossip-composer-title">{t("composer")}</h2>
        {account && (
          <button
            className="primary-button gossip-publish"
            form="gossip-form"
            type="submit"
            disabled={
              busy ||
              !network ||
              (!text.trim() && !mediaId && !file) ||
              text.length > 280 ||
              conflict
            }
          >
            <Send aria-hidden />
            {busy ? t("saving") : current ? t("save") : t("publish")}
          </button>
        )}
      </div>
      {!account ? (
        <>
          <p>{t("signIn")}</p>
          <AccountForm />
        </>
      ) : (
        <form id="gossip-form" onSubmit={submit}>
          <fieldset disabled={busy}>
            <label className="sr-only" htmlFor="gossip-text">
              {t("text")}
            </label>
            <textarea
              id="gossip-text"
              maxLength={280}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t("placeholder")}
            />
            {image && (
              <div className="gossip-preview">
                <img src={image} alt={t("preview")} />
                <button
                  type="button"
                  onClick={() => {
                    setMediaId(null);
                    setFile(null);
                    setPreview(null);
                  }}
                >
                  {t("removeImage")}
                </button>
              </div>
            )}
            <div className="gossip-compose-footer">
              <div className="gossip-emojis">
                {gossipEmojis.slice(0, 6).map((value) => (
                  <button
                    type="button"
                    key={value}
                    aria-label={value}
                    aria-pressed={emoji === value}
                    onClick={() => {
                      setEmoji(value);
                      if (text.length + value.length <= 280)
                        setText(text + value);
                    }}
                  >
                    {value}
                  </button>
                ))}
              </div>
              <output
                className="gossip-counter"
                data-warning={280 - text.length <= 30}
                aria-live="polite"
              >
                {t("remaining", { count: 280 - text.length })}
              </output>
            </div>
            <label className="gossip-file">
              <ImagePlus aria-hidden />
              {t("image")}
              <input
                type="file"
                className="sr-only"
                aria-label={t("image")}
                accept="image/png,image/jpeg,image/webp"
                onChange={(event) => {
                  const chosen = event.target.files?.[0];
                  if (chosen) {
                    setFile(chosen);
                    setPreview(URL.createObjectURL(chosen));
                  }
                  event.target.value = "";
                }}
              />
            </label>
            <label>
              <MapPin aria-hidden />
              {t("location")}
              <select
                aria-label={t("presetLocation")}
                value={locations.includes(label) ? label : ""}
                onChange={(e) => setLabel(e.target.value)}
              >
                <option value="">{t("customLocation")}</option>
                {locations.map((place) => (
                  <option key={place}>{place}</option>
                ))}
              </select>
            </label>
            <label>
              {t("customLocation")}
              <input
                maxLength={40}
                aria-label={t("customLocation")}
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />
            </label>
            <p className="gossip-hint">{t("labelHint")}</p>
            <div className="gossip-distribution">
              <label>
                <input
                  type="checkbox"
                  checked={network}
                  onChange={(e) => setNetwork(e.target.checked)}
                />
                {t("network")}
              </label>
              <label>
                <input type="checkbox" checked={false} disabled />
                {t("local")}
              </label>
            </div>
            <p className="gossip-hint">{t("localUnavailable")}</p>
            <label>
              {t("visibility")}
              <select
                aria-label={t("visibility")}
                value={audience}
                onChange={(e) => setAudience(e.target.value as typeof audience)}
              >
                <option value="PUBLIC">{t("public")}</option>
                <option value="FOLLOWERS_ONLY">{t("followers")}</option>
              </select>
            </label>
          </fieldset>
          {error && <p role="alert">{error}</p>}
          {conflict && (
            <button type="button" disabled={busy} onClick={() => void reload()}>
              {t("reload")}
            </button>
          )}
        </form>
      )}
    </dialog>
  );
}
