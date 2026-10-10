import { redirect } from "next/navigation";
export default async function LocaleEntry({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  redirect(`/${(await params).locale}/home`);
}
