import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

const KEY_LENGTH = 64;

/** Hash password jadi string "salt:hash" (hex), siap disimpan ke kolom passwordHash. */
export function hashPassword(password: string): string {
    const salt = randomBytes(16).toString("hex");
    const hash = scryptSync(password, salt, KEY_LENGTH).toString("hex");
    return `${salt}:${hash}`;
}

/** Verifikasi password terhadap hash tersimpan, timing-safe. */
export function verifyPassword(password: string, stored: string): boolean {
    const [salt, hash] = stored.split(":");
    if (!salt || !hash) return false;

    const hashBuffer = Buffer.from(hash, "hex");
    const suppliedBuffer = scryptSync(password, salt, KEY_LENGTH);

    if (hashBuffer.length !== suppliedBuffer.length) return false;
    return timingSafeEqual(hashBuffer, suppliedBuffer);
}