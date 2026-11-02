import { useState } from "react";
import { Link } from "react-router";
import { expenseApi } from "../../api/endpoints";
import { Money } from "../../components/Display";
import { Alert, EmptyState, ErrorState, Loading } from "../../components/Feedback";
import { Icon } from "../../components/Icon";
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
    <div className="stack-lg">
      <PageHeader
        eyebrow="Finans"
        title="Giderler"
        description="Elektrik, temizlik, asansör bakımı gibi apartman harcamaları."
        actions={<Link to="/giderler/yeni" className="btn"><Icon name="plus" /> Gider ekle</Link>}
      />

      <div className="toolbar">
        <MonthSwitcher period={period} onChange={setPeriod} />
        {data && data.length > 0 && (
          <div className="summary-chip"><span>{data.length} gider</span><Money kurus={total} /></div>
        )}
      </div>
      {actionError && <Alert kind="error">{actionError}</Alert>}

      {error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : loading || !data ? (
        <Loading />
      ) : data.length === 0 ? (
        <EmptyState>{formatPeriod(period)} ayında gider yok.</EmptyState>
      ) : (
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
                title="Gideri sil"
                onClick={() => handleDelete(expense.id, expense.amountKurus)}
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
