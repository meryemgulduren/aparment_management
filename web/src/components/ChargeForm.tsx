import { useState, type FormEvent } from "react";
import type { ApiError } from "../api/client";
import type { ChargeInput } from "../api/endpoints";
import type { ChargeKind } from "../api/types";
import { currentPeriod, dayOfPeriod } from "../lib/dates";
import { kurusToInput, parseTl } from "../lib/money";
import { Alert } from "./Feedback";
import { Field, Segmented } from "./Form";
import { MonthSwitcher } from "./MonthSwitcher";

const DEFAULT_DUE_DAY = 10;

interface ChargeFormProps {
  /** Formda önerilecek tutar (son aidat). */
  suggestedAmountKurus?: number | null;
  initialPeriod?: string;
  submitLabel: string;
  submitting: boolean;
  error: ApiError | null;
  onSubmit(data: ChargeInput): void;
}

/** Borç yazma formu. Tek daire ve toplu borçlandırma sayfaları ortak kullanır. */
export function ChargeForm({
  suggestedAmountKurus,
  initialPeriod = currentPeriod(),
  submitLabel,
  submitting,
  error,
  onSubmit,
}: ChargeFormProps) {
  const [kind, setKind] = useState<ChargeKind>("dues");
  const [period, setPeriod] = useState(initialPeriod);
  const [amount, setAmount] = useState(suggestedAmountKurus ? kurusToInput(suggestedAmountKurus) : "");
  const [dueDate, setDueDate] = useState(dayOfPeriod(initialPeriod, DEFAULT_DUE_DAY));
  const [description, setDescription] = useState("");
  const [amountError, setAmountError] = useState<string>();

  function changePeriod(next: string) {
    setPeriod(next);
    // Son ödeme gününü koruyarak yeni aya taşı.
    setDueDate(dayOfPeriod(next, Number(dueDate.slice(8, 10)) || DEFAULT_DUE_DAY));
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const amountKurus = parseTl(amount);
    if (!amountKurus) {
      setAmountError("Geçerli bir tutar girin. Örnek: 1250 veya 1.250,50");
      return;
    }
    setAmountError(undefined);
    onSubmit({ kind, period, amountKurus, dueDate, description: description.trim() || null });
  }

  const fields = error?.fields ?? {};

  return (
    <form className="card stack" onSubmit={handleSubmit}>
      {error && <Alert kind="error">{error.message}</Alert>}
      <Segmented
        label="Borç türü"
        value={kind}
        options={[
          { value: "dues", label: "Aidat" },
          { value: "extra", label: "Ek ödeme" },
        ]}
        onChange={setKind}
      />
      <div className="field">
        <span>Hangi ay</span>
        <MonthSwitcher period={period} onChange={changePeriod} />
      </div>
      {kind === "extra" && (
        <Field label="Açıklama" error={fields.description} hint="Örnek: Asansör tamiri, çatı onarımı">
          <input value={description} onChange={(e) => setDescription(e.target.value)} maxLength={200} required />
        </Field>
      )}
      <Field label="Tutar (TL)" error={amountError ?? fields.amountKurus}>
        <input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="1250" required autoComplete="off" />
      </Field>
      <Field label="Son ödeme tarihi" error={fields.dueDate}>
        <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />
      </Field>
      <button className="btn block" disabled={submitting}>
        {submitting ? "Kaydediliyor…" : submitLabel}
      </button>
    </form>
  );
}
