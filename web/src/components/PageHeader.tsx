import type { ReactNode } from "react";
import { Link } from "react-router";

interface PageHeaderProps {
  title: string;
  /** Verilirse solda geri oku çıkar. */
  backTo?: string;
  /** Sağdaki düğme (ör. "+ Ekle"). */
  action?: ReactNode;
}

export function PageHeader({ title, backTo, action }: PageHeaderProps) {
  return (
    <div className="page-header">
      {backTo && (
        <Link to={backTo} className="back-link" aria-label="Geri">
          ‹
        </Link>
      )}
      <h1>{title}</h1>
      {action}
    </div>
  );
}
