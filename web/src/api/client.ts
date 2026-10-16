// Sunucuyla konuşan tek yer. Sayfalar fetch'i doğrudan çağırmaz; böylece hata
// işleme ve "oturum düştü" davranışı tek noktada kalır.

export class ApiError extends Error {
  readonly status: number;
  /** Alan adı → hata mesajı (form alanlarının altında gösterilir). */
  readonly fields: Record<string, string>;

  constructor(status: number, message: string, fields: Record<string, string> = {}) {
    super(message);
    this.status = status;
    this.fields = fields;
  }
}

let onUnauthorized: () => void = () => {};

/** Oturum düştüğünde (401) ne yapılacağını AuthProvider belirler. */
export function setUnauthorizedHandler(handler: () => void): void {
  onUnauthorized = handler;
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      method,
      credentials: "same-origin",
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, "Sunucuya ulaşılamadı. İnternet bağlantınızı kontrol edin.");
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    // Giriş isteğinin kendi 401'i "şifre yanlış" demektir, oturum düşmesi değil.
    if (response.status === 401 && path !== "/auth/login") {
      onUnauthorized();
    }
    const error = data?.error;
    throw new ApiError(
      response.status,
      error?.message ?? "Beklenmeyen bir hata oluştu.",
      error?.fields ?? {},
    );
  }
  return data as T;
}

export const http = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, body ?? {}),
  patch: <T>(path: string, body: unknown) => request<T>("PATCH", path, body),
  delete: (path: string) => request<void>("DELETE", path),
};
