const encoder = new TextEncoder();
const HMAC_ALGORITHM = { name: "HMAC", hash: "SHA-256" };
const MIN_SECRET_BYTES = 32;

function getSecret(): Uint8Array<ArrayBuffer> | null {
  const secret = process.env.SESSION_SECRET;
  if (!secret) return null;

  const encoded = encoder.encode(secret);
  const key = new Uint8Array(new ArrayBuffer(encoded.byteLength));
  key.set(encoded);
  return key.length >= MIN_SECRET_BYTES ? key : null;
}

export function isSessionSecretConfigured(): boolean {
  return getSecret() !== null;
}

export async function createSessionToken(
  subject: string,
  lifetimeSeconds: number,
): Promise<string> {
  const secret = getSecret();
  if (!secret) {
    throw new Error("SESSION_SECRET must contain at least 32 bytes.");
  }
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(subject)) {
    throw new Error("Session subject is invalid.");
  }
  if (!Number.isSafeInteger(lifetimeSeconds) || lifetimeSeconds <= 0) {
    throw new Error("Session lifetime is invalid.");
  }

  const expiresAt = Math.floor(Date.now() / 1000) + lifetimeSeconds;
  const payload = `${subject}.${expiresAt}`;
  const key = await crypto.subtle.importKey("raw", secret, HMAC_ALGORITHM, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  const signatureHex = Array.from(new Uint8Array(signature), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");

  return `${payload}.${signatureHex}`;
}

export async function verifySessionToken(token: string | undefined): Promise<string | null> {
  if (!token) return null;

  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [subject, expiresAtText, signatureHex] = parts;
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(subject)) return null;
  if (!/^\d{10}$/.test(expiresAtText) || !/^[a-f0-9]{64}$/.test(signatureHex)) return null;

  const expiresAt = Number(expiresAtText);
  if (!Number.isSafeInteger(expiresAt) || expiresAt <= Math.floor(Date.now() / 1000)) {
    return null;
  }

  const secret = getSecret();
  if (!secret) return null;

  const signature = new Uint8Array(
    signatureHex.match(/.{2}/g)!.map((byte) => Number.parseInt(byte, 16)),
  );
  const key = await crypto.subtle.importKey("raw", secret, HMAC_ALGORITHM, false, ["verify"]);
  const valid = await crypto.subtle.verify(
    "HMAC",
    key,
    signature,
    encoder.encode(`${subject}.${expiresAtText}`),
  );

  return valid ? subject : null;
}
