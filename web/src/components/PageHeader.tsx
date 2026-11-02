import type { ReactNode } from "react";
import { Link } from "react-router";
import { Icon } from "./Icon";

interface PageHeaderProps {
  title: string;
  /** Başlığın üstündeki küçük etiket (ör. "Kasım 2026"). */
  eyebrow?: string;
  /** Başlığın altındaki kısa açıklama. */
  description?: ReactNode;
  /** Verilirse solda geri düğmesi çıkar. */
  backTo?: string;
  /** Sağdaki düğmeler. */
  actions?: ReactNode;
}

export function PageHeader({ title, eyebrow, description, backTo, actions }: PageHeaderProps) {
  return (
    <div className="page-header">
      <div className="page-header-main">
        {backTo && (
          <Link to={backTo} className="back-link" aria-label="Geri">
            <Icon name="chevronLeft" />
          </Link>
        )}
        <div className="page-header-copy">
          {eyebrow && <span className="eyebrow">{eyebrow}</span>}
          <h1>{title}</h1>
          {description && <p>{description}</p>}
        </div>
      </div>
      {actions && <div className="page-header-actions">{actions}</div>}
    </div>
  );
}
