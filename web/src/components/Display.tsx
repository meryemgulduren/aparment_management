import type { ReactNode } from "react";
import { formatKurus } from "../lib/money";

export type Tone = "good" | "warn" | "bad" | "muted";

export function Badge({ tone, children }: { tone: Tone; children: ReactNode }) {
  return <span className={`badge tone-${tone}`}>{children}</span>;
}

export function Money({ kurus, tone }: { kurus: number; tone?: Tone }) {
  return <span className={`money${tone ? ` tone-${tone}` : ""}`}>{formatKurus(kurus)}</span>;
}

/** Daire bakiyesi: borç kırmızı, fazla ödeme yeşil, sıfır gri. */
export function Balance({ kurus }: { kurus: number }) {
  if (kurus > 0) return <Money kurus={kurus} tone="bad" />;
  if (kurus < 0) {
    return (
      <span className="money tone-good">
        +{formatKurus(-kurus)}
      </span>
    );
  }
  return <span className="money tone-muted">Borç yok</span>;
}
