// PostgreSQL hata kodları: https://www.postgresql.org/docs/current/errcodes-appendix.html
const UNIQUE_VIOLATION = "23505";
const FOREIGN_KEY_VIOLATION = "23503";

// Drizzle, sürücünün hatasını kendi hatasıyla sarar; asıl kod "cause" içindedir.
function postgresCode(error: unknown): string | undefined {
  let current: unknown = error;
  for (let depth = 0; depth < 3 && current && typeof current === "object"; depth++) {
    const code = (current as { code?: unknown }).code;
    if (typeof code === "string") {
      return code;
    }
    current = (current as { cause?: unknown }).cause;
  }
  return undefined;
}

export function isUniqueViolation(error: unknown): boolean {
  return postgresCode(error) === UNIQUE_VIOLATION;
}

export function isForeignKeyViolation(error: unknown): boolean {
  return postgresCode(error) === FOREIGN_KEY_VIOLATION;
}
