import { createHash, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: Buffer,
  keyLength: number,
  options: { N: number; r: number; p: number },
) => Promise<Buffer>;

// scrypt bilerek yavaş ve bellek isteyen bir algoritma: veritabanı çalınsa bile
// şifreleri deneme-yanılmayla bulmak çok pahalı olur.
const SCRYPT_PARAMS = { N: 16384, r: 8, p: 1 };
const KEY_LENGTH = 64;

/** Saklanacak biçim: "scrypt$N$r$p$salt$hash" (salt ve hash base64). */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scryptAsync(password, salt, KEY_LENGTH, SCRYPT_PARAMS);
  const { N, r, p } = SCRYPT_PARAMS;
  return ["scrypt", N, r, p, salt.toString("base64"), hash.toString("base64")].join("$");
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [algorithm, n, r, p, saltB64, hashB64] = stored.split("$");
  if (algorithm !== "scrypt" || !saltB64 || !hashB64) {
    return false;
  }
  const expected = Buffer.from(hashB64, "base64");
  const actual = await scryptAsync(password, Buffer.from(saltB64, "base64"), expected.length, {
    N: Number(n),
    r: Number(r),
    p: Number(p),
  });
  // Normal karşılaştırma ilk farklı baytta durur; süre farkından bilgi sızabilir.
  return timingSafeEqual(actual, expected);
}

/** Tarayıcıya çerez olarak verilecek, tahmin edilemez oturum belirteci. */
export function generateSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

/** Belirteç veritabanında yalnızca bu özet haliyle tutulur. */
export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
