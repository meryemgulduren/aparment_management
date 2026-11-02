import { Link } from "react-router";
import { reportApi } from "../api/endpoints";
import { useAuth } from "../auth/AuthContext";
import { Money } from "../components/Display";
import { EmptyState, ErrorState, Loading } from "../components/Feedback";
import { Icon } from "../components/Icon";
import { useAsync } from "../hooks/useAsync";
import { formatPeriod } from "../lib/dates";

function greeting() {
  const hour = Number(
    new Intl.DateTimeFormat("tr-TR", { hour: "numeric", hour12: false, timeZone: "Europe/Istanbul" }).format(new Date()),
  );
  if (hour < 12) return "Günaydın";
  if (hour < 18) return "İyi günler";
  return "İyi akşamlar";
}

export function DashboardPage() {
  const { user } = useAuth();
  const { data, error, loading, reload } = useAsync(() => reportApi.summary(), []);

  if (error) return <ErrorState error={error} onRetry={reload} />;
  if (loading && !data) return <Loading />;
  if (!data) return null;

  const month = formatPeriod(data.period);
  const monthlyIncome = data.monthCollectedKurus + data.monthIncomeKurus;
  const monthlyNet = monthlyIncome - data.monthExpensesKurus;
  const scale = Math.max(monthlyIncome, data.monthExpensesKurus, 1);

  return (
    <div className="stack-lg">
      <section className="dashboard-welcome">
        <div>
          <span className="eyebrow">{month}</span>
          <h1>{greeting()}, {user?.username}.</h1>
          <p>Apartmanın mali durumu ve ilgilenmeniz gereken daireler burada.</p>
        </div>
        <div className="welcome-actions">
          <Link to="/tahsilat/yeni" className="btn"><Icon name="plus" /> Ödeme al</Link>
          <Link to="/giderler/yeni" className="btn secondary"><Icon name="plus" /> Gider ekle</Link>
        </div>
      </section>

      <section className="dashboard-stats" aria-label="Mali özet">
        <Link to="/kasa" className="balance-card">
          <div className="balance-card-head">
            <span className="metric-icon"><Icon name="vault" /></span>
            <span className="status-pill"><i /> Güncel</span>
          </div>
          <span className="balance-label">Kasadaki para</span>
          <strong className="balance-value"><Money kurus={data.cashBalanceKurus} /></strong>
          <span className="balance-link">Kasa hareketlerini gör <Icon name="arrow" /></span>
        </Link>

        <article className="metric-card receivable">
          <div className="metric-card-top">
            <span className="metric-icon"><Icon name="coins" /></span>
            <span className="metric-kicker">Alacak</span>
          </div>
          <span className="metric-label">Bekleyen borç toplamı</span>
          <strong className="metric-value"><Money kurus={data.totalReceivableKurus} /></strong>
          <span className="metric-foot">
            {data.debtors.length > 0 ? `${data.debtors.length} dairede açık borç` : "Açık borç yok"}
          </span>
        </article>

        <article className="metric-card">
          <div className="metric-card-top">
            <span className="metric-icon"><Icon name="users" /></span>
            <span className="metric-kicker">Apartman</span>
          </div>
          <span className="metric-label">Daire ve sakin</span>
          <strong className="metric-value">{data.apartmentCount} <small>daire</small></strong>
          <span className="metric-foot">Toplam {data.householdTotal} kişi oturuyor</span>
        </article>
      </section>

      <div className="dashboard-columns">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Aylık hareket</span>
              <h2>{month}</h2>
            </div>
            <Link to="/kasa" className="text-link">Kasa <Icon name="arrow" /></Link>
          </div>

          <div className="flow-list">
            <div className="flow-row">
              <span className="flow-icon income"><Icon name="trendUp" /></span>
              <span className="flow-copy"><strong>Giren para</strong><small>Tahsilat ve diğer gelirler</small></span>
              <Money kurus={monthlyIncome} tone="good" />
            </div>
            <div className="progress-track" aria-hidden="true">
              <span className="income" style={{ width: `${(monthlyIncome / scale) * 100}%` }} />
            </div>
            <div className="flow-row">
              <span className="flow-icon expense"><Icon name="trendDown" /></span>
              <span className="flow-copy"><strong>Çıkan para</strong><small>Kaydedilen giderler</small></span>
              <Money kurus={data.monthExpensesKurus} />
            </div>
            <div className="progress-track" aria-hidden="true">
              <span className="expense" style={{ width: `${(data.monthExpensesKurus / scale) * 100}%` }} />
            </div>
          </div>

          <div className="monthly-net">
            <span>Bu ayki fark</span>
            <Money kurus={monthlyNet} tone={monthlyNet >= 0 ? "good" : "bad"} />
          </div>
        </section>

        <section className="panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Takip listesi</span>
              <h2>Borçlu daireler</h2>
            </div>
            {data.debtors.length > 0 && <span className="count-badge">{data.debtors.length}</span>}
          </div>

          {data.apartmentCount === 0 ? (
            <EmptyState>
              Henüz daire yok. <Link to="/daireler/yeni">İlk daireyi ekleyin.</Link>
            </EmptyState>
          ) : data.debtors.length === 0 ? (
            <div className="all-clear">
              <span><Icon name="check" /></span>
              <strong>Her şey yolunda</strong>
              <small>Şu anda borçlu daire yok.</small>
            </div>
          ) : (
            <ul className="dashboard-debtor-list">
              {data.debtors.slice(0, 6).map((debtor) => (
                <li key={debtor.id}>
                  <Link to={`/daireler/${debtor.id}`}>
                    <span className="door">{debtor.label}</span>
                    <span className="debtor-copy"><strong>Daire {debtor.label}</strong><small>Ödeme bekleniyor</small></span>
                    <Money kurus={debtor.balanceKurus} tone="bad" />
                    <Icon name="chevron" />
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {data.debtors.length > 6 && (
            <Link to="/aidat" className="panel-footer-link">Tüm borçlu daireler <Icon name="arrow" /></Link>
          )}
        </section>
      </div>
    </div>
  );
}
