/** Returns each back-edge cycle once, including self imports. */
export function dependencyCycles(graph: Map<string, Set<string>>): string[][] {
  const visited = new Set<string>();
  const active = new Set<string>();
  const stack: string[] = [];
  const cycles: string[][] = [];
  function visit(node: string) {
    if (active.has(node)) {
      cycles.push([...stack.slice(stack.indexOf(node)), node]);
      return;
    }
    if (visited.has(node)) return;
    active.add(node);
    stack.push(node);
    for (const dependency of graph.get(node) ?? [])
      if (graph.has(dependency)) visit(dependency);
    stack.pop();
    active.delete(node);
    visited.add(node);
  }
  for (const node of graph.keys()) visit(node);
  return cycles;
}

export function resolveSourceImport(
  file: string,
  available: Set<string>,
): string | undefined {
  const stem = file.replace(/\.[cm]?js$/, "");
  return [
    file,
    ...[".ts", ".tsx", ".mts", ".cts", ".js", ".jsx"].map(
      (extension) => stem + extension,
    ),
    ...["/index.ts", "/index.tsx", "/index.js"].map((suffix) => stem + suffix),
  ].find((candidate) => available.has(candidate));
}
