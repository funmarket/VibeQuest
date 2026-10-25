import { contentIdSchema } from "@vq/contracts";

export function homePostId(value: string | string[] | undefined) {
  if (value === undefined) return null;
  const parsed = contentIdSchema.safeParse(value);
  return parsed.success ? parsed.data : "invalid";
}
export function homePostPath(locale: string, id: string) {
  return `/${encodeURIComponent(locale)}/home?post=${contentIdSchema.parse(id)}#home-feed`;
}
export async function copyHomePost(
  origin: string,
  locale: string,
  id: string,
  clipboard: Pick<Clipboard, "writeText"> | undefined,
) {
  if (!clipboard) throw new Error("Clipboard unavailable");
  await clipboard.writeText(new URL(homePostPath(locale, id), origin).href);
}
