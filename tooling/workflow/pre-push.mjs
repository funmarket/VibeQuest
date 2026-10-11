/* global console, process */
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function command(executable, args, options = {}) {
  const result = spawnSync(executable, args, {
    encoding: "utf8",
    ...options,
  });
  if (result.error || result.status !== 0) {
    throw new Error(
      `${executable} could not complete required validation. ${result.error?.message ?? result.stderr ?? ""}`,
    );
  }
  return result.stdout?.trim() ?? "";
}

try {
  const root = command("git", ["rev-parse", "--show-toplevel"]);
  process.chdir(root);
  const manifest = JSON.parse(readFileSync("package.json", "utf8"));
  const nodeRange = /^>=(\d+) <(\d+)$/.exec(manifest.engines?.node ?? "");
  const major = Number(process.versions.node.split(".")[0]);
  if (
    !nodeRange ||
    major < Number(nodeRange[1]) ||
    major >= Number(nodeRange[2])
  ) {
    throw new Error(
      `Use the repository Node version (${manifest.engines?.node}).`,
    );
  }
  const expectedPnpm = /^pnpm@(\d+\.\d+\.\d+)$/.exec(
    manifest.packageManager ?? "",
  )?.[1];
  if (!expectedPnpm) throw new Error("packageManager must pin pnpm exactly.");
  const pnpmOptions = { shell: process.platform === "win32" };
  const actualPnpm = command("pnpm", ["--version"], pnpmOptions);
  if (actualPnpm !== expectedPnpm) {
    throw new Error(
      `Use pnpm ${expectedPnpm}; found ${actualPnpm}. Check your PATH/Corepack setup.`,
    );
  }
  const installedPrettier = JSON.parse(
    readFileSync(join(root, "node_modules/prettier/package.json"), "utf8"),
  );
  if (installedPrettier.version !== manifest.devDependencies?.prettier) {
    throw new Error(
      "Installed Prettier does not match package.json. Run pnpm install --frozen-lockfile.",
    );
  }
  const dirty = command("git", [
    "status",
    "--porcelain",
    "--untracked-files=normal",
  ]);
  if (dirty) {
    throw new Error(
      `Commit the intended source before pushing; validation must match the committed tree:\n${dirty}`,
    );
  }
  const head = command("git", ["rev-parse", "HEAD"]);
  for (const line of readFileSync(0, "utf8")
    .trim()
    .split("\n")
    .filter(Boolean)) {
    const [, localSha] = line.trim().split(/\s+/);
    if (!/^0+$/.test(localSha ?? "") && localSha !== head) {
      throw new Error(
        "Check out the commit/branch being pushed so this guard validates its actual source.",
      );
    }
  }
  const result = spawnSync("pnpm", ["format:check"], {
    ...pnpmOptions,
    stdio: "inherit",
  });
  if (result.error || result.status !== 0) {
    throw new Error(
      "Formatting validation failed or could not execute. Fix each reported file with: pnpm exec prettier --write <file>. Then run pnpm check, commit and push again.",
    );
  }
  console.log("Pre-push formatting validation passed.");
} catch (error) {
  console.error(`VibeQuest push blocked: ${error.message}`);
  process.exitCode = 1;
}
