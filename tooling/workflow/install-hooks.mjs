/* global console, process */
import { spawnSync } from "node:child_process";
import { chmodSync, existsSync } from "node:fs";

function git(...args) {
  const result = spawnSync("git", args, { encoding: "utf8" });
  if (result.error || result.status !== 0) {
    throw new Error(result.error?.message ?? result.stderr.trim());
  }
  return result.stdout.trim();
}

try {
  process.chdir(git("rev-parse", "--show-toplevel"));
  const existing = spawnSync("git", ["config", "--get", "core.hooksPath"], {
    encoding: "utf8",
  });
  if (existing.error || ![0, 1].includes(existing.status)) {
    throw new Error("Cannot inspect the existing Git hooks configuration.");
  }
  if (existing.status === 0 && existing.stdout.trim() !== ".githooks") {
    throw new Error(
      "Another hooksPath is configured; reconcile it before installing VibeQuest hooks.",
    );
  }
  if (!existsSync(".githooks/pre-push"))
    throw new Error("Missing repository pre-push hook.");
  chmodSync(".githooks/pre-push", 0o755);
  git("config", "--local", "core.hooksPath", ".githooks");
  console.log(
    "VibeQuest pre-push formatting guard installed for this checkout.",
  );
} catch (error) {
  console.error(`Hook installation failed: ${error.message}`);
  process.exitCode = 1;
}
