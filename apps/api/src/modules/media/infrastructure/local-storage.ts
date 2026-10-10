import {
  mkdir,
  readFile,
  writeFile,
  rename,
  unlink,
  stat,
} from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { MediaStorage } from "@vq/media";
export function createLocalMediaStorage(directory: string): MediaStorage {
  const root = path.resolve(directory);
  function file(id: string, variant: "image" | "thumbnail") {
    if (!/^[a-f0-9-]{36}$/.test(id)) throw new Error("Invalid object key.");
    return path.join(root, `${id}-${variant}.webp`);
  }
  return {
    async write(id, variant, bytes) {
      await mkdir(root, { recursive: true });
      const target = file(id, variant);
      const temporary = target + `.${randomUUID()}.tmp`;
      try {
        await writeFile(temporary, bytes, { flag: "wx", mode: 0o600 });
        await rename(temporary, target);
      } finally {
        await unlink(temporary).catch((error) => {
          if (error.code !== "ENOENT") throw error;
        });
      }
    },
    read: (id, variant) => readFile(file(id, variant)),
    async remove(id) {
      const directory = await stat(root).catch((error) => {
        if (error.code === "ENOENT") return null;
        throw error;
      });
      if (!directory) return;
      if (!directory.isDirectory())
        throw new Error("Media storage root is not a directory.");
      for (const variant of ["image", "thumbnail"] as const)
        await unlink(file(id, variant)).catch((error) => {
          if (error.code !== "ENOENT") throw error;
        });
    },
  };
}
