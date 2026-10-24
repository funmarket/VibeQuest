import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { HomePage } from "../../../features/home/home-page";
import { exploreSearch } from "../../../features/explore/navigation";
import { ExplorePage } from "../../../features/explore/explore-page";
import { SharePage } from "../../../features/share/share-page";
import { VibePage } from "../../../features/vibe/vibe-page";
import { PursePage } from "../../../features/purse/purse-page";

export default async function Destination({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; destination: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale, destination } = await params;
  setRequestLocale(locale);
  switch (destination) {
    case "home":
      return <HomePage />;
    case "explore": {
      const query = exploreSearch((await searchParams).q);
      return <ExplorePage key={query} initialSearch={query} />;
    }
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
