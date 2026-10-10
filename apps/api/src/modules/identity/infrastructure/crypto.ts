import { createHash, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import type { IdentityCrypto } from "@vq/identity";

const options = { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 };
let running = 0;
function derive(password: string, salt: Buffer): Promise<Buffer> {
  if (running >= 4) return Promise.reject(new Error("PASSWORD_SERVICE_BUSY"));
  running++;
  return new Promise((resolve, reject) => {
    scrypt(password, salt, 64, options, (error, key) => {
      running--;
      if (error) reject(error);
      else resolve(key);
    });
  });
}
export const identityCrypto: IdentityCrypto = {
  async hashPassword(password) {
    const salt = randomBytes(16);
    const key = await derive(password, salt);
    return `scrypt$32768$8$3$${salt.toString("hex")}$${key.toString("hex")}`;
  },
  async verifyPassword(password, encoded) {
    const parts = encoded?.split("$");
    const valid =
      parts?.length === 6 &&
      parts.slice(0, 4).join("$") === "scrypt$32768$8$3" &&
      /^[a-f0-9]{32}$/.test(parts[4]) &&
      /^[a-f0-9]{128}$/.test(parts[5]);
    const salt = valid ? Buffer.from(parts![4], "hex") : Buffer.alloc(16);
    const expected = valid ? Buffer.from(parts![5], "hex") : Buffer.alloc(64);
    const actual = await derive(password, salt);
    return Boolean(valid && timingSafeEqual(actual, expected));
  },
  newToken: () => randomBytes(32).toString("base64url"),
  digest: (token) => createHash("sha256").update(token).digest("hex"),
};
