import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { apartmentApi, paymentApi } from "../../api/endpoints";
import type { PaymentMethod } from "../../api/types";
import { Balance } from "../../components/Display";
import { Alert, EmptyState, ErrorState, Loading } from "../../components/Feedback";
import { Field, Segmented } from "../../components/Form";
import { PageHeader } from "../../components/PageHeader";
import { useAsync, useSubmit } from "../../hooks/useAsync";
import { todayIso } from "../../lib/dates";
import { paymentMethodLabels } from "../../lib/labels";
import { kurusToInput, parseTl } from "../../lib/money";

const methodOptions = (Object.keys(paymentMethodLabels) as PaymentMethod[]).map((value) => ({
  value,
  label: paymentMethodLabels[value],
}));

/** Yalnızca uygulama içi adreslere geri dönülür (başka siteye yönlendirme açığı olmasın). */
function safeReturnPath(value: string | null): string | null {
  return value && value.startsWith("/") && !value.startsWith("//") && !value.startsWith("/\\") ? value : null;
}

export function PaymentFormPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const returnTo = safeReturnPath(params.get("geri")) ?? "/tahsilat";
  const apartments = useAsync(() => apartmentApi.list(), []);

  const [apartmentId, setApartmentId] = useState(params.get("daire") ?? "");
  const [amount, setAmount] = useState("");
  const [paidAt, setPaidAt] = useState(todayIso());
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [note, setNote] = useState("");
  const [amountError, setAmountError] = useState<string>();
  const { submitting, error, run } = useSubmit();

  if (apartments.error) return <ErrorState error={apartments.error} onRetry={apartments.reload} />;
  if (apartments.loading || !apartments.data) return <Loading />;
  if (apartments.data.length === 0) {
    return (
      <EmptyState>
        Ödeme almak için önce daire ekleyin. <Link to="/daireler/yeni">Daire ekle</Link>
      </EmptyState>
    );
  }

  const selected = apartments.data.find((a) => String(a.id) === apartmentId);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const amountKurus = parseTl(amount);
    if (!amountKurus) {
      setAmountError("Geçerli bir tutar girin. Örnek: 1250 veya 1.250,50");
      return;
    }
    setAmountError(undefined);
    run(async () => {
      await paymentApi.create({
        apartmentId: Number(apartmentId),
        amountKurus,
        paidAt,
        method,
        note: note.trim() || null,
      });
      navigate(returnTo, { replace: true });
    });
  }

  const fields = error?.fields ?? {};

  return (
    <div className="stack">
      <PageHeader title="Ödeme al" backTo={returnTo} />
      <form className="card stack" onSubmit={handleSubmit}>
        {error && <Alert kind="error">{error.message}</Alert>}
        <Field label="Daire" error={fields.apartmentId}>
          <select value={apartmentId} onChange={(e) => setApartmentId(e.target.value)} required>
            <option value="" disabled>Daire seçin</option>
            {apartments.data.map((apartment) => (
              <option key={apartment.id} value={apartment.id}>
                {apartment.label}
                {apartment.activeResidents.length > 0 &&
                  ` · ${apartment.activeResidents.map((r) => r.fullName).join(", ")}`}
              </option>
            ))}
          </select>
        </Field>
        {selected && (
          <div className="row between small">
            <span className="muted">Güncel bakiye</span>
            <Balance kurus={selected.balanceKurus} />
          </div>
        )}
        <Field label="Tutar (TL)" error={amountError ?? fields.amountKurus}>
          <input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="1250" required autoComplete="off" />
        </Field>
        {selected && selected.balanceKurus > 0 && (
          <button type="button" className="btn small secondary" onClick={() => setAmount(kurusToInput(selected.balanceKurus))}>
            Borcun tamamı
          </button>
        )}
        <Segmented label="Ödeme şekli" value={method} options={methodOptions} onChange={setMethod} />
        <Field label="Ödeme tarihi" error={fields.paidAt}>
          <input type="date" value={paidAt} max={todayIso()} onChange={(e) => setPaidAt(e.target.value)} required />
        </Field>
        <Field label="Not" error={fields.note}>
          <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} placeholder="İsteğe bağlı" />
        </Field>
        <button className="btn block" disabled={submitting}>
          {submitting ? "Kaydediliyor…" : "Ödemeyi kaydet"}
        </button>
      </form>
    </div>
  );
}
