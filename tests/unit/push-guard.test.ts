import { spawnSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, it } from "vitest";

const project = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const manifest = JSON.parse(
  readFileSync(join(project, "package.json"), "utf8"),
);
const guardFiles = [
  ".gitattributes",
  ".githooks/pre-push",
  "tooling/workflow/pre-push.mjs",
  "tooling/workflow/install-hooks.mjs",
];

function fixture() {
  const temporary = mkdtempSync(join(tmpdir(), "vq-push-guard-"));
  const source = join(temporary, "source");
  const checkout = join(temporary, "fresh checkout");
  const remote = join(temporary, "remote.git");
  mkdirSync(join(source, "docs"), { recursive: true });
  function git(cwd: string, ...args: string[]) {
    const result = spawnSync("git", args, { cwd, encoding: "utf8" });
    expect(result.status, result.stderr).toBe(0);
    return result.stdout.trim();
  }
  git(source, "init", "--initial-branch=fixture");
  git(source, "config", "core.autocrlf", "false");
  writeFileSync(join(source, ".gitignore"), "node_modules/\n");
  writeFileSync(join(source, "docs/case.md"), "# Fixture\n\nValid text.\n");
  writeFileSync(
    join(source, "package.json"),
    JSON.stringify({
      private: true,
      type: "module",
      packageManager: manifest.packageManager,
      engines: manifest.engines,
      devDependencies: { prettier: manifest.devDependencies.prettier },
      scripts: { "format:check": "prettier --check docs" },
    }),
  );
  for (const file of guardFiles) {
    if (!existsSync(join(project, file))) continue;
    mkdirSync(dirname(join(source, file)), { recursive: true });
    copyFileSync(join(project, file), join(source, file));
  }
  git(source, "add", "--", ".");
  if (existsSync(join(source, ".githooks/pre-push"))) {
    git(source, "update-index", "--chmod=+x", ".githooks/pre-push");
  }
  git(
    source,
    "-c",
    "user.name=Fixture",
    "-c",
    "user.email=fixture@example.invalid",
    "commit",
    "-m",
    "fixture",
  );
  git(temporary, "init", "--bare", remote);
  git(temporary, "-c", "core.autocrlf=true", "clone", source, checkout);
  git(checkout, "remote", "set-url", "origin", remote);
  symlinkSync(
    join(project, "node_modules"),
    join(checkout, "node_modules"),
    "junction",
  );
  const installer = spawnSync(
    process.execPath,
    ["tooling/workflow/install-hooks.mjs"],
    {
      cwd: checkout,
      encoding: "utf8",
    },
  );
  function commit() {
    git(checkout, "add", "--", "docs/case.md");
    git(
      checkout,
      "-c",
      "user.name=Fixture",
      "-c",
      "user.email=fixture@example.invalid",
      "commit",
      "-m",
      "case",
    );
  }
  return {
    checkout,
    remote,
    installer,
    commit,
    git,
    remove() {
      if (
        dirname(temporary) !== resolve(tmpdir()) ||
        !temporary.includes("vq-push-guard-")
      ) {
        throw new Error("Unexpected fixture cleanup target");
      }
      rmSync(temporary, { recursive: true, force: true });
    },
  };
}

it("blocks malformed committed Markdown at the actual push hook, then accepts the formatted case", () => {
  const f = fixture();
  try {
    // If the guard is absent, this push succeeds: the original workflow defect.
    writeFileSync(join(f.checkout, "docs/case.md"), "#Bad heading\n\n* item\n");
    f.commit();
    const rejected = spawnSync("git", ["push", "origin", "fixture"], {
      cwd: f.checkout,
      encoding: "utf8",
    });
    expect(rejected.status).not.toBe(0);
    expect(rejected.stdout + rejected.stderr).toContain("docs/case.md");
    expect(rejected.stdout + rejected.stderr).toContain("prettier --write");
    expect(f.installer.status, f.installer.stderr).toBe(0);
    const formatted = spawnSync(
      process.execPath,
      [
        join(project, "node_modules/prettier/bin/prettier.cjs"),
        "--write",
        "docs/case.md",
      ],
      { cwd: f.checkout, encoding: "utf8" },
    );
    expect(formatted.status, formatted.stderr).toBe(0);
    expect(f.git(f.checkout, "diff", "--name-only")).toBe("docs/case.md");
    f.commit();
    const accepted = spawnSync("git", ["push", "origin", "fixture"], {
      cwd: f.checkout,
      encoding: "utf8",
    });
    expect(accepted.status, accepted.stdout + accepted.stderr).toBe(0);
    expect(f.git(f.remote, "rev-parse", "refs/heads/fixture")).toBe(
      f.git(f.checkout, "rev-parse", "HEAD"),
    );
    expect(f.git(f.checkout, "status", "--porcelain")).toBe("");
    expect(
      readFileSync(join(f.checkout, "docs/case.md"), "utf8"),
    ).not.toContain("\r\n");
  } finally {
    f.remove();
  }
}, 60_000);

it("fails closed when pnpm cannot execute", () => {
  const f = fixture();
  try {
    expect(f.installer.status, f.installer.stderr).toBe(0);
    const pathEntry =
      Object.entries(process.env).find(
        ([key]) => key.toLowerCase() === "path",
      )?.[1] ?? "";
    const gitDirectory = pathEntry
      .split(delimiter)
      .find((directory) =>
        existsSync(
          join(directory, process.platform === "win32" ? "git.exe" : "git"),
        ),
      );
    expect(gitDirectory).toBeTruthy();
    const env = { ...process.env };
    for (const key of Object.keys(env)) {
      if (key.toLowerCase() === "path") delete env[key];
    }
    env[process.platform === "win32" ? "Path" : "PATH"] = [
      dirname(process.execPath),
      gitDirectory,
    ].join(delimiter);
    const blocked = spawnSync(
      process.execPath,
      ["tooling/workflow/pre-push.mjs"],
      {
        cwd: f.checkout,
        input: "",
        encoding: "utf8",
        env,
      },
    );
    expect(blocked.status).not.toBe(0);
    expect(blocked.stdout + blocked.stderr).toContain("pnpm");
    expect(blocked.stdout + blocked.stderr).toContain("blocked");
  } finally {
    f.remove();
  }
}, 60_000);
