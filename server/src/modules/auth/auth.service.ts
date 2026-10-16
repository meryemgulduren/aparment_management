import { UnauthorizedError, ValidationError } from "../../shared/errors.js";
import type { AuthRepository, AuthUser } from "./auth.repository.js";
import { generateSessionToken, hashPassword, hashSessionToken, verifyPassword } from "./crypto.js";

export const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 gün
export const MIN_PASSWORD_LENGTH = 10;

export interface LoginResult {
  user: AuthUser;
  token: string;
  expiresAt: Date;
}

export class AuthService {
  private readonly repository: AuthRepository;
  private readonly now: () => Date;
  // Kullanıcı bulunamasa bile şifre kontrolü yapılır ki yanıt süresinden
  // "bu kullanıcı adı var mı" bilgisi çıkarılamasın.
  private dummyHash?: Promise<string>;

  constructor(repository: AuthRepository, now: () => Date = () => new Date()) {
    this.repository = repository;
    this.now = now;
  }

  async login(username: string, password: string): Promise<LoginResult> {
    const user = await this.repository.findUserByUsername(username);
    this.dummyHash ??= hashPassword("dummy-password-for-timing");
    const passwordOk = await verifyPassword(password, user?.passwordHash ?? (await this.dummyHash));
    if (!user || !passwordOk) {
      // Hangisinin yanlış olduğu bilerek söylenmez.
      throw new UnauthorizedError("Kullanıcı adı veya şifre hatalı.");
    }

    const now = this.now();
    await this.repository.deleteExpiredSessions(now);

    const token = generateSessionToken();
    const expiresAt = new Date(now.getTime() + SESSION_DURATION_MS);
    await this.repository.createSession(hashSessionToken(token), user.id, expiresAt);
    return { user: { id: user.id, username: user.username }, token, expiresAt };
  }

  /** Çerezdeki belirteç geçerliyse kullanıcıyı, değilse null döner. */
  async authenticate(token: string | undefined): Promise<AuthUser | null> {
    if (!token) {
      return null;
    }
    return this.repository.findUserBySession(hashSessionToken(token), this.now());
  }

  async logout(token: string | undefined): Promise<void> {
    if (token) {
      await this.repository.deleteSession(hashSessionToken(token));
    }
  }

  /**
   * Kullanıcı yoksa oluşturur, varsa şifresini değiştirir ve açık oturumlarını
   * kapatır. Yalnızca komut satırından (scripts/create-admin.ts) çağrılır.
   */
  async upsertUser(username: string, password: string): Promise<"created" | "updated"> {
    if (!/^[a-z0-9._-]{3,32}$/.test(username)) {
      throw new ValidationError(
        "Kullanıcı adı 3-32 karakter olmalı; küçük harf, rakam, nokta, tire içerebilir.",
      );
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      throw new ValidationError(`Şifre en az ${MIN_PASSWORD_LENGTH} karakter olmalı.`);
    }
    const passwordHash = await hashPassword(password);
    const existing = await this.repository.findUserByUsername(username);
    if (existing) {
      await this.repository.updatePassword(existing.id, passwordHash);
      await this.repository.deleteSessionsOfUser(existing.id);
      return "updated";
    }
    await this.repository.createUser(username, passwordHash);
    return "created";
  }
}
