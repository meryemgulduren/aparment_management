import type { ReactNode } from "react";
import type { ApiError } from "../api/client";

export function Loading() {
  return <div className="state" role="status">Yükleniyor…</div>;
}

export function ErrorState({ error, onRetry }: { error: ApiError; onRetry?: () => void }) {
  return (
    <div className="state">
      <div className="alert error">{error.message}</div>
      {onRetry && (
        <button type="button" className="btn secondary" onClick={onRetry}>
          Tekrar dene
        </button>
      )}
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <div className="state">{children}</div>;
}

export function Alert({ kind, children }: { kind: "error" | "success" | "info"; children: ReactNode }) {
  return (
    <div className={`alert ${kind}`} role={kind === "error" ? "alert" : "status"}>
      {children}
    </div>
  );
}
