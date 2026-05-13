import { createHash, randomBytes } from "node:crypto";

const MAGIC_LINK_TTL_MINUTES = 30;

export function createMagicLinkToken() {
  return randomBytes(32).toString("base64url");
}

export function hashMagicLinkToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function getMagicLinkExpiryDate() {
  return new Date(Date.now() + MAGIC_LINK_TTL_MINUTES * 60 * 1000);
}
