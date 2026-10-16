import { beforeEach, describe, expect, it } from "vitest";
import { UnauthorizedError, ValidationError } from "../../shared/errors.js";
import type { AuthRepository, AuthUser, StoredUser } from "./auth.repository.js";
import { AuthService } from "./auth.service.js";
import { hashPassword, hashSessionToken, verifyPassword } from "./crypto.js";

// Veritabanı yerine bellekte çalışan sahte repository. AuthService somut veritabanına
// değil AuthRepository arayüzüne bağlı olduğu için bu mümkün.
class InMemoryAuthRepository implements AuthRepository {
  users: StoredUser[] = [];
  sessions: { tokenHash: string; userId: number; expiresAt: Date }[] = [];

  async findUserByUsername(username: string) {
    return this.users.find((u) => u.username === username) ?? null;
  }
  async createUser(username: string, passwordHash: string): Promise<AuthUser> {
    const user = { id: this.users.length + 1, username, passwordHash };
    this.users.push(user);
    return { id: user.id, username };
  }
  async updatePassword(userId: number, passwordHash: string) {
    this.users.find((u) => u.id === userId)!.passwordHash = passwordHash;
  }
  async createSession(tokenHash: string, userId: number, expiresAt: Date) {
    this.sessions.push({ tokenHash, userId, expiresAt });
  }
  async findUserBySession(tokenHash: string, now: Date) {
    const session = this.sessions.find((s) => s.tokenHash === tokenHash && s.expiresAt > now);
    const user = session && this.users.find((u) => u.id === session.userId);
    return user ? { id: user.id, username: user.username } : null;
  }
  async deleteSession(tokenHash: string) {
    this.sessions = this.sessions.filter((s) => s.tokenHash !== tokenHash);
  }
  async deleteSessionsOfUser(userId: number) {
    this.sessions = this.sessions.filter((s) => s.userId !== userId);
  }
  async deleteExpiredSessions(now: Date) {
    this.sessions = this.sessions.filter((s) => s.expiresAt > now);
  }
}

describe("crypto", () => {
  it("doğru şifreyi kabul eder, yanlışı reddeder", async () => {
    const stored = await hashPassword("dogru-sifre-123");
    expect(stored).not.toContain("dogru-sifre-123");
    expect(await verifyPassword("dogru-sifre-123", stored)).toBe(true);
    expect(await verifyPassword("yanlis-sifre-123", stored)).toBe(false);
  });

  it("aynı şifre her seferinde farklı saklanır (salt)", async () => {
    expect(await hashPassword("ayni-sifre-123")).not.toBe(await hashPassword("ayni-sifre-123"));
  });
});

describe("AuthService", () => {
  let repo: InMemoryAuthRepository;
  let now: Date;
  let service: AuthService;

  beforeEach(async () => {
    repo = new InMemoryAuthRepository();
    now = new Date("2026-10-16T10:00:00Z");
    service = new AuthService(repo, () => now);
    await service.upsertUser("baba", "guclu-bir-sifre");
  });

  it("doğru bilgilerle giriş yapar ve belirteci hash olarak saklar", async () => {
    const { token, user } = await service.login("baba", "guclu-bir-sifre");
    expect(user.username).toBe("baba");
    expect(repo.sessions).toHaveLength(1);
    expect(repo.sessions[0].tokenHash).toBe(hashSessionToken(token));
    expect(repo.sessions[0].tokenHash).not.toBe(token);
    expect(await service.authenticate(token)).toEqual(user);
  });

  it("yanlış şifre ve olmayan kullanıcı aynı hatayı verir", async () => {
    const wrongPassword = service.login("baba", "yanlis-sifre-xx");
    const unknownUser = service.login("kimse", "guclu-bir-sifre");
    await expect(wrongPassword).rejects.toThrow(UnauthorizedError);
    await expect(unknownUser).rejects.toThrow(UnauthorizedError);
    await expect(wrongPassword).rejects.toThrow("Kullanıcı adı veya şifre hatalı.");
    await expect(unknownUser).rejects.toThrow("Kullanıcı adı veya şifre hatalı.");
  });

  it("süresi dolan oturum geçersizdir", async () => {
    const { token } = await service.login("baba", "guclu-bir-sifre");
    now = new Date("2026-11-20T10:00:00Z"); // 35 gün sonra
    expect(await service.authenticate(token)).toBeNull();
  });

  it("çıkış yapınca oturum silinir", async () => {
    const { token } = await service.login("baba", "guclu-bir-sifre");
    await service.logout(token);
    expect(await service.authenticate(token)).toBeNull();
  });

  it("şifre değişince eski oturumlar kapanır", async () => {
    const { token } = await service.login("baba", "guclu-bir-sifre");
    expect(await service.upsertUser("baba", "yepyeni-sifre-1")).toBe("updated");
    expect(await service.authenticate(token)).toBeNull();
  });

  it("kısa şifreyi reddeder", async () => {
    await expect(service.upsertUser("anne", "kisa")).rejects.toThrow(ValidationError);
  });

  it("belirteç yoksa kullanıcı yoktur", async () => {
    expect(await service.authenticate(undefined)).toBeNull();
    expect(await service.authenticate("uydurma")).toBeNull();
  });
});
