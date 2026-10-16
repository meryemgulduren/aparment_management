import { useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { incomeApi } from "../../api/endpoints";
import type { IncomeKind } from "../../api/types";
import { Alert, ErrorState, Loading } from "../../components/Feedback";
import { Field, Segmented } from "../../components/Form";
import { PageHeader } from "../../components/PageHeader";
import { useAsync, useSubmit } from "../../hooks/useAsync";
import { todayIso } from "../../lib/dates";
import { incomeKindLabels } from "../../lib/labels";
import { parseTl } from "../../lib/money";

const kindOptions = (Object.keys(incomeKindLabels) as IncomeKind[]).map((value) => ({
  value,
  label: incomeKindLabels[value],
}));

export function IncomeFormPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const existing = useAsync(() => incomeApi.list(), []);

  const [kind, setKind] = useState<IncomeKind>(params.get("tur") === "devir" ? "opening_balance" : "other");
  const [amount, setAmount] = useState("");
  const [receivedAt, setReceivedAt] = useState(todayIso());
  const [description, setDescription] = useState("");
  const [amountError, setAmountError] = useState<string>();
  const { submitting, error, run } = useSubmit();

  if (existing.error) return <ErrorState error={existing.error} onRetry={existing.reload} />;
  if (existing.loading || !existing.data) return <Loading />;

  // Kasa devri bir kez girilir; girildiyse seçenek gösterilmez.
  const hasOpeningBalance = existing.data.some((income) => income.kind === "opening_balance");
  const effectiveKind: IncomeKind = hasOpeningBalance ? "other" : kind;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const amountKurus = parseTl(amount);
    if (!amountKurus) {
      setAmountError("Geçerli bir tutar girin. Örnek: 1250 veya 1.250,50");
      return;
    }
    setAmountError(undefined);
    run(async () => {
      await incomeApi.create({
        kind: effectiveKind,
        amountKurus,
        receivedAt,
        description: description.trim() || null,
      });
      navigate("/kasa", { replace: true });
    });
  }

  const fields = error?.fields ?? {};

  return (
    <div className="stack">
      <PageHeader title="Kasaya para ekle" backTo="/kasa" />
      <form className="card stack" onSubmit={handleSubmit}>
        {error && <Alert kind="error">{error.message}</Alert>}
        {hasOpeningBalance ? (
          <Alert kind="info">Kasa devri daha önce girildi. Buradan diğer gelirleri ekleyebilirsiniz.</Alert>
        ) : (
          <Segmented label="Ne ekleniyor" value={kind} options={kindOptions} onChange={setKind} />
        )}
        {effectiveKind === "opening_balance" && (
          <p className="note">
            Sistemi kullanmaya başladığınız gün kasada (veya apartman hesabında) olan para.
            Yalnızca bir kez girilir.
          </p>
        )}
        <Field label="Tutar (TL)" error={amountError ?? fields.amountKurus}>
          <input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="25000" required autoComplete="off" />
        </Field>
        <Field label="Tarih" error={fields.receivedAt}>
          <input type="date" value={receivedAt} max={todayIso()} onChange={(e) => setReceivedAt(e.target.value)} required />
        </Field>
        <Field
          label={effectiveKind === "other" ? "Açıklama" : "Açıklama (isteğe bağlı)"}
          error={fields.description}
          hint={effectiveKind === "other" ? "Örnek: Bağış, çatı katı kirası, banka faizi" : undefined}
        >
          <input value={description} onChange={(e) => setDescription(e.target.value)} maxLength={200} required={effectiveKind === "other"} />
        </Field>
        <button className="btn block" disabled={submitting}>
          {submitting ? "Kaydediliyor…" : "Kaydet"}
        </button>
      </form>
    </div>
  );
}
