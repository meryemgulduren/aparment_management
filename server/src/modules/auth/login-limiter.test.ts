import { describe, expect, it } from "vitest";
import { TooManyRequestsError } from "../../shared/errors.js";
import { LoginLimiter, MemoryAttemptStore } from "./login-limiter.js";

function setup(maxFailures: number, windowMs = 60_000) {
  let now = new Date("2026-11-02T10:00:00Z");
  const store = new MemoryAttemptStore();
  const limiter = new LoginLimiter(store, maxFailures, windowMs, () => now);
  return {
    limiter,
    store,
    advance(ms: number) {
      now = new Date(now.getTime() + ms);
    },
  };
}

describe("LoginLimiter", () => {
  it("sınırdan sonra engeller, süre dolunca açar", async () => {
    const { limiter, advance } = setup(3);
    for (let i = 0; i < 3; i++) {
      await limiter.assertAllowed("1.2.3.4");
      await limiter.recordFailure("1.2.3.4");
    }
    await expect(limiter.assertAllowed("1.2.3.4")).rejects.toThrow(TooManyRequestsError);
    await expect(limiter.assertAllowed("5.6.7.8")).resolves.toBeUndefined();

    advance(60_001);
    await expect(limiter.assertAllowed("1.2.3.4")).resolves.toBeUndefined();
  });

  it("kalan süreyi dakika olarak söyler", async () => {
    const { limiter, advance } = setup(1, 15 * 60_000);
    await limiter.recordFailure("ip");
    advance(5 * 60_000);
    await expect(limiter.assertAllowed("ip")).rejects.toThrow("10 dakika sonra");
  });

  it("başarılı girişte sayaç sıfırlanır", async () => {
    const { limiter } = setup(2);
    await limiter.recordFailure("ip");
    await limiter.reset("ip");
    await limiter.recordFailure("ip");
    await expect(limiter.assertAllowed("ip")).resolves.toBeUndefined();
  });

  it("depoya IP'nin kendisini değil özetini yazar", async () => {
    const { limiter, store } = setup(5);
    const seen: string[] = [];
    const original = store.increment.bind(store);
    store.increment = async (keyHash, now, windowMs) => {
      seen.push(keyHash);
      return original(keyHash, now, windowMs);
    };
    await limiter.recordFailure("203.0.113.7");
    expect(seen[0]).toMatch(/^[0-9a-f]{64}$/);
    expect(seen[0]).not.toContain("203.0.113.7");
  });
});
