/** Current canonical table namespaces; new owners extend this existing gate. */
const namespaces = new Set([
  "identity",
  "profile",
  "media",
  "business",
  "activities",
  "events",
  "social",
  "content",
]);

export function foreignTables(owner: string, sql: string): string[] {
  const text = sql
    .replace(/'(?:''|[^'])*'/g, "''")
    .replace(/--[^\n]*/g, " ")
    .replace(/\/\*[\s\S]*?\*\//g, " ");
  const foreign = new Set<string>();
  for (const match of text.matchAll(
    /\b(?:FROM|JOIN|INTO|UPDATE)\s+(?:ONLY\s+)?(?:(?:"[\w]+"|[\w]+)\s*\.\s*)?(?:"([\w]+)"|([\w]+))/gi,
  )) {
    const table = (match[1] ?? match[2]).toLowerCase();
    const prefix = table.split("_")[0];
    const authority =
      table === "places"
        ? "places"
        : namespaces.has(prefix)
          ? prefix
          : undefined;
    if (authority && authority !== owner) foreign.add(table);
  }
  return [...foreign];
}
