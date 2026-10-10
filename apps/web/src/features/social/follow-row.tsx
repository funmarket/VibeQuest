"use client";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import type { SocialPerson, Relationship } from "@vq/contracts";
import { FollowButton } from "./follow-button";
export function FollowRow({
  person,
  onChange,
}: {
  person: SocialPerson;
  onChange: (state: Relationship) => Promise<void>;
}) {
  const t = useTranslations("social");
  const locale = useLocale();
  const { profile, relationship } = person;
  return (
    <article className="social-row" data-profile-id={profile.id}>
      <Link
        className="social-person-link"
        href={`/${locale}/people/${profile.handle ?? profile.id}`}
      >
        <span className="social-avatar" aria-hidden>
          {Array.from(profile.name || profile.handle || "")[0]?.toUpperCase() ||
            "👤"}
        </span>
        <span className="social-person-copy">
          <strong>
            {profile.handle
              ? `@${profile.handle}`
              : profile.name || t("unnamed")}
          </strong>
          {profile.handle && profile.name && <span>{profile.name}</span>}
          <small>{profile.bio}</small>
          {relationship.mutual && (
            <small className="social-mutual">{t("mutual")}</small>
          )}
        </span>
      </Link>
      <FollowButton
        id={profile.id}
        relationship={relationship}
        onChange={onChange}
      />
    </article>
  );
}
