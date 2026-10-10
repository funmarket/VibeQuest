import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { expect, it } from "vitest";
import { checkArchitecture } from "../../tooling/architecture/check";

it("rejects UI database access, framework-coupled domains and undeclared dependencies", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "vq-boundary-"));
  try {
    await mkdir(path.join(root, "apps/web/src/features"), { recursive: true });
    await mkdir(path.join(root, "apps/api/src/modules/places/domain"), {
      recursive: true,
    });
    await writeFile(
      path.join(root, "apps/web/package.json"),
      JSON.stringify({ name: "@vq/web", dependencies: { react: "19.3.0" } }),
    );
    await writeFile(
      path.join(root, "apps/api/package.json"),
      JSON.stringify({ name: "@vq/api", dependencies: { fastify: "5.12.5" } }),
    );
    await writeFile(
      path.join(root, "apps/web/src/features/leak.ts"),
      "import { db } from '@vq/database'; export { db };\n",
    );
    await writeFile(
      path.join(root, "apps/api/src/modules/places/domain/coupled.ts"),
      "import Fastify from 'fastify'; export const server = Fastify();\n",
    );
    const errors = await checkArchitecture(root);
    expect(
      errors.some((error) => error.includes("browser database access")),
    ).toBe(true);
    expect(errors.some((error) => error.includes("pure domain"))).toBe(true);
    expect(
      errors.some((error) => error.includes("undeclared dependency")),
    ).toBe(true);
    await writeFile(
      path.join(root, "apps/web/src/features/leak.ts"),
      "import React from 'react'; export { React };\n",
    );
    await writeFile(
      path.join(root, "apps/api/src/modules/places/domain/coupled.ts"),
      "export const canRead = (published: boolean) => published;\n",
    );
    expect(await checkArchitecture(root)).toEqual([]);
    await writeFile(
      path.join(root, "apps/web/src/features/leak.ts"),
      "import { db } from '../../../../packages/database/src/index'; export { db };\n",
    );
    await writeFile(
      path.join(root, "apps/api/src/modules/places/domain/coupled.ts"),
      "import { repository } from '../infrastructure/repository'; export { repository };\n",
    );
    const relativeErrors = await checkArchitecture(root);
    expect(
      relativeErrors.some((error) => error.includes("browser database access")),
    ).toBe(true);
    expect(relativeErrors.some((error) => error.includes("pure domain"))).toBe(
      true,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
