import type { ErrorRequestHandler, RequestHandler } from "express";
import { isForeignKeyViolation, isUniqueViolation } from "../shared/db-errors.js";
import { AppError } from "../shared/errors.js";

/** /api altında eşleşmeyen adresler için JSON 404. */
export const apiNotFound: RequestHandler = (_req, res) => {
  res.status(404).json({ error: { message: "Böyle bir adres yok." } });
};

/**
 * Tüm hataların son durağı. Express 5, async route'lardaki hataları da buraya getirir.
 * Kullanıcıya yalnızca güvenli mesaj gider; ayrıntı sunucu loguna yazılır.
 */
export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof AppError) {
    res.status(error.status).json({ error: { message: error.message, fields: error.fields } });
    return;
  }

  // express.json() hataları: bozuk JSON veya çok büyük gövde.
  const bodyErrorType = (error as { type?: string }).type;
  if (bodyErrorType === "entity.parse.failed") {
    res.status(400).json({ error: { message: "İstek gövdesi geçerli JSON değil." } });
    return;
  }
  if (bodyErrorType === "entity.too.large") {
    res.status(413).json({ error: { message: "İstek çok büyük." } });
    return;
  }

  // Servislerin önceden yakalayamadığı (örneğin eşzamanlı iki istekten doğan)
  // veritabanı kısıt ihlalleri.
  if (isUniqueViolation(error)) {
    res.status(409).json({ error: { message: "Bu kayıt zaten var." } });
    return;
  }
  if (isForeignKeyViolation(error)) {
    res.status(409).json({ error: { message: "Bağlı kayıtlar olduğu için bu işlem yapılamaz." } });
    return;
  }

  console.error("Beklenmeyen hata:", error);
  res.status(500).json({ error: { message: "Beklenmeyen bir hata oluştu." } });
};
