import { createHash } from "node:crypto";
import { TooManyRequestsError } from "../../shared/errors.js";

export interface AttemptRecord {
  failures: number;
  resetAt: Date;
}

/** Hatalı deneme sayaçlarının saklandığı yer (bellek veya veritabanı). */
export interface AttemptStore {
  /** Süresi dolmamış kaydı döner; yoksa null. */
  get(keyHash: string, now: Date): Promise<AttemptRecord | null>;
  /** Sayacı tek adımda bir artırır; süresi dolmuşsa yeni pencere başlatır. */
  increment(keyHash: string, now: Date, windowMs: number): Promise<void>;
  clear(keyHash: string): Promise<void>;
}

/**
 * Aynı IP'den art arda yanlış şifre denemesini sınırlar (kaba kuvvet saldırısına karşı).
 * Sayaçların nerede tutulduğunu bilmez; bunu verilen AttemptStore belirler.
 */
export class LoginLimiter {
  private readonly store: AttemptStore;
  private readonly maxFailures: number;
  private readonly windowMs: number;
  private readonly now: () => Date;

  constructor(
    store: AttemptStore,
    maxFailures = 10,
    windowMs = 15 * 60 * 1000,
    now: () => Date = () => new Date(),
  ) {
    this.store = store;
    this.maxFailures = maxFailures;
    this.windowMs = windowMs;
    this.now = now;
  }

  /** Sınır aşıldıysa TooManyRequestsError fırlatır. */
  async assertAllowed(clientKey: string): Promise<void> {
    const now = this.now();
    const record = await this.store.get(hashKey(clientKey), now);
    if (record && record.failures >= this.maxFailures) {
      const minutes = Math.max(1, Math.ceil((record.resetAt.getTime() - now.getTime()) / 60_000));
      throw new TooManyRequestsError(
        `Çok fazla hatalı deneme. ${minutes} dakika sonra tekrar deneyin.`,
      );
    }
  }

  recordFailure(clientKey: string): Promise<void> {
    return this.store.increment(hashKey(clientKey), this.now(), this.windowMs);
  }

  reset(clientKey: string): Promise<void> {
    return this.store.clear(hashKey(clientKey));
  }
}

// IP adresi kişisel veridir; depoya yalnızca özeti yazılır.
function hashKey(clientKey: string): string {
  return createHash("sha256").update(`login:${clientKey}`).digest("hex");
}

/** Testler ve tek sunuculu kurulumlar için bellekte çalışan depo. */
export class MemoryAttemptStore implements AttemptStore {
  private readonly records = new Map<string, AttemptRecord>();

  async get(keyHash: string, now: Date): Promise<AttemptRecord | null> {
    const record = this.records.get(keyHash);
    if (!record || record.resetAt <= now) return null;
    return { ...record };
  }

  async increment(keyHash: string, now: Date, windowMs: number): Promise<void> {
    const current = await this.get(keyHash, now);
    this.records.set(keyHash, {
      failures: (current?.failures ?? 0) + 1,
      resetAt: current?.resetAt ?? new Date(now.getTime() + windowMs),
    });
  }

  async clear(keyHash: string): Promise<void> {
    this.records.delete(keyHash);
  }
}
