import { TooManyRequestsError } from "../../shared/errors.js";

interface Attempts {
  failures: number;
  resetAt: number;
}

/**
 * Aynı IP'den art arda yanlış şifre denemesini sınırlar (kaba kuvvet saldırısına karşı).
 * Bilgiler bellekte tutulur: tek sunuculu küçük bir uygulama için yeterli,
 * sunucu yeniden başlayınca sıfırlanır.
 */
export class LoginLimiter {
  private readonly attempts = new Map<string, Attempts>();
  private readonly maxFailures: number;
  private readonly windowMs: number;
  private readonly now: () => number;

  constructor(maxFailures = 10, windowMs = 15 * 60 * 1000, now: () => number = Date.now) {
    this.maxFailures = maxFailures;
    this.windowMs = windowMs;
    this.now = now;
  }

  /** Sınır aşıldıysa TooManyRequestsError fırlatır. */
  assertAllowed(key: string): void {
    const entry = this.current(key);
    if (entry && entry.failures >= this.maxFailures) {
      const minutes = Math.ceil((entry.resetAt - this.now()) / 60_000);
      throw new TooManyRequestsError(
        `Çok fazla hatalı deneme. ${minutes} dakika sonra tekrar deneyin.`,
      );
    }
  }

  recordFailure(key: string): void {
    const entry = this.current(key) ?? { failures: 0, resetAt: this.now() + this.windowMs };
    entry.failures += 1;
    this.attempts.set(key, entry);
    this.prune();
  }

  reset(key: string): void {
    this.attempts.delete(key);
  }

  private current(key: string): Attempts | undefined {
    const entry = this.attempts.get(key);
    if (entry && entry.resetAt <= this.now()) {
      this.attempts.delete(key);
      return undefined;
    }
    return entry;
  }

  // Süresi dolan kayıtları atar; bellek sınırsız büyümesin.
  private prune(): void {
    if (this.attempts.size < 1000) {
      return;
    }
    const now = this.now();
    for (const [key, entry] of this.attempts) {
      if (entry.resetAt <= now) {
        this.attempts.delete(key);
      }
    }
  }
}
