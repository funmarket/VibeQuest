import { setRequestLocale } from "next-intl/server";
import { PublicProfilePage } from "../../../../features/social/public-profile";
export default async function Page({
  params,
}: {
  params: Promise<{ locale: string; handle: string }>;
}) {
  const { locale, handle } = await params;
  setRequestLocale(locale);
  return <PublicProfilePage value={handle} />;
}
