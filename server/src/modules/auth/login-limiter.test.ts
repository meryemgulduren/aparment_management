import { describe, expect, it } from "vitest";
import { TooManyRequestsError } from "../../shared/errors.js";
import { LoginLimiter } from "./login-limiter.js";

describe("LoginLimiter", () => {
  it("sınırdan sonra engeller, süre dolunca açar", () => {
    let now = 0;
    const limiter = new LoginLimiter(3, 60_000, () => now);
    for (let i = 0; i < 3; i++) {
      limiter.assertAllowed("1.2.3.4");
      limiter.recordFailure("1.2.3.4");
    }
    expect(() => limiter.assertAllowed("1.2.3.4")).toThrow(TooManyRequestsError);
    expect(() => limiter.assertAllowed("5.6.7.8")).not.toThrow();

    now = 60_001;
    expect(() => limiter.assertAllowed("1.2.3.4")).not.toThrow();
  });

  it("başarılı girişte sayaç sıfırlanır", () => {
    const limiter = new LoginLimiter(2, 60_000, () => 0);
    limiter.recordFailure("ip");
    limiter.reset("ip");
    limiter.recordFailure("ip");
    expect(() => limiter.assertAllowed("ip")).not.toThrow();
  });
});
