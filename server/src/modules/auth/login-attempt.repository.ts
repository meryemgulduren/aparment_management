import { and, eq, gt, lte, sql } from "drizzle-orm";
import type { Database } from "../../db/index.js";
import { loginAttempts } from "../../db/schema.js";
import type { AttemptRecord, AttemptStore } from "./login-limiter.js";

/** Hatalı giriş sayaçlarını veritabanında tutar; birden çok sunucu kopyası aynı sayacı görür. */
export class DrizzleAttemptStore implements AttemptStore {
  private readonly db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  async get(keyHash: string, now: Date): Promise<AttemptRecord | null> {
    const [row] = await this.db
      .select({ failures: loginAttempts.failures, resetAt: loginAttempts.resetAt })
      .from(loginAttempts)
      .where(and(eq(loginAttempts.keyHash, keyHash), gt(loginAttempts.resetAt, now)));
    return row ?? null;
  }

  async increment(keyHash: string, now: Date, windowMs: number): Promise<void> {
    const newResetAt = new Date(now.getTime() + windowMs);
    // Süresi dolmuş eski kayıtları temizle; tablo küçük kalsın.
    await this.db.delete(loginAttempts).where(lte(loginAttempts.resetAt, now));
    // Tek sorgu: kayıt yoksa 1 ile başlat, varsa artır. Eşzamanlı iki hatalı
    // denemede de sayaç doğru artar (oku-sonra-yaz yarışı yok).
    await this.db
      .insert(loginAttempts)
      .values({ keyHash, failures: 1, resetAt: newResetAt })
      .onConflictDoUpdate({
        target: loginAttempts.keyHash,
        set: {
          failures: sql`case when ${loginAttempts.resetAt} <= ${now} then 1 else ${loginAttempts.failures} + 1 end`,
          resetAt: sql`case when ${loginAttempts.resetAt} <= ${now} then ${newResetAt} else ${loginAttempts.resetAt} end`,
        },
      });
  }

  async clear(keyHash: string): Promise<void> {
    await this.db.delete(loginAttempts).where(eq(loginAttempts.keyHash, keyHash));
  }
}
