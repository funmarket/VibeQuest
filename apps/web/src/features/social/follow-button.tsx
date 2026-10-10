"use client";
import { useState } from "react";
import { UserCheck, UserPlus } from "lucide-react";
import { useTranslations } from "next-intl";
import { setFollowing } from "@vq/api-client";
import type { Relationship } from "@vq/contracts";
export function FollowButton({
  id,
  relationship,
  onChange,
}: {
  id: string;
  relationship: Relationship;
  onChange: (state: Relationship) => void | Promise<void>;
}) {
  const t = useTranslations("social");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  async function toggle() {
    setBusy(true);
    setError(false);
    try {
      await onChange(await setFollowing("/api", id, !relationship.following));
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }
  const Glyph = relationship.following ? UserCheck : UserPlus;
  return (
    <div className="social-follow-action">
      <button
        className={relationship.following ? "is-following" : ""}
        aria-pressed={relationship.following}
        disabled={busy}
        onClick={toggle}
      >
        <Glyph size={14} aria-hidden />
        {t(
          busy
            ? "loading"
            : relationship.following
              ? "unfollow"
              : relationship.followedBy
                ? "followBack"
                : "follow",
        )}
      </button>
      {error && <p role="alert">{t("failed")}</p>}
    </div>
  );
}
