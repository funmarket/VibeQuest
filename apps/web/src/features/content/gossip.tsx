"use client";
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import type {
  ContentCursor,
  GossipView,
  GossipTextPost,
  GossipComment,
  PublicProfile,
} from "@vq/contracts";
import {
  readGossipFeed,
  reactToGossip,
  readGossipComments,
  postGossipComment,
  removeGossipComment,
  readGossipPost,
  deleteOwnPost,
  listOwnTextPosts,
  restoreOwnPost,
  setBlocked,
  readBlockedPeople,
  canModerateGossip,
} from "@vq/api-client";
import { useAccount } from "../identity/account-provider";
import { AccountForm } from "../identity/account-form";
import { Heart, MessageCircle } from "lucide-react";
import "./content.css";
import { GossipReportForm, GossipModeration } from "./moderation";

export function GossipPanel({
  onEdit,
  onRefresh,
}: {
  onEdit: (post: GossipTextPost) => void;
  onRefresh: () => void;
}) {
  const t = useTranslations("content"),
    { account } = useAccount();
  const [posts, setPosts] = useState<GossipView[]>([]),
    [cursor, setCursor] = useState<ContentCursor | null>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(false),
    [deleted, setDeleted] = useState<GossipTextPost[] | null>(null),
    [deletedCursor, setDeletedCursor] = useState<ContentCursor | null>(null),
    [blocked, setBlockedPeople] = useState<PublicProfile[] | null>(null),
    [busy, setBusy] = useState(false),
    [canModerate, setCanModerate] = useState(false),
    [showModeration, setShowModeration] = useState(false);
  useEffect(() => {
    let live = true;
    if (account)
      canModerateGossip("/api")
        .then((allowed) => {
          if (live) setCanModerate(allowed);
        })
        .catch(() => {
          if (live) setError(true);
        });
    return () => {
      live = false;
    };
  }, [account]);
  useEffect(() => {
    const controller = new AbortController();
    readGossipFeed("/api", null, controller.signal)
      .then((result) => {
        setPosts(result.posts);
        setCursor(result.nextCursor);
      })
      .catch(() => {
        if (!controller.signal.aborted) setError(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);
  async function action(work: () => Promise<void>) {
    if (busy) return;
    setBusy(true);
    setError(false);
    try {
      await work();
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }
  async function loadDeleted(after: ContentCursor | null = null) {
    const result = await listOwnTextPosts("/api", true, after);
    setDeleted((old) =>
      after ? [...(old ?? []), ...result.posts] : result.posts,
    );
    setDeletedCursor(result.nextCursor);
  }
  return (
    <div className="gossip-feed">
      <div className="gossip-toolbar">
        <h2>{t("gossip")}</h2>
        <button disabled={busy} onClick={onRefresh}>
          {t("refresh")}
        </button>
        {account && (
          <>
            <button
              disabled={busy}
              onClick={() => void action(() => loadDeleted())}
            >
              {t("deletedPosts")}
            </button>
            <button
              disabled={busy}
              onClick={() =>
                void action(async () =>
                  setBlockedPeople(await readBlockedPeople("/api")),
                )
              }
            >
              {t("blockedPeople")}
            </button>
          </>
        )}
        {canModerate && (
          <button onClick={() => setShowModeration(!showModeration)}>
            {t("moderation")}
          </button>
        )}
      </div>
      {showModeration && <GossipModeration onDecided={onRefresh} />}
      {error && (
        <p role="alert">
          {t("failed")} <button onClick={onRefresh}>{t("reload")}</button>
        </p>
      )}
      {blocked && (
        <section className="gossip-blocked">
          <h3>{t("blockedPeople")}</h3>
          {!blocked.length && <p>{t("empty")}</p>}
          {blocked.map((person) => (
            <div key={person.id}>
              <span>{person.handle ?? (person.name || person.id)}</span>
              <button
                disabled={busy}
                onClick={() =>
                  void action(async () => {
                    await setBlocked("/api", person.id, false);
                    setBlockedPeople(blocked.filter((p) => p.id !== person.id));
                    onRefresh();
                  })
                }
              >
                {t("unblock")}
              </button>
            </div>
          ))}
        </section>
      )}
      {deleted && (
        <section>
          <h3>{t("deletedPosts")}</h3>
          {!deleted.length && <p>{t("empty")}</p>}
          {deleted.map((post) => (
            <div className="gossip-deleted" key={post.id}>
              <p>{post.text || t("image")}</p>
              <button
                disabled={busy}
                onClick={() =>
                  void action(async () => {
                    await restoreOwnPost("/api", post.id, post.version);
                    onRefresh();
                  })
                }
              >
                {t("restore")}
              </button>
            </div>
          ))}
          {deletedCursor && (
            <button
              disabled={busy}
              onClick={() => void action(() => loadDeleted(deletedCursor))}
            >
              {t("more")}
            </button>
          )}
        </section>
      )}
      {loading ? (
        <p role="status">{t("loading")}</p>
      ) : !posts.length ? (
        <p>{t("empty")}</p>
      ) : (
        posts.map((post) => (
          <GossipCard
            key={post.id}
            post={post}
            onEdit={() => onEdit(post)}
            onRefresh={onRefresh}
            onChange={(changed) =>
              setPosts((old) =>
                old.map((p) => (p.id === changed.id ? changed : p)),
              )
            }
          />
        ))
      )}
      {cursor && (
        <button
          disabled={busy}
          onClick={() =>
            void action(async () => {
              const result = await readGossipFeed("/api", cursor);
              setPosts((old) => [
                ...old,
                ...result.posts.filter(
                  (p) => !old.some((existing) => existing.id === p.id),
                ),
              ]);
              setCursor(result.nextCursor);
            })
          }
        >
          {t("more")}
        </button>
      )}
    </div>
  );
}
function GossipCard({
  post,
  onEdit,
  onChange,
  onRefresh,
}: {
  post: GossipView;
  onEdit: () => void;
  onChange: (post: GossipView) => void;
  onRefresh: () => void;
}) {
  const t = useTranslations("content"),
    locale = useLocale(),
    { account } = useAccount();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(false),
    [showComments, setShowComments] = useState(false),
    [comments, setComments] = useState<GossipComment[]>([]),
    [cursor, setCursor] = useState<ContentCursor | null>(null),
    [text, setText] = useState(""),
    [parent, setParent] = useState<string | null>(null),
    [confirmDelete, setConfirmDelete] = useState(false),
    [reportTarget, setReportTarget] = useState<string | null>(null),
    [reported, setReported] = useState(false);
  async function action(work: () => Promise<void>) {
    if (busy) return;
    setBusy(true);
    setError(false);
    try {
      await work();
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }
  async function load(after: ContentCursor | null = null) {
    const r = await readGossipComments("/api", post.id, after);
    setComments((old) => (after ? [...old, ...r.comments] : r.comments));
    setCursor(r.nextCursor);
  }
  return (
    <article className="gossip-post">
      <header>
        <span className="gossip-avatar" aria-hidden>
          {post.emoji}
        </span>
        <div>
          <strong>
            {post.author.handle ?? (post.author.name || post.author.id)}
          </strong>
          <time dateTime={post.createdAt}>
            {new Intl.DateTimeFormat(locale, {
              dateStyle: "medium",
              timeStyle: "short",
            }).format(new Date(post.createdAt))}
          </time>
        </div>
        <span className="gossip-audience">
          {t(post.audience === "PUBLIC" ? "public" : "followers")}
        </span>
      </header>
      <p className="gossip-text">{post.text}</p>
      {post.mediaId && (
        <img
          className="gossip-image"
          src={`/api/v1/media/${post.mediaId}/image?postId=${post.id}`}
          alt={t("attachment")}
        />
      )}
      {post.locationLabel && (
        <p className="gossip-hint">
          {t("location")}: {post.locationLabel}
        </p>
      )}
      <div className="gossip-actions">
        {account && (
          <button
            disabled={busy}
            onClick={() => {
              setReported(false);
              setReportTarget("post");
            }}
          >
            {t("reportPost")}
          </button>
        )}
        <button
          aria-label={t(post.liked ? "unlike" : "like")}
          aria-pressed={post.liked}
          disabled={busy}
          onClick={() =>
            !account
              ? setShowComments(true)
              : void action(async () =>
                  onChange(await reactToGossip("/api", post.id, !post.liked)),
                )
          }
        >
          <Heart aria-hidden />
          {post.likeCount}
        </button>
        <button
          aria-label={t("comments")}
          disabled={busy}
          onClick={() =>
            void action(async () => {
              if (!showComments) await load();
              setShowComments(!showComments);
            })
          }
        >
          <MessageCircle aria-hidden />
          {post.commentCount}
        </button>
        {account?.id === post.authorId ? (
          <>
            <button disabled={busy} onClick={onEdit}>
              {t("edit")}
            </button>
            <button disabled={busy} onClick={() => setConfirmDelete(true)}>
              {t("deletePost")}
            </button>
          </>
        ) : (
          account && (
            <button
              disabled={busy}
              onClick={() =>
                void action(async () => {
                  await setBlocked("/api", post.authorId, true);
                  onRefresh();
                })
              }
            >
              {t("block")}
            </button>
          )
        )}
      </div>
      {reported && <p role="status">{t("reported")}</p>}
      {account && reportTarget && (
        <GossipReportForm
          postId={post.id}
          commentId={reportTarget === "post" ? undefined : reportTarget}
          onClose={() => setReportTarget(null)}
          onSent={() => {
            setReportTarget(null);
            setReported(true);
          }}
        />
      )}
      {confirmDelete && (
        <div role="group" aria-label={t("confirmDelete")}>
          <p>{t("confirmDelete")}</p>
          <button
            disabled={busy}
            onClick={() =>
              void action(async () => {
                await deleteOwnPost("/api", post.id, post.version);
                onRefresh();
              })
            }
          >
            {t("confirm")}
          </button>
          <button disabled={busy} onClick={() => setConfirmDelete(false)}>
            {t("cancel")}
          </button>
        </div>
      )}
      {error && (
        <p role="alert">
          {t("failed")} <button onClick={onRefresh}>{t("reload")}</button>
        </p>
      )}
      {showComments && (
        <section className="gossip-comments" aria-label={t("comments")}>
          {comments.map((comment) => (
            <div
              className="gossip-comment"
              key={comment.id}
              data-reply={Boolean(comment.parentId)}
            >
              <strong>{comment.author?.handle ?? comment.author?.name}</strong>
              <p>{comment.text ?? t("tombstone")}</p>
              {comment.text && account && (
                <button
                  disabled={busy}
                  onClick={() => {
                    setReported(false);
                    setReportTarget(comment.id);
                  }}
                >
                  {t("reportComment")}
                </button>
              )}
              {comment.text && account && (
                <button disabled={busy} onClick={() => setParent(comment.id)}>
                  {t("reply")}
                </button>
              )}
              {comment.text &&
                (account?.id === comment.author?.id ||
                  account?.id === post.authorId) && (
                  <button
                    disabled={busy}
                    onClick={() =>
                      void action(async () => {
                        await removeGossipComment("/api", post.id, comment.id);
                        await load();
                        onChange(await readGossipPost("/api", post.id));
                      })
                    }
                  >
                    {t("deleteComment")}
                  </button>
                )}
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
          {account ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void action(async () => {
                  await postGossipComment("/api", post.id, {
                    text,
                    parentId: parent,
                  });
                  setText("");
                  setParent(null);
                  await load();
                  onChange(await readGossipPost("/api", post.id));
                });
              }}
            >
              {parent && (
                <button type="button" onClick={() => setParent(null)}>
                  {t("cancelReply")}
                </button>
              )}
              <label>
                {t("comment")}
                <textarea
                  maxLength={1000}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />
              </label>
              <button disabled={busy || !text.trim()}>
                {t("sendComment")}
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
