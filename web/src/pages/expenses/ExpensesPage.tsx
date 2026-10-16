import { useState } from "react";
import { Link } from "react-router";
import { expenseApi } from "../../api/endpoints";
import { Money } from "../../components/Display";
import { Alert, EmptyState, ErrorState, Loading } from "../../components/Feedback";
import { MonthSwitcher, usePeriodParam } from "../../components/MonthSwitcher";
import { PageHeader } from "../../components/PageHeader";
import { toApiError, useAsync } from "../../hooks/useAsync";
import { formatDate, formatPeriod } from "../../lib/dates";
import { expenseCategoryLabels } from "../../lib/labels";
import { formatKurus } from "../../lib/money";

export function ExpensesPage() {
  const [period, setPeriod] = usePeriodParam();
  const { data, error, loading, reload } = useAsync(() => expenseApi.list(period), [period]);
  const [actionError, setActionError] = useState<string | null>(null);

  async function handleDelete(id: number, amountKurus: number) {
    if (!window.confirm(`${formatKurus(amountKurus)} tutarındaki gider silinsin mi?`)) return;
    setActionError(null);
    try {
      await expenseApi.delete(id);
      reload();
    } catch (caught) {
      setActionError(toApiError(caught).message);
    }
  }

  const total = data?.reduce((sum, expense) => sum + expense.amountKurus, 0) ?? 0;

  return (
    <div className="stack">
      <PageHeader title="Giderler" action={<Link to="/giderler/yeni" className="btn small">+ Gider</Link>} />
      <MonthSwitcher period={period} onChange={setPeriod} />
      {actionError && <Alert kind="error">{actionError}</Alert>}

      {error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : loading || !data ? (
        <Loading />
      ) : data.length === 0 ? (
        <EmptyState>{formatPeriod(period)} ayında gider yok.</EmptyState>
      ) : (
        <>
          <div className="card row between">
            <span className="muted">{data.length} gider</span>
            <Money kurus={total} />
          </div>
          <ul className="list">
            {data.map((expense) => (
              <li key={expense.id} className="list-item">
                <span className="grow">
                  <span className="title">{expenseCategoryLabels[expense.category]}</span>
                  <br />
                  <span className="sub">
                    {formatDate(expense.spentAt)}
                    {expense.description ? ` · ${expense.description}` : ""}
                  </span>
                </span>
                <Money kurus={expense.amountKurus} />
                <button
                  type="button"
                  className="icon-btn"
                  aria-label="Gideri sil"
                  onClick={() => handleDelete(expense.id, expense.amountKurus)}
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
