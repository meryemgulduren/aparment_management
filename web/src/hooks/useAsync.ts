import { useCallback, useEffect, useState } from "react";
import { ApiError } from "../api/client";

export function toApiError(error: unknown): ApiError {
  return error instanceof ApiError ? error : new ApiError(0, "Beklenmeyen bir hata oluştu.");
}

interface AsyncState<T> {
  data?: T;
  error?: ApiError;
  loading: boolean;
}

/**
 * Sayfa açılınca veri yükler. deps değişince yeniden yükler; reload() ile elle de
 * yenilenebilir (örneğin bir kayıt silindikten sonra).
 */
export function useAsync<T>(load: () => Promise<T>, deps: readonly unknown[]) {
  const [state, setState] = useState<AsyncState<T>>({ loading: true });
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelled = false; // sayfa değiştiyse eski yanıt yeni sayfanın üzerine yazılmasın
    setState((previous) => ({ data: previous.data, loading: true }));
    load().then(
      (data) => !cancelled && setState({ data, loading: false }),
      (error) => !cancelled && setState({ error: toApiError(error), loading: false }),
    );
    return () => {
      cancelled = true;
    };
    // load her render'da yeni bir fonksiyon; neyin yeniden yüklemeyi tetikleyeceğini deps belirler.
  }, [...deps, version]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  return { ...state, reload };
}

/** Form gönderme: gönderiliyor durumu ve sunucudan gelen hata. */
export function useSubmit() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  async function run(action: () => Promise<void>) {
    setSubmitting(true);
    setError(null);
    try {
      await action();
    } catch (caught) {
      setError(toApiError(caught));
    } finally {
      setSubmitting(false);
    }
  }

  return { submitting, error, setError, run };
}
