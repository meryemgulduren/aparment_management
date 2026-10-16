import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { apartmentApi, chargeApi, paymentApi, reportApi } from "../../api/endpoints";
import { Badge, Balance, Money } from "../../components/Display";
import { Alert, EmptyState, ErrorState, Loading } from "../../components/Feedback";
import { PageHeader } from "../../components/PageHeader";
import { toApiError, useAsync } from "../../hooks/useAsync";
import { formatDate, formatPeriod } from "../../lib/dates";
import { chargeStatusLabels, chargeStatusTone, paymentMethodLabels, residentKindLabels } from "../../lib/labels";
import { formatKurus } from "../../lib/money";

export function ApartmentDetailPage() {
  const apartmentId = Number(useParams().id);
  const navigate = useNavigate();
  const { data, error, loading, reload } = useAsync(
    () => Promise.all([apartmentApi.get(apartmentId), reportApi.statement(apartmentId)]),
    [apartmentId],
  );
  const [actionError, setActionError] = useState<string | null>(null);
  const [showMovedOut, setShowMovedOut] = useState(false);

  if (error) return <ErrorState error={error} onRetry={reload} />;
  if (loading && !data) return <Loading />;
  if (!data) return null;
  const [apartment, statement] = data;

  // Silme işlemleri geri alınamaz; her seferinde onay istenir.
  async function confirmAndRun(message: string, action: () => Promise<void>) {
    if (!window.confirm(message)) return;
    setActionError(null);
    try {
      await action();
    } catch (caught) {
      setActionError(toApiError(caught).message);
    }
  }

  const activeResidents = apartment.residents.filter((r) => r.isActive);
  const movedOut = apartment.residents.filter((r) => !r.isActive);
  const back = encodeURIComponent(`/daireler/${apartmentId}`);

  return (
    <div className="stack">
      <PageHeader
        title={`Daire ${apartment.label}`}
        backTo="/daireler"
        action={<Link to={`/daireler/${apartmentId}/duzenle`} className="btn small secondary">Düzenle</Link>}
      />

      {actionError && <Alert kind="error">{actionError}</Alert>}

      <div className="card stack">
        <div className="row between">
          <span className="muted">Bakiye</span>
          <span className="balance-big"><Balance kurus={statement.balanceKurus} /></span>
        </div>
        <div className="row between small muted">
          <span>Toplam borç {formatKurus(statement.totalChargedKurus)}</span>
          <span>Ödenen {formatKurus(statement.totalPaidKurus)}</span>
        </div>
        <div className="btn-grid">
          <Link to={`/tahsilat/yeni?daire=${apartmentId}&geri=${back}`} className="btn">+ Ödeme al</Link>
          <Link to={`/daireler/${apartmentId}/borc-ekle`} className="btn secondary">+ Borç ekle</Link>
        </div>
        <div className="row wrap small muted">
          {apartment.floor !== null && <span>{apartment.floor}. kat ·</span>}
          <span>{apartment.householdSize} kişi oturuyor</span>
        </div>
        {apartment.note && <div className="small">{apartment.note}</div>}
      </div>

      <h2 className="section-title">
        Sakinler
        <Link to={`/daireler/${apartmentId}/sakin-ekle`} className="btn small secondary">+ Sakin</Link>
      </h2>
      {activeResidents.length === 0 ? (
        <EmptyState>Kayıtlı sakin yok.</EmptyState>
      ) : (
        <ul className="list">
          {activeResidents.map((resident) => (
            <li key={resident.id} className="list-item">
              <Link to={`/daireler/${apartmentId}/sakinler/${resident.id}`} className="grow plain-link">
                <span className="title">{resident.fullName}</span>
                <br />
                <span className="sub">
                  {residentKindLabels[resident.kind]}
                  {resident.phone ? ` · ${resident.phone}` : ""}
                </span>
              </Link>
              {resident.phone && (
                <a href={`tel:${resident.phone.replace(/[^\d+]/g, "")}`} className="btn small secondary" aria-label={`${resident.fullName} ara`}>
                  Ara
                </a>
              )}
            </li>
          ))}
        </ul>
      )}
      {movedOut.length > 0 && (
        <button type="button" className="btn small secondary" onClick={() => setShowMovedOut((v) => !v)}>
          {showMovedOut ? "Taşınanları gizle" : `Taşınanlar (${movedOut.length})`}
        </button>
      )}
      {showMovedOut && (
        <ul className="list">
          {movedOut.map((resident) => (
            <li key={resident.id}>
              <Link to={`/daireler/${apartmentId}/sakinler/${resident.id}`} className="list-item">
                <span className="grow">
                  <span className="title muted">{resident.fullName}</span>
                  <br />
                  <span className="sub">{residentKindLabels[resident.kind]} · taşındı</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <h2 className="section-title">Borçlar</h2>
      {statement.charges.length === 0 ? (
        <EmptyState>Bu daireye henüz borç yazılmamış.</EmptyState>
      ) : (
        <ul className="list">
          {statement.charges.map((charge) => (
            <li key={charge.id} className="list-item">
              <span className="grow">
                <span className="title">
                  {charge.kind === "dues" ? `${formatPeriod(charge.period)} aidatı` : charge.description}
                </span>
                <br />
                <span className="sub">
                  Son ödeme {formatDate(charge.dueDate)}
                  {charge.status === "partial" && ` · ${formatKurus(charge.paidKurus)} ödendi`}
                </span>
              </span>
              <span className="right">
                <Money kurus={charge.amountKurus} />
                <br />
                <Badge tone={chargeStatusTone[charge.status]}>{chargeStatusLabels[charge.status]}</Badge>
              </span>
              <button
                type="button"
                className="icon-btn"
                aria-label="Borcu sil"
                onClick={() =>
                  confirmAndRun("Bu borç kaydı silinsin mi?", async () => {
                    await chargeApi.delete(charge.id);
                    reload();
                  })
                }
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      <h2 className="section-title">Ödemeler</h2>
      {statement.payments.length === 0 ? (
        <EmptyState>Henüz ödeme yok.</EmptyState>
      ) : (
        <ul className="list">
          {statement.payments.map((payment) => (
            <li key={payment.id} className="list-item">
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
                onClick={() =>
                  confirmAndRun(`${formatKurus(payment.amountKurus)} tutarındaki ödeme silinsin mi?`, async () => {
                    await paymentApi.delete(payment.id);
                    reload();
                  })
                }
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        className="btn danger block"
        onClick={() =>
          confirmAndRun(`Daire ${apartment.label} silinsin mi?`, async () => {
            await apartmentApi.delete(apartmentId);
            navigate("/daireler", { replace: true });
          })
        }
      >
        Daireyi sil
      </button>
      <p className="note">
        Yalnızca sakin, borç ve ödeme kaydı olmayan daire silinebilir.
      </p>
    </div>
  );
}
