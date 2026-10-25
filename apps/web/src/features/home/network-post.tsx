"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Heart, MessageSquare, Send } from "lucide-react";
import type {
  ContentCursor,
  GossipComment,
  GossipView,
  PublicProfile,
} from "@vq/contracts";
import {
  ContentRequestError,
  postGossipComment,
  reactToGossip,
  readGossipComments,
  readGossipPost,
} from "@vq/api-client";
import { useAccount } from "../identity/account-provider";
import { AccountForm } from "../identity/account-form";
import { copyHomePost, homePostPath } from "./post-link";

function mergeComments(existing: GossipComment[], incoming: GossipComment[]) {
  const comments = new Map(existing.map((comment) => [comment.id, comment]));
  for (const comment of incoming) comments.set(comment.id, comment);
  return [...comments.values()].sort(
    (a, b) =>
      a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id),
  );
}

function Author({ author }: { author: PublicProfile }) {
  const locale = useLocale();
  const name = author.name || author.handle || author.id;
  return author.handle ? (
    <Link
      href={`/${locale}/people/${encodeURIComponent(author.handle)}`}
      prefetch={false}
    >
      {name}
    </Link>
  ) : (
    <span>{name}</span>
  );
}
export function NetworkPost({
  post,
  onChange,
  onUnavailable,
}: {
  post: GossipView;
  onChange: (post: GossipView) => void;
  onUnavailable: () => void;
}) {
  const t = useTranslations("content"),
    h = useTranslations("home"),
    locale = useLocale(),
    { account } = useAccount();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(false),
    [open, setOpen] = useState(false),
    [comments, setComments] = useState<GossipComment[]>([]),
    [cursor, setCursor] = useState<ContentCursor | null>(null),
    [text, setText] = useState(""),
    [auth, setAuth] = useState(false),
    [copy, setCopy] = useState<"copied" | "copyFailed" | null>(null);
  const pending = useRef(false);
  async function action(work: () => Promise<void>) {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError(false);
    try {
      await work();
    } catch (error) {
      if (
        error instanceof ContentRequestError &&
        (error.code === "CONTENT_NOT_FOUND" || error.code === "AUTH_REQUIRED")
      )
        onUnavailable();
      else setError(true);
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  async function load(after: ContentCursor | null = null) {
    const result = await readGossipComments("/api", post.id, after);
    setComments((old) =>
      after ? mergeComments(old, result.comments) : result.comments,
    );
    setCursor(result.nextCursor);
  }
  return (
    <article className="network-post" data-post-id={post.id}>
      {post.mediaId && (
        <img
          className="network-cover"
          src={`/api/v1/media/${post.mediaId}/image?postId=${post.id}`}
          alt={t("attachment")}
        />
      )}
      <header className="network-author">
        <span className="network-avatar" aria-hidden>
          {post.emoji}
        </span>
        <div>
          <strong>
            <Author author={post.author} />
          </strong>
          <a href={homePostPath(locale, post.id)} aria-label={h("openPost")}>
            <time dateTime={post.createdAt}>
              {new Intl.DateTimeFormat(locale, {
                dateStyle: "medium",
                timeStyle: "short",
              }).format(new Date(post.createdAt))}
            </time>
          </a>
        </div>
        <span className="network-audience">
          {t(post.audience === "PUBLIC" ? "public" : "followers")}
        </span>
      </header>
      <p className="network-text">{post.text}</p>
      {post.locationLabel && (
        <p className="network-location">
          {t("location")}: {post.locationLabel}
        </p>
      )}
      <div className="network-actions">
        <button
          disabled={busy}
          aria-label={t(post.liked ? "unlike" : "like")}
          aria-pressed={post.liked}
          onClick={() => {
            if (!account) {
              setAuth(true);
              return;
            }
            void action(async () =>
              onChange(await reactToGossip("/api", post.id, !post.liked)),
            );
          }}
        >
          <Heart aria-hidden />
          <span>{post.likeCount}</span>
        </button>
        <button
          disabled={busy}
          aria-label={t("comments")}
          aria-expanded={open}
          aria-controls={`network-comments-${post.id}`}
          onClick={() => {
            if (open) {
              setOpen(false);
              return;
            }
            void action(async () => {
              await load();
              onChange(await readGossipPost("/api", post.id));
              setOpen(true);
            });
          }}
        >
          <MessageSquare aria-hidden />
          <span>{post.commentCount}</span>
        </button>
        <button
          disabled={busy}
          aria-label={h("sharePost")}
          onClick={() =>
            void action(async () => {
              setCopy(null);
              // Share only a route: no private text, media URL or preview payload.
              try {
                onChange(await readGossipPost("/api", post.id));
                await copyHomePost(
                  window.location.origin,
                  locale,
                  post.id,
                  navigator.clipboard,
                );
                setCopy("copied");
              } catch (error) {
                if (error instanceof ContentRequestError) throw error;
                setCopy("copyFailed");
              }
            })
          }
        >
          <Send aria-hidden />
          <span>{h("sharePost")}</span>
        </button>
      </div>
      {copy && <p role={copy === "copied" ? "status" : "alert"}>{h(copy)}</p>}
      {error && (
        <p role="alert">
          {t("failed")}{" "}
          <button
            disabled={busy}
            onClick={() =>
              void action(async () => {
                onChange(await readGossipPost("/api", post.id));
                if (open) await load();
              })
            }
          >
            {t("reload")}
          </button>
        </p>
      )}
      {auth && !account && !open && (
        <div className="network-auth">
          <p>{t("signIn")}</p>
          <AccountForm />
        </div>
      )}
      {open && (
        <section
          className="network-comments"
          id={`network-comments-${post.id}`}
          aria-label={t("comments")}
        >
          <div className="network-comment-list">
            {!comments.length && <p>{h("noComments")}</p>}
            {comments.map((comment) => (
              <div className="network-comment" key={comment.id}>
                {comment.author && (
                  <strong>
                    <Author author={comment.author} />
                  </strong>
                )}
                <p>{comment.text ?? t("tombstone")}</p>
              </div>
            ))}
            {cursor && (
              <button
                disabled={busy}
                onClick={() => void action(() => load(cursor))}
              >
                {t("more")}
              </button>
            )}
          </div>
          {account ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!text.trim() || text.length > 1000) return;
                void action(async () => {
                  const saved = await postGossipComment("/api", post.id, {
                    text,
                    parentId: null,
                  });
                  setText("");
                  setComments((old) => mergeComments(old, [saved]));
                  onChange(await readGossipPost("/api", post.id));
                });
              }}
            >
              <label className="sr-only" htmlFor={`network-comment-${post.id}`}>
                {t("comment")}
              </label>
              <input
                id={`network-comment-${post.id}`}
                value={text}
                maxLength={1000}
                placeholder={t("comment")}
                disabled={busy}
                onChange={(e) => setText(e.target.value)}
              />
              <button disabled={busy || !text.trim()}>
                <Send aria-hidden />
                <span>{h("send")}</span>
              </button>
            </form>
          ) : (
            <>
              <p>{t("signIn")}</p>
              <AccountForm />
            </>
          )}
        </section>
      )}
    </article>
  );
}
