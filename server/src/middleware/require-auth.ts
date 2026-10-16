import type { RequestHandler } from "express";
import type { AuthUser } from "../modules/auth/auth.repository.js";
import { UnauthorizedError } from "../shared/errors.js";

export const SESSION_COOKIE = "apartman_sid";

// Middleware AuthService'in tamamına değil, yalnızca bu tek yeteneğe ihtiyaç duyar.
export interface SessionAuthenticator {
  authenticate(token: string | undefined): Promise<AuthUser | null>;
}

/** Geçerli oturum yoksa isteği 401 ile durdurur; varsa kullanıcıyı req.user'a koyar. */
export function requireAuth(authenticator: SessionAuthenticator): RequestHandler {
  return async (req, _res, next) => {
    const user = await authenticator.authenticate(req.cookies?.[SESSION_COOKIE]);
    if (!user) {
      throw new UnauthorizedError();
    }
    req.user = user;
    next();
  };
}
