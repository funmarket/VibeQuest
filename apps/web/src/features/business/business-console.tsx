"use client";
import { useEffect, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import type { Business } from "@vq/contracts";
import {
  myBusinesses,
  createBusiness,
  inviteBusinessMember,
  acceptBusinessMembership,
} from "@vq/api-client";
import { useAccount } from "../identity/account-provider";
export function BusinessConsole() {
  const t = useTranslations("identity");
  const { account } = useAccount();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [invited, setInvited] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    myBusinesses("/api")
      .then((items) => {
        if (live) setBusinesses(items);
      })
      .catch(() => {
        if (live) setFailed(true);
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, []);
  async function execute(action: () => Promise<unknown>) {
    setBusy(true);
    setFailed(false);
    setInvited(null);
    try {
      await action();
      setBusinesses(await myBusinesses("/api"));
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }
  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    await execute(async () => {
      await createBusiness("/api", {
        name: String(data.get("name")),
        description: String(data.get("description")),
      });
      form.reset();
    });
  }
  async function invite(event: FormEvent<HTMLFormElement>, id: string) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    await execute(async () => {
      await inviteBusinessMember("/api", id, String(data.get("userId")));
      setInvited(id);
      form.reset();
    });
  }
  if (!account) return null;
  return (
    <details className="business-console">
      <summary>{t("businessTitle")}</summary>
      <p>{t("accountId")}</p>
      <output dir="ltr" style={{ overflowWrap: "anywhere" }}>
        {account.id}
      </output>
      {loading && <p role="status">{t("loading")}</p>}
      {failed && <p role="alert">{t("businessFailed")}</p>}
      {businesses.map((business) => (
        <article key={business.id} className="business-card">
          <h3>{business.name}</h3>
          <p>{business.description}</p>
          <p>
            {t(
              business.status === "pending"
                ? "businessPending"
                : business.status === "approved"
                  ? "businessApproved"
                  : "businessRejected",
            )}
          </p>
          <p>
            {t(
              business.canHostEvents
                ? "businessOwnerPrivileges"
                : "businessNoHosting",
            )}
          </p>
          {business.canAccept && (
            <button
              className="soft-button"
              disabled={busy}
              onClick={() =>
                execute(() => acceptBusinessMembership("/api", business.id))
              }
            >
              {t("businessAccept")}
            </button>
          )}
          {business.canManage && (
            <form
              className="account-form"
              onSubmit={(event) => invite(event, business.id)}
            >
              <label>
                {t("businessMemberId")}
                <input name="userId" required dir="ltr" maxLength={36} />
              </label>
              <button className="soft-button" disabled={busy}>
                {t("businessInvite")}
              </button>
              {invited === business.id && (
                <p role="status">{t("businessInvited")}</p>
              )}
            </form>
          )}
        </article>
      ))}
      <form className="account-form" onSubmit={create}>
        <label>
          {t("businessName")}
          <input name="name" required minLength={2} maxLength={120} />
        </label>
        <label>
          {t("businessDescription")}
          <textarea name="description" maxLength={1000} />
        </label>
        <p>{t("businessApprovalHint")}</p>
        <button className="primary-button" disabled={busy || loading}>
          {t("businessCreate")}
        </button>
      </form>
    </details>
  );
}
