import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);

export async function createPasswordHash(password: string) {
  const normalizedPassword = password.trim();

  if (!normalizedPassword) {
    throw new Error("Password must not be empty.");
  }

  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scrypt(normalizedPassword, salt, 64)) as Buffer;
  return `${salt}:${derivedKey.toString("hex")}`;
}

export async function verifyPasswordHash(password: string, passwordHash: string) {
  const [salt, storedHash] = passwordHash.split(":");

  if (!salt || !storedHash) {
    return false;
  }

  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
  const storedKey = Buffer.from(storedHash, "hex");

  return (
    derivedKey.length === storedKey.length &&
    timingSafeEqual(derivedKey, storedKey)
  );
}
