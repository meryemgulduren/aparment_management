import { Link } from "react-router";
import { reportApi } from "../api/endpoints";
import { Money } from "../components/Display";
import { EmptyState, ErrorState, Loading } from "../components/Feedback";
import { useAsync } from "../hooks/useAsync";
import { formatPeriod } from "../lib/dates";

export function DashboardPage() {
  const { data, error, loading, reload } = useAsync(() => reportApi.summary(), []);

  if (error) return <ErrorState error={error} onRetry={reload} />;
  if (loading && !data) return <Loading />;
  if (!data) return null;

  const month = formatPeriod(data.period);

  return (
    <div className="stack">
      <div className="stat-grid">
        <Link to="/kasa" className="stat wide stat-link">
          <div className="label">Kasadaki para</div>
          <div className="value">
            <Money kurus={data.cashBalanceKurus} tone={data.cashBalanceKurus < 0 ? "bad" : undefined} />
          </div>
          <div className="muted small">Ayrıntı ve para ekleme ›</div>
        </Link>
        <div className="stat">
          <div className="label">Toplam alacak</div>
          <div className="value"><Money kurus={data.totalReceivableKurus} tone={data.totalReceivableKurus > 0 ? "bad" : undefined} /></div>
        </div>
        <div className="stat">
          <div className="label">Daire / kişi</div>
          <div className="value">{data.apartmentCount} / {data.householdTotal}</div>
        </div>
        <div className="stat">
          <div className="label">{month} tahsilat</div>
          <div className="value"><Money kurus={data.monthCollectedKurus} tone="good" /></div>
        </div>
        <div className="stat">
          <div className="label">{month} gider</div>
          <div className="value"><Money kurus={data.monthExpensesKurus} /></div>
        </div>
      </div>

      <div className="btn-grid">
        <Link to="/tahsilat/yeni" className="btn">+ Ödeme al</Link>
        <Link to="/giderler/yeni" className="btn secondary">+ Gider ekle</Link>
      </div>

      <h2 className="section-title">
        Borçlu daireler
        {data.debtors.length > 0 && <span className="badge tone-bad">{data.debtors.length}</span>}
      </h2>
      {data.apartmentCount === 0 ? (
        <EmptyState>
          Henüz daire yok. <Link to="/daireler/yeni">İlk daireyi ekleyin.</Link>
        </EmptyState>
      ) : data.debtors.length === 0 ? (
        <EmptyState>Borçlu daire yok. 🎉</EmptyState>
      ) : (
        <ul className="list">
          {data.debtors.map((debtor) => (
            <li key={debtor.id}>
              <Link to={`/daireler/${debtor.id}`} className="list-item">
                <span className="door">{debtor.label}</span>
                <span className="grow title">Daire {debtor.label}</span>
                <Money kurus={debtor.balanceKurus} tone="bad" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
