import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { HomePage } from "../../../features/home/home-page";
import { ExplorePage } from "../../../features/explore/explore-page";
import { SharePage } from "../../../features/share/share-page";
import { VibePage } from "../../../features/vibe/vibe-page";
import { PursePage } from "../../../features/purse/purse-page";

export default async function Destination({
  params,
}: {
  params: Promise<{ locale: string; destination: string }>;
}) {
  const { locale, destination } = await params;
  setRequestLocale(locale);
  switch (destination) {
    case "home":
      return <HomePage />;
    case "explore":
      return <ExplorePage />;
    case "share":
      return <SharePage />;
    case "vibe":
      return <VibePage />;
    case "purse":
      return <PursePage />;
    default:
      notFound();
  }
}
