import { useState } from "react";
import { Link } from "react-router";
import { paymentApi } from "../../api/endpoints";
import { Money } from "../../components/Display";
import { Alert, EmptyState, ErrorState, Loading } from "../../components/Feedback";
import { Icon } from "../../components/Icon";
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
    <div className="stack-lg">
      <PageHeader
        eyebrow="Finans"
        title="Tahsilatlar"
        description="Dairelerden alınan ödemeler. Ödeme girildiğinde borç ve kasa kendiliğinden güncellenir."
        actions={<Link to="/tahsilat/yeni" className="btn"><Icon name="plus" /> Ödeme al</Link>}
      />

      <div className="toolbar">
        <MonthSwitcher period={period} onChange={setPeriod} />
        {data && data.length > 0 && (
          <div className="summary-chip"><span>{data.length} ödeme</span><Money kurus={total} tone="good" /></div>
        )}
      </div>
      {actionError && <Alert kind="error">{actionError}</Alert>}

      {error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : loading || !data ? (
        <Loading />
      ) : data.length === 0 ? (
        <EmptyState>{formatPeriod(period)} ayında ödeme yok.</EmptyState>
      ) : (
        <ul className="list">
          {data.map((payment) => (
            <li key={payment.id} className="list-item">
              <Link to={`/daireler/${payment.apartmentId}`} className="door" aria-label={`Daire ${payment.apartmentLabel}`}>
                {payment.apartmentLabel}
              </Link>
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
                title="Ödemeyi sil"
                onClick={() => handleDelete(payment.id, payment.amountKurus, payment.apartmentLabel)}
              >
                <Icon name="trash" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
