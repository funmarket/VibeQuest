"use client";
import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { ContentCursor, GossipView } from "@vq/contracts";
import {
  ContentRequestError,
  readGossipFeed,
  readGossipPost,
} from "@vq/api-client";
import { useAccount } from "../identity/account-provider";
import { NetworkPost } from "./network-post";

export function NetworkFeed({ postId }: { postId: string | null }) {
  const { account, loading } = useAccount();
  const t = useTranslations("content");
  return loading ? (
    <p role="status">{t("loading")}</p>
  ) : (
    <NetworkReader
      key={`${account?.id ?? "guest"}:${postId}`}
      postId={postId}
    />
  );
}

function NetworkReader({ postId }: { postId: string | null }) {
  const t = useTranslations("content"),
    h = useTranslations("home"),
    locale = useLocale();
  const [posts, setPosts] = useState<GossipView[]>([]),
    [cursor, setCursor] = useState<ContentCursor | null>(null),
    [loading, setLoading] = useState(true),
    [failed, setFailed] = useState(false),
    [epoch, setEpoch] = useState(0),
    [moreBusy, setMoreBusy] = useState(false);
  const pending = useRef(false),
    generation = useRef(0);
  function refresh() {
    generation.current++;
    setPosts([]);
    setCursor(null);
    setLoading(true);
    setFailed(false);
    setEpoch((n) => n + 1);
  }
  useEffect(() => {
    const controller = new AbortController();
    const current = generation.current;
    const read = postId
      ? readGossipPost("/api", postId, controller.signal).then((post) => ({
          posts: [post],
          nextCursor: null,
        }))
      : readGossipFeed("/api", null, controller.signal);
    read
      .then((result) => {
        if (!controller.signal.aborted && current === generation.current) {
          setPosts(result.posts);
          setCursor(result.nextCursor);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted && current === generation.current) {
          setPosts([]);
          setFailed(true);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted && current === generation.current)
          setLoading(false);
      });
    return () => controller.abort();
  }, [postId, epoch]);
  useEffect(() => {
    const visible = () => {
      if (document.visibilityState === "visible") refresh();
      else {
        generation.current++;
        setPosts([]);
        setCursor(null);
      }
    };
    const focus = () => {
      if (document.visibilityState === "visible") refresh();
    };
    window.addEventListener("focus", focus);
    window.addEventListener("pageshow", focus);
    document.addEventListener("visibilitychange", visible);
    return () => {
      generation.current++;
      window.removeEventListener("focus", focus);
      window.removeEventListener("pageshow", focus);
      document.removeEventListener("visibilitychange", visible);
    };
  }, []);
  async function more() {
    if (!cursor || pending.current) return;
    pending.current = true;
    setMoreBusy(true);
    setFailed(false);
    const current = generation.current;
    try {
      // Appending a page also reauthorizes all already displayed cards.
      const [next, existing] = await Promise.all([
        readGossipFeed("/api", cursor),
        Promise.all(
          posts.map(async (post) => {
            try {
              return await readGossipPost("/api", post.id);
            } catch (error) {
              if (
                error instanceof ContentRequestError &&
                error.code === "CONTENT_NOT_FOUND"
              )
                return null;
              throw error;
            }
          }),
        ),
      ]);
      if (current !== generation.current) return;
      const seen = new Set<string>();
      setPosts(
        [...existing, ...next.posts].filter((post): post is GossipView => {
          if (!post || seen.has(post.id)) return false;
          seen.add(post.id);
          return true;
        }),
      );
      setCursor(next.nextCursor);
    } catch {
      if (current === generation.current) {
        setPosts([]);
        setCursor(null);
        setFailed(true);
      }
    } finally {
      pending.current = false;
      setMoreBusy(false);
    }
  }
  const renderedGeneration = generation.current;
  return (
    <div className="home-network" aria-busy={loading}>
      <div className="network-toolbar">
        {postId && (
          <a href={`/${locale}/home#home-feed`}>{h("backToNetwork")}</a>
        )}
        <button onClick={refresh} disabled={loading || moreBusy}>
          {t("refresh")}
        </button>
      </div>
      {failed && (
        <p role="alert">
          {postId ? h("postUnavailable") : t("failed")}{" "}
          <button onClick={refresh}>{t("reload")}</button>
        </p>
      )}
      {loading ? (
        <p role="status">{t("loading")}</p>
      ) : !failed && !posts.length ? (
        <p>{t("empty")}</p>
      ) : (
        posts.map((post) => (
          <NetworkPost
            key={`${post.id}:${epoch}`}
            post={post}
            onChange={(changed) => {
              if (renderedGeneration !== generation.current) return;
              setPosts((old) =>
                old.map((p) => (p.id === changed.id ? changed : p)),
              );
            }}
            onUnavailable={() => {
              if (renderedGeneration !== generation.current) return;
              setPosts((old) => old.filter((p) => p.id !== post.id));
            }}
          />
        ))
      )}
      {cursor && (
        <button disabled={moreBusy || loading} onClick={() => void more()}>
          {t("more")}
        </button>
      )}
    </div>
  );
}
