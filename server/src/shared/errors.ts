// Uygulamanın bilerek fırlattığı hatalar. Hata yakalayıcı (middleware/error-handler.ts)
// bunları tanır ve kullanıcıya uygun HTTP koduyla anlaşılır bir mesaj döner.
// Bunların dışındaki her hata "beklenmeyen" sayılır ve ayrıntısı gizlenir.
export class AppError extends Error {
  readonly status: number;
  readonly fields?: Record<string, string>;

  constructor(status: number, message: string, fields?: Record<string, string>) {
    super(message);
    this.name = new.target.name;
    this.status = status;
    this.fields = fields;
  }
}

export class ValidationError extends AppError {
  constructor(message = "Girilen bilgiler hatalı.", fields?: Record<string, string>) {
    super(400, message, fields);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Giriş yapmanız gerekiyor.") {
    super(401, message);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Kayıt bulunamadı.") {
    super(404, message);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, message);
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message: string) {
    super(429, message);
  }
}
