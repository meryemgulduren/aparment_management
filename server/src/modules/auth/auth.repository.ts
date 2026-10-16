import { and, eq, gt, lte } from "drizzle-orm";
import type { Database } from "../../db/index.js";
import { sessions, users } from "../../db/schema.js";

export interface AuthUser {
  id: number;
  username: string;
}

export interface StoredUser extends AuthUser {
  passwordHash: string;
}

export interface AuthRepository {
  findUserByUsername(username: string): Promise<StoredUser | null>;
  createUser(username: string, passwordHash: string): Promise<AuthUser>;
  updatePassword(userId: number, passwordHash: string): Promise<void>;
  createSession(tokenHash: string, userId: number, expiresAt: Date): Promise<void>;
  findUserBySession(tokenHash: string, now: Date): Promise<AuthUser | null>;
  deleteSession(tokenHash: string): Promise<void>;
  deleteSessionsOfUser(userId: number): Promise<void>;
  deleteExpiredSessions(now: Date): Promise<void>;
}

export class DrizzleAuthRepository implements AuthRepository {
  private readonly db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  async findUserByUsername(username: string): Promise<StoredUser | null> {
    const [user] = await this.db
      .select({ id: users.id, username: users.username, passwordHash: users.passwordHash })
      .from(users)
      .where(eq(users.username, username));
    return user ?? null;
  }

  async createUser(username: string, passwordHash: string): Promise<AuthUser> {
    const [user] = await this.db
      .insert(users)
      .values({ username, passwordHash })
      .returning({ id: users.id, username: users.username });
    return user;
  }

  async updatePassword(userId: number, passwordHash: string): Promise<void> {
    await this.db.update(users).set({ passwordHash }).where(eq(users.id, userId));
  }

  async createSession(tokenHash: string, userId: number, expiresAt: Date): Promise<void> {
    await this.db.insert(sessions).values({ tokenHash, userId, expiresAt });
  }

  async findUserBySession(tokenHash: string, now: Date): Promise<AuthUser | null> {
    const [user] = await this.db
      .select({ id: users.id, username: users.username })
      .from(sessions)
      .innerJoin(users, eq(users.id, sessions.userId))
      .where(and(eq(sessions.tokenHash, tokenHash), gt(sessions.expiresAt, now)));
    return user ?? null;
  }

  async deleteSession(tokenHash: string): Promise<void> {
    await this.db.delete(sessions).where(eq(sessions.tokenHash, tokenHash));
  }

  async deleteSessionsOfUser(userId: number): Promise<void> {
    await this.db.delete(sessions).where(eq(sessions.userId, userId));
  }

  async deleteExpiredSessions(now: Date): Promise<void> {
    await this.db.delete(sessions).where(lte(sessions.expiresAt, now));
  }
}
