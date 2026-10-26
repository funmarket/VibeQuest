"use client";
import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { MapPin, Camera, Mic } from "lucide-react";
import { NoticeDialog } from "../../components/presentation";
import { useGeo } from "./geo-provider";
import { useAccount } from "../identity/account-provider";
import { AccountForm } from "../identity/account-form";
import "./geo.css";
export function AccessDialog() {
  const geo = useGeo(),
    { account } = useAccount(),
    t = useTranslations("geo");
  const [location, setLocation] = useState(false),
    [social, setSocial] = useState(false);
  useEffect(() => {
    if (geo.settingsOpen) {
      setLocation(geo.state?.locationConsent ?? false);
      setSocial(geo.state?.socialSharing ?? false);
    }
  }, [geo.settingsOpen, geo.state?.locationConsent, geo.state?.socialSharing]);
  if (!geo.settingsOpen) return null;
  return (
    <NoticeDialog
      title={t("accessTitle")}
      onClose={geo.closeSettings}
      planned={false}
    >
      <p>{t("accessBody")}</p>
      <form
        className="geo-access"
        onSubmit={(event) => {
          event.preventDefault();
          void geo.apply(location, social);
        }}
      >
        <label>
          <MapPin data-icon-role="action" aria-hidden />
          <span>{t("location")}</span>
          <input
            type="checkbox"
            checked={location}
            onChange={(event) => {
              setLocation(event.target.checked);
              if (!event.target.checked) setSocial(false);
            }}
          />
        </label>
        <p>{t("platform", { state: t(`permission_${geo.permission}`) })}</p>
        <label>
          <Camera data-icon-role="action" aria-hidden />
          <span>{t("camera")}</span>
          <input type="checkbox" disabled checked={false} readOnly />
        </label>
        <label>
          <Mic data-icon-role="action" aria-hidden />
          <span>{t("microphone")}</span>
          <input type="checkbox" disabled checked={false} readOnly />
        </label>
        <p>{t("captureDeferred")}</p>
        <label>
          <span>{t("social")}</span>
          <input
            type="checkbox"
            checked={social}
            disabled={!location}
            onChange={(event) => setSocial(event.target.checked)}
          />
        </label>
        <p>{t("socialHint")}</p>
        <button
          className="primary-button"
          type="submit"
          disabled={geo.busy || !account || !geo.state}
        >
          {t("apply")}
        </button>
        <p role="status">{t(`status_${geo.status}`)}</p>
      </form>
      {!account && (
        <>
          <p>{t("signIn")}</p>
          <AccountForm />
        </>
      )}
    </NoticeDialog>
  );
}
