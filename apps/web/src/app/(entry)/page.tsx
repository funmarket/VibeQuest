import { cookies } from "next/headers";
import { redirect } from "next/navigation";
export default async function Entry() {
  const saved = (await cookies()).get("vq.locale")?.value;
  const locale =
    saved && ["en", "fr", "ar", "es"].includes(saved) ? saved : "en";
  redirect(`/${locale}/home`);
}
