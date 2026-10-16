import { useState } from "react";
import { Link } from "react-router";
import { paymentApi } from "../../api/endpoints";
import { Money } from "../../components/Display";
import { Alert, EmptyState, ErrorState, Loading } from "../../components/Feedback";
import { MonthSwitcher, usePeriodParam } from "../../components/MonthSwitcher";
import { PageHeader } from "../../components/PageHeader";
import { toApiError, useAsync } from "../../hooks/useAsync";
import { formatDate, formatPeriod } from "../../lib/dates";
import { paymentMethodLabels } from "../../lib/labels";
import { formatKurus } from "../../lib/money";

export function PaymentsPage() {
  const [period, setPeriod] = usePeriodParam();
  const { data, error, loading, reload } = useAsync(() => paymentApi.list({ period }), [period]);
  const [actionError, setActionError] = useState<string | null>(null);

  async function handleDelete(id: number, amountKurus: number, label: string) {
    if (!window.confirm(`Daire ${label} · ${formatKurus(amountKurus)} ödemesi silinsin mi?`)) return;
    setActionError(null);
    try {
      await paymentApi.delete(id);
      reload();
    } catch (caught) {
      setActionError(toApiError(caught).message);
    }
  }

  const total = data?.reduce((sum, payment) => sum + payment.amountKurus, 0) ?? 0;

  return (
    <div className="stack">
      <PageHeader title="Tahsilat" action={<Link to="/tahsilat/yeni" className="btn small">+ Ödeme</Link>} />
      <MonthSwitcher period={period} onChange={setPeriod} />
      {actionError && <Alert kind="error">{actionError}</Alert>}

      {error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : loading || !data ? (
        <Loading />
      ) : data.length === 0 ? (
        <EmptyState>{formatPeriod(period)} ayında ödeme yok.</EmptyState>
      ) : (
        <>
          <div className="card row between">
            <span className="muted">{data.length} ödeme</span>
            <Money kurus={total} tone="good" />
          </div>
          <ul className="list">
            {data.map((payment) => (
              <li key={payment.id} className="list-item">
                <Link to={`/daireler/${payment.apartmentId}`} className="door">{payment.apartmentLabel}</Link>
                <span className="grow">
                  <span className="title">{formatDate(payment.paidAt)}</span>
                  <br />
                  <span className="sub">
                    {paymentMethodLabels[payment.method]}
                    {payment.note ? ` · ${payment.note}` : ""}
                  </span>
                </span>
                <Money kurus={payment.amountKurus} tone="good" />
                <button
                  type="button"
                  className="icon-btn"
                  aria-label="Ödemeyi sil"
                  onClick={() => handleDelete(payment.id, payment.amountKurus, payment.apartmentLabel)}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
