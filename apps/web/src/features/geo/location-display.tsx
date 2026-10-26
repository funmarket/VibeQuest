"use client";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { MapPin, RefreshCw } from "lucide-react";
import { useGeo } from "./geo-provider";
import { useArea } from "../explore/area-provider";
export function LocationEntry() {
  const geo = useGeo(),
    area = useArea(),
    locale = useLocale(),
    t = useTranslations("geo"),
    c = useTranslations("common");
  return (
    <div className="geo-entry">
      <Link href={`/${locale}/explore`}>
        <MapPin data-icon-role="metadata" aria-hidden />
        {area.manual
          ? t("manualArea")
          : geo.state?.presence
            ? t("nearbyArea")
            : c("chooseArea")}
      </Link>
      <button className="soft-button" onClick={geo.openSettings}>
        {t("access")}
      </button>
    </div>
  );
}
export function LocationSummary() {
  const geo = useGeo(),
    area = useArea(),
    t = useTranslations("geo");
  return (
    <div className="geo-summary" aria-label={t("location")}>
      <span>
        <MapPin data-icon-role="metadata" aria-hidden />
        {area.manual
          ? t("manualArea")
          : geo.state?.presence
            ? t("nearbyArea")
            : t("noLocation")}
      </span>
      <small role="status">{t(`status_${geo.status}`)}</small>
      <button
        className="soft-button"
        disabled={geo.busy}
        onClick={() => {
          area.followDevice();
          void geo.refresh();
        }}
      >
        <RefreshCw data-icon-role="action" aria-hidden />
        {t("refresh")}
      </button>
    </div>
  );
}
