import { useState } from "react";
import { Link } from "react-router";
import { incomeApi, reportApi } from "../../api/endpoints";
import { Money } from "../../components/Display";
import { Alert, EmptyState, ErrorState, Loading } from "../../components/Feedback";
import { PageHeader } from "../../components/PageHeader";
import { toApiError, useAsync } from "../../hooks/useAsync";
import { formatDate } from "../../lib/dates";
import { incomeKindLabels } from "../../lib/labels";
import { formatKurus } from "../../lib/money";

/** Kasadaki paranın nereden geldiği ve kasaya elle eklenen paralar. */
export function CashPage() {
  const { data, error, loading, reload } = useAsync(
    () => Promise.all([reportApi.summary(), incomeApi.list()]),
    [],
  );
  const [actionError, setActionError] = useState<string | null>(null);

  if (error) return <ErrorState error={error} onRetry={reload} />;
  if (loading && !data) return <Loading />;
  if (!data) return null;
  const [summary, incomes] = data;
  const hasOpeningBalance = incomes.some((income) => income.kind === "opening_balance");

  async function handleDelete(id: number, amountKurus: number) {
    if (!window.confirm(`${formatKurus(amountKurus)} tutarındaki kayıt silinsin mi?`)) return;
    setActionError(null);
    try {
      await incomeApi.delete(id);
      reload();
    } catch (caught) {
      setActionError(toApiError(caught).message);
    }
  }

  return (
    <div className="stack">
      <PageHeader
        title="Kasa"
        backTo="/"
        action={<Link to="/kasa/para-ekle" className="btn small">+ Para ekle</Link>}
      />
      {actionError && <Alert kind="error">{actionError}</Alert>}

      <div className="card stack">
        <div className="row between">
          <span className="muted">Kasadaki para</span>
          <span className="balance-big">
            <Money kurus={summary.cashBalanceKurus} tone={summary.cashBalanceKurus < 0 ? "bad" : undefined} />
          </span>
        </div>
        <div className="breakdown">
          <span>Aidat ve borç tahsilatları</span>
          <Money kurus={summary.totalCollectedKurus} tone="good" />
          <span>Kasaya eklenen paralar</span>
          <Money kurus={summary.totalIncomeKurus} tone="good" />
          <span>Giderler</span>
          <span className="money">−{formatKurus(summary.totalExpensesKurus)}</span>
        </div>
      </div>

      {!hasOpeningBalance && (
        <Alert kind="info">
          Sistemi kullanmaya başlamadan önce kasada para varsa{" "}
          <Link to="/kasa/para-ekle?tur=devir">kasa devri olarak girin</Link>.
        </Alert>
      )}

      <h2 className="section-title">Kasaya eklenen paralar</h2>
      {incomes.length === 0 ? (
        <EmptyState>Henüz kayıt yok.</EmptyState>
      ) : (
        <ul className="list">
          {incomes.map((income) => (
            <li key={income.id} className="list-item">
              <span className="grow">
                <span className="title">{income.description ?? incomeKindLabels[income.kind]}</span>
                <br />
                <span className="sub">
                  {incomeKindLabels[income.kind]} · {formatDate(income.receivedAt)}
                </span>
              </span>
              <Money kurus={income.amountKurus} tone="good" />
              <button
                type="button"
                className="icon-btn"
                aria-label="Kaydı sil"
                onClick={() => handleDelete(income.id, income.amountKurus)}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
