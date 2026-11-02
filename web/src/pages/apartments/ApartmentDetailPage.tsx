import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { apartmentApi, chargeApi, paymentApi, reportApi } from "../../api/endpoints";
import { Badge, Balance, Money } from "../../components/Display";
import { Alert, EmptyState, ErrorState, Loading } from "../../components/Feedback";
import { Icon } from "../../components/Icon";
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
  const floorText = apartment.floor === null ? null : apartment.floor === 0 ? "Zemin kat" : `${apartment.floor}. kat`;

  return (
    <div className="stack-lg">
      <PageHeader
        eyebrow="Daire"
        title={`Daire ${apartment.label}`}
        backTo="/daireler"
        actions={
          <Link to={`/daireler/${apartmentId}/duzenle`} className="btn secondary small">
            <Icon name="edit" /> Düzenle
          </Link>
        }
      />

      {actionError && <Alert kind="error">{actionError}</Alert>}

      <div className="two-col aside-left">
        {/* Sol sütun: hesap özeti ve sakinler */}
        <div className="stack-lg">
          <section className="card account-card" aria-label="Hesap özeti">
            <div className="account-top">
              <div>
                <div className="account-label">Güncel bakiye</div>
                <div className="balance-big"><Balance kurus={statement.balanceKurus} /></div>
              </div>
            </div>
            <div className="breakdown">
              <span>Toplam borç</span><Money kurus={statement.totalChargedKurus} />
              <span>Ödenen</span><Money kurus={statement.totalPaidKurus} tone="good" />
            </div>
            <div className="btn-grid">
              <Link to={`/tahsilat/yeni?daire=${apartmentId}&geri=${back}`} className="btn"><Icon name="plus" /> Ödeme al</Link>
              <Link to={`/daireler/${apartmentId}/borc-ekle`} className="btn secondary"><Icon name="plus" /> Borç ekle</Link>
            </div>
            <div className="facts">
              {floorText && <span className="fact"><Icon name="layers" /> {floorText}</span>}
              <span className="fact"><Icon name="users" /> {apartment.householdSize} kişi oturuyor</span>
            </div>
            {apartment.note && <p className="note">{apartment.note}</p>}
          </section>

          <section className="stack">
            <h2 className="section-title">
              Sakinler
              <Link to={`/daireler/${apartmentId}/sakin-ekle`} className="btn secondary small"><Icon name="plus" /> Sakin</Link>
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
                      <a href={`tel:${resident.phone.replace(/[^\d+]/g, "")}`} className="btn secondary small" aria-label={`${resident.fullName} ara`}>
                        <Icon name="phone" /> Ara
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {movedOut.length > 0 && (
              <button type="button" className="btn secondary small" onClick={() => setShowMovedOut((v) => !v)}>
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
                      <Icon name="chevron" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* Sağ sütun: borç ve ödeme geçmişi */}
        <div className="stack-lg">
          <section className="stack">
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
                      title="Borcu sil"
                      onClick={() =>
                        confirmAndRun("Bu borç kaydı silinsin mi?", async () => {
                          await chargeApi.delete(charge.id);
                          reload();
                        })
                      }
                    >
                      <Icon name="trash" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="stack">
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
                      title="Ödemeyi sil"
                      onClick={() =>
                        confirmAndRun(`${formatKurus(payment.amountKurus)} tutarındaki ödeme silinsin mi?`, async () => {
                          await paymentApi.delete(payment.id);
                          reload();
                        })
                      }
                    >
                      <Icon name="trash" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="stack">
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
              <Icon name="trash" /> Daireyi sil
            </button>
            <p className="note">Yalnızca sakin, borç ve ödeme kaydı olmayan daire silinebilir.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
