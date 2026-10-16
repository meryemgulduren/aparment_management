import { Link } from "react-router";
import { reportApi } from "../../api/endpoints";
import { Badge, Balance } from "../../components/Display";
import { EmptyState, ErrorState, Loading } from "../../components/Feedback";
import { MonthSwitcher, usePeriodParam } from "../../components/MonthSwitcher";
import { PageHeader } from "../../components/PageHeader";
import { useAsync } from "../../hooks/useAsync";
import { formatPeriod } from "../../lib/dates";
import { chargeStatusLabels, chargeStatusTone } from "../../lib/labels";
import { formatKurus } from "../../lib/money";

/** Seçilen ayın aidatını kimin ödediği. */
export function DuesPage() {
  const [period, setPeriod] = usePeriodParam();
  const { data, error, loading, reload } = useAsync(() => reportApi.dues(period), [period]);

  const chargeLink = (
    <Link to={`/aidat/borclandir?ay=${period}`} className="btn small">Borç yaz</Link>
  );

  return (
    <div className="stack">
      <PageHeader title="Aidat takibi" action={chargeLink} />
      <MonthSwitcher period={period} onChange={setPeriod} />

      {error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : loading || !data ? (
        <Loading />
      ) : data.rows.length === 0 ? (
        <EmptyState>
          Henüz daire yok. <Link to="/daireler/yeni">Daire ekleyin.</Link>
        </EmptyState>
      ) : data.counts.none === data.rows.length ? (
        <EmptyState>
          {formatPeriod(period)} için henüz aidat yazılmamış.
          <br />
          <Link to={`/aidat/borclandir?ay=${period}`} className="btn">Tüm dairelere aidat yaz</Link>
        </EmptyState>
      ) : (
        <>
          <div className="row wrap">
            <Badge tone="good">{data.counts.paid} ödedi</Badge>
            {data.counts.partial > 0 && <Badge tone="warn">{data.counts.partial} kısmen</Badge>}
            <Badge tone="bad">{data.counts.unpaid} ödemedi</Badge>
            {data.counts.none > 0 && <Badge tone="muted">{data.counts.none} yazılmadı</Badge>}
          </div>
          <ul className="list">
            {data.rows.map((row) => (
              <li key={row.apartmentId}>
                <Link to={`/daireler/${row.apartmentId}`} className="list-item">
                  <span className="door">{row.label}</span>
                  <span className="grow">
                    <span className="title">{row.residentNames.join(", ") || `Daire ${row.label}`}</span>
                    <br />
                    <span className="sub">
                      {row.status === "partial"
                        ? `${formatKurus(row.paidKurus)} / ${formatKurus(row.amountKurus)}`
                        : "Toplam bakiye: "}
                      {row.status !== "partial" && <Balance kurus={row.balanceKurus} />}
                    </span>
                  </span>
                  <Badge tone={chargeStatusTone[row.status]}>{chargeStatusLabels[row.status]}</Badge>
                </Link>
              </li>
            ))}
          </ul>
          <p className="note">
            Ödemeler en eski borçtan başlayarak düşülür. Önceki aylardan borcu olan dairenin
            yaptığı ödeme önce o borçları kapatır.
          </p>
        </>
      )}
    </div>
  );
}
