import { Router, type CookieOptions } from "express";
import { z } from "zod";
import { requireAuth, SESSION_COOKIE } from "../../middleware/require-auth.js";
import { UnauthorizedError } from "../../shared/errors.js";
import { parseInput } from "../../shared/validation.js";
import type { AuthService } from "./auth.service.js";
import type { LoginLimiter } from "./login-limiter.js";

const loginSchema = z.object({
  username: z.string().trim().toLowerCase().min(1, { error: "Kullanıcı adı girilmeli." }).max(64),
  password: z.string().min(1, { error: "Şifre girilmeli." }).max(256),
});

export function createAuthRouter(
  authService: AuthService,
  limiter: LoginLimiter,
  options: { secureCookie: boolean },
): Router {
  const router = Router();

  const cookieOptions: CookieOptions = {
    httpOnly: true, // JavaScript çerezi okuyamaz; XSS olsa bile oturum çalınamaz
    secure: options.secureCookie, // üretimde yalnızca HTTPS
    sameSite: "lax", // başka sitelerden gelen POST isteklerine çerez eklenmez (CSRF)
    path: "/",
  };

  router.post("/login", async (req, res) => {
    const clientKey = req.ip ?? "unknown";
    limiter.assertAllowed(clientKey);
    const { username, password } = parseInput(loginSchema, req.body);

    try {
      const result = await authService.login(username, password);
      limiter.reset(clientKey);
      res.cookie(SESSION_COOKIE, result.token, { ...cookieOptions, expires: result.expiresAt });
      res.json({ user: result.user });
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        limiter.recordFailure(clientKey);
      }
      throw error;
    }
  });

  router.post("/logout", async (req, res) => {
    await authService.logout(req.cookies?.[SESSION_COOKIE]);
    res.clearCookie(SESSION_COOKIE, cookieOptions);
    res.status(204).end();
  });

  router.get("/me", requireAuth(authService), (req, res) => {
    res.json({ user: req.user });
  });

  return router;
}
