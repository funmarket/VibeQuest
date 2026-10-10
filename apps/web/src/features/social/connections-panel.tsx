"use client";
import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { readRelationships } from "@vq/api-client";
import type { SocialPerson, SocialCursor } from "@vq/contracts";
import { useAccount } from "../identity/account-provider";
import { FollowRow } from "./follow-row";
import { ProfileLookup } from "./profile-lookup";
export function ConnectionsPanel({
  side,
  onDrift,
}: {
  side: "following" | "followers";
  onDrift: () => void;
}) {
  const t = useTranslations("social");
  const { account, loading: accountLoading } = useAccount();
  const [people, setPeople] = useState<SocialPerson[]>([]);
  const [counts, setCounts] = useState({ following: 0, followers: 0 });
  const [next, setNext] = useState<SocialCursor | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [revision, setRevision] = useState(0);
  const requests = useRef<AbortController | null>(null);
  useEffect(() => {
    requests.current = null;
    setBusy(false);
    if (accountLoading) return;
    if (!account) {
      setLoading(false);
      setPeople([]);
      return;
    }
    const controller = new AbortController();
    requests.current = controller;
    setLoading(true);
    setError(false);
    readRelationships("/api", side, null, controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return;
        setPeople(result.people);
        setCounts(result.counts);
        setNext(result.nextCursor);
      })
      .catch(() => {
        if (!controller.signal.aborted) setError(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [side, account?.id, accountLoading, revision]);
  async function more() {
    const controller = requests.current;
    if (!next || !controller || controller.signal.aborted) return;
    setBusy(true);
    try {
      const result = await readRelationships(
        "/api",
        side,
        next,
        controller.signal,
      );
      if (controller.signal.aborted) return;
      setPeople((current) => [
        ...current,
        ...result.people.filter(
          (person) =>
            !current.some((old) => old.profile.id === person.profile.id),
        ),
      ]);
      setCounts(result.counts);
      setNext(result.nextCursor);
    } catch {
      if (!controller.signal.aborted) setError(true);
    } finally {
      if (!controller.signal.aborted) setBusy(false);
    }
  }
  return (
    <div className="social-connections">
      <ProfileLookup />
      {account && !accountLoading && !loading && !error && (
        <p className="social-counts">
          {t("following")}: {counts.following} · {t("followers")}:{" "}
          {counts.followers}
        </p>
      )}
      {accountLoading || loading ? (
        <p role="status">{t("loading")}</p>
      ) : !account ? (
        <p>{t("signInLists")}</p>
      ) : error ? (
        <div>
          <p role="alert">{t("failed")}</p>
          <button onClick={() => setRevision((value) => value + 1)}>
            {t("retry")}
          </button>
        </div>
      ) : people.length ? (
        <>
          <h2>
            {t(side === "following" ? "followingTitle" : "followersTitle")}
          </h2>
          {people.map((person) => (
            <FollowRow
              key={person.profile.id}
              person={person}
              onChange={async () => {
                setRevision((value) => value + 1);
              }}
            />
          ))}
          {next && (
            <button disabled={busy} onClick={more}>
              {t(busy ? "loading" : "more")}
            </button>
          )}
        </>
      ) : (
        <div className="social-empty">
          <span aria-hidden>{side === "following" ? "🔭" : "📣"}</span>
          <h2>{t(side === "following" ? "orbitEmpty" : "echoEmpty")}</h2>
          <p>{t(side === "following" ? "orbitHint" : "echoHint")}</p>
          {side === "following" && (
            <button onClick={onDrift}>{t("orbitPeople")}</button>
          )}
        </div>
      )}
    </div>
  );
}
