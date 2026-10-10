"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import {
  readPublicProfile,
  readSocialState,
  SocialRequestError,
} from "@vq/api-client";
import type { PublicProfile, Relationship } from "@vq/contracts";
import { useAccount } from "../identity/account-provider";
import { FollowButton } from "./follow-button";
import { ProfileLookup } from "./profile-lookup";
export function PublicProfilePage({ value }: { value: string }) {
  const t = useTranslations("social");
  const locale = useLocale();
  const { account, loading: accountLoading } = useAccount();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [state, setState] = useState<
    (Relationship & { counts: { following: number; followers: number } }) | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    if (accountLoading) return;
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    setProfile(null);
    setState(null);
    (async () => {
      const record = await readPublicProfile(
        "/api",
        value,
        /^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(value),
        controller.signal,
      );
      const relationship = await readSocialState(
        "/api",
        record.id,
        controller.signal,
      );
      if (!controller.signal.aborted) {
        setProfile(record);
        setState(relationship);
      }
    })()
      .catch((cause) => {
        if (!controller.signal.aborted)
          setError(
            cause instanceof SocialRequestError &&
              ["PROFILE_NOT_FOUND", "SOCIAL_NOT_FOUND"].includes(cause.code)
              ? "missing"
              : "failed",
          );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [value, account?.id, accountLoading, revision]);
  return (
    <section className="social-public">
      <Link href={`/${locale}/vibe`}>{t("backVibe")}</Link>
      <h1>{t("publicProfile")}</h1>
      <ProfileLookup />
      {loading ? (
        <p role="status">{t("loading")}</p>
      ) : error ? (
        <div>
          <p role="alert">{t(error)}</p>
          <button onClick={() => setRevision((value) => value + 1)}>
            {t("retry")}
          </button>
        </div>
      ) : (
        profile &&
        state && (
          <article>
            <span className="social-avatar" aria-hidden>
              {Array.from(
                profile.name || profile.handle || "",
              )[0]?.toUpperCase() || "👤"}
            </span>
            <h2>{profile.name || t("unnamed")}</h2>
            {profile.handle && <p>@{profile.handle}</p>}
            <p className="social-bio">{profile.bio}</p>
            <p className="social-counts">
              {t("following")}: {state.counts.following} · {t("followers")}:{" "}
              {state.counts.followers}
            </p>
            {state.mutual && <p className="social-mutual">{t("mutual")}</p>}
            {account ? (
              account.id !== profile.id && (
                <FollowButton
                  key={`${account.id}:${profile.id}`}
                  id={profile.id}
                  relationship={state}
                  onChange={() => {
                    setRevision((current) => current + 1);
                  }}
                />
              )
            ) : (
              <p>{t("signInFollow")}</p>
            )}
            <p className="social-privacy">{t("privatePhotos")}</p>
          </article>
        )
      )}
    </section>
  );
}
