import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { expect, it } from "vitest";
import { checkArchitecture } from "../../tooling/architecture/check";

async function workspace(
  entries: Record<string, string>,
  run: (root: string) => Promise<void>,
) {
  const root = await mkdtemp(path.join(tmpdir(), "vq-reconstruction-"));
  try {
    for (const [file, content] of Object.entries(entries)) {
      await mkdir(path.dirname(path.join(root, file)), { recursive: true });
      await writeFile(path.join(root, file), content);
    }
    await run(root);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}
const api = JSON.stringify({
  name: "@vq/api",
  dependencies: { "@vq/database": "workspace:*", fastify: "5" },
});
const database = JSON.stringify({
  name: "@vq/database",
  dependencies: { pg: "8" },
});

it("rejects cross-domain SQL reads and writes in database adapters", async () => {
  await workspace(
    {
      "packages/database/package.json": database,
      "packages/database/src/profile/repository.ts":
        "export const read = (pool: any) => pool.query('SELECT id FROM identity_users');",
      "packages/database/src/media/repository.ts":
        'export const write = (pool: any) => pool.query(`UPDATE "public"."profile_profiles" SET name=$1`);',
    },
    async (root) => {
      const errors = await checkArchitecture(root);
      expect(
        errors.filter((error) =>
          error.includes("cross-domain database table access"),
        ),
      ).toHaveLength(2);
    },
  );
});

it("rejects private imports between database owners", async () => {
  await workspace(
    {
      "packages/database/package.json": database,
      "packages/database/src/profile/repository.ts":
        "export { read } from '../identity/repository';",
      "packages/database/src/identity/repository.ts": "export const read = 1;",
    },
    async (root) => {
      expect(await checkArchitecture(root)).toContainEqual(
        expect.stringContaining("cross-domain database adapter access"),
      );
    },
  );
});

it("allows an adapter to join its own domain tables", async () => {
  await workspace(
    {
      "packages/database/package.json": database,
      "packages/database/src/profile/repository.ts":
        'export const read = (pool: any) => pool.query("SELECT * FROM profile_profiles p JOIN profile_photos ph USING(user_id)");',
    },
    async (root) => {
      expect(await checkArchitecture(root)).toEqual([]);
    },
  );
});

it("keeps business queries out of the database composition root", async () => {
  await workspace(
    {
      "packages/database/package.json": database,
      "packages/database/src/index.ts":
        "export const list = (pool: any) => pool.query('SELECT * FROM places');",
    },
    async (root) => {
      expect(await checkArchitecture(root)).toContainEqual(
        expect.stringContaining("business query in database composition root"),
      );
      await writeFile(
        path.join(root, "packages/database/src/index.ts"),
        "export const readiness = (pool: any) => pool.query('SELECT id FROM places LIMIT 0');",
      );
      expect(await checkArchitecture(root)).toEqual([]);
    },
  );
});

it("rejects application use cases importing database adapters", async () => {
  await workspace(
    {
      "apps/api/package.json": api,
      "apps/api/src/modules/activities/application/create.ts":
        "import { db } from '@vq/database'; export { db };",
    },
    async (root) => {
      expect(await checkArchitecture(root)).toContainEqual(
        expect.stringContaining("application infrastructure access"),
      );
    },
  );
});

it("rejects contract imports of application-specific code", async () => {
  await workspace(
    {
      "packages/contracts/package.json": JSON.stringify({
        name: "@vq/contracts",
        dependencies: { "@vq/database": "workspace:*" },
      }),
      "packages/contracts/src/index.ts": "export { db } from '@vq/database';",
    },
    async (root) => {
      expect(await checkArchitecture(root)).toContainEqual(
        expect.stringContaining("shared contract layer violation"),
      );
    },
  );
});

it("rejects actual import cycles including re-exports", async () => {
  await workspace(
    {
      "apps/api/package.json": api,
      "apps/api/src/modules/activities/domain/a.ts":
        "export { b } from './b'; export const a = 1;",
      "apps/api/src/modules/activities/domain/b.ts":
        "import { a } from './a'; export const b = a;",
    },
    async (root) => {
      expect(await checkArchitecture(root)).toContainEqual(
        expect.stringContaining("circular source dependency"),
      );
    },
  );
});

it("rejects workspace package dependency cycles", async () => {
  await workspace(
    {
      "packages/a/package.json": JSON.stringify({
        name: "@vq/a",
        dependencies: { "@vq/b": "workspace:*" },
      }),
      "packages/b/package.json": JSON.stringify({
        name: "@vq/b",
        dependencies: { "@vq/a": "workspace:*" },
      }),
    },
    async (root) => {
      expect(await checkArchitecture(root)).toContainEqual(
        expect.stringContaining("circular package dependency"),
      );
    },
  );
});

it("rejects UI importing server application use cases", async () => {
  await workspace(
    {
      "apps/web/package.json": JSON.stringify({
        name: "@vq/web",
        dependencies: { "@vq/api": "workspace:*" },
      }),
      "apps/web/src/features/home/post.ts":
        "import { post } from '@vq/api'; export { post };",
    },
    async (root) => {
      expect(await checkArchitecture(root)).toContainEqual(
        expect.stringContaining("browser server-layer access"),
      );
    },
  );
});

it("allows a port-driven use case and pure contracts", async () => {
  await workspace(
    {
      "apps/api/package.json": api,
      "apps/api/src/modules/activities/application/create.ts":
        "import type { Repository } from '../domain/ports'; export const create = (r: Repository) => r.save();",
      "apps/api/src/modules/activities/domain/ports.ts":
        "export interface Repository { save(): Promise<void> }",
      "packages/contracts/package.json": JSON.stringify({
        name: "@vq/contracts",
        dependencies: { zod: "4" },
      }),
      "packages/contracts/src/index.ts":
        "import { z } from 'zod'; export const id = z.string();",
    },
    async (root) => {
      expect(await checkArchitecture(root)).toEqual([]);
    },
  );
});

it("rejects importing newly introduced domain packages from the browser", async () => {
  await workspace(
    {
      "apps/web/package.json": JSON.stringify({
        name: "@vq/web",
        dependencies: { "@vq/identity": "workspace:*" },
      }),
      "packages/identity/package.json": JSON.stringify({
        name: "@vq/identity",
      }),
      "packages/identity/src/domain/ports.ts": "export interface Repository {}",
      "apps/web/src/features/identity/bypass.ts":
        "import { createAccounts } from '@vq/identity'; export { createAccounts };",
    },
    async (root) => {
      expect(await checkArchitecture(root)).toContainEqual(
        expect.stringContaining("browser server-layer access"),
      );
    },
  );
});

it("checks TypeScript import-type dependencies instead of allowing an AST bypass", async () => {
  await workspace(
    {
      "apps/api/package.json": api,
      "apps/api/src/modules/activities/domain/bypass.ts":
        "export type Server = import('fastify').FastifyInstance;",
    },
    async (root) => {
      expect(await checkArchitecture(root)).toContainEqual(
        expect.stringContaining("pure domain imports"),
      );
    },
  );
});

it("resolves TypeScript aliases before enforcing application boundaries", async () => {
  await workspace(
    {
      "tsconfig.json": JSON.stringify({
        compilerOptions: {
          paths: { "@internal/*": ["./apps/api/src/modules/activities/*"] },
        },
      }),
      "apps/api/package.json": api,
      "apps/api/src/modules/activities/application/create.ts":
        "import { db } from '@internal/infrastructure/database'; export { db };",
      "apps/api/src/modules/activities/infrastructure/database.ts":
        "export const db = 1;",
    },
    async (root) => {
      expect(await checkArchitecture(root)).toContainEqual(
        expect.stringContaining("application infrastructure access"),
      );
    },
  );
});

it("allows aliases to owned ports while detecting alias source cycles", async () => {
  await workspace(
    {
      "tsconfig.json": JSON.stringify({
        compilerOptions: {
          paths: { "@owned/*": ["./apps/api/src/modules/activities/*"] },
        },
      }),
      "apps/api/package.json": api,
      "apps/api/src/modules/activities/application/create.ts":
        "import type { Repository } from '@owned/domain/ports'; export const create = (r: Repository) => r.save();",
      "apps/api/src/modules/activities/domain/ports.ts":
        "export interface Repository { save(): Promise<void> }",
    },
    async (root) => {
      expect(await checkArchitecture(root)).toEqual([]);
      await writeFile(
        path.join(root, "apps/api/src/modules/activities/domain/ports.ts"),
        "export type Repository = import('@owned/application/create').Repository;",
      );
      expect(await checkArchitecture(root)).toContainEqual(
        expect.stringContaining("circular source dependency"),
      );
    },
  );
});

it("checks template literal imports and rejects computed import targets", async () => {
  await workspace(
    {
      "apps/api/package.json": api,
      "apps/api/src/modules/activities/application/template.ts":
        "const loader = () => import(`fastify`); export { loader };",
      "apps/api/src/modules/activities/domain/computed.ts":
        "const target = 'fastify'; export const loader = () => import(target);",
    },
    async (root) => {
      const errors = await checkArchitecture(root);
      expect(errors).toContainEqual(
        expect.stringContaining("application infrastructure access"),
      );
      expect(errors).toContainEqual(
        expect.stringContaining("computed module import"),
      );
    },
  );
});

it("rejects HTTP layer imports resolved through an alias", async () => {
  await workspace(
    {
      "tsconfig.json": JSON.stringify({
        compilerOptions: {
          paths: { "@owned/*": ["./apps/api/src/modules/activities/*"] },
        },
      }),
      "apps/api/package.json": api,
      "apps/api/src/modules/activities/application/create.ts":
        "export { handler } from '@owned/http';",
      "apps/api/src/modules/activities/http.ts": "export const handler = 1;",
    },
    async (root) => {
      expect(await checkArchitecture(root)).toContainEqual(
        expect.stringContaining("application infrastructure access"),
      );
    },
  );
});
