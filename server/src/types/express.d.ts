import type { AuthUser } from "../modules/auth/auth.repository.js";

// Express'in Request tipine, require-auth middleware'inin eklediği alanı tanıtır.
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export {};
