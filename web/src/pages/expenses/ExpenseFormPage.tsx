import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { expenseApi } from "../../api/endpoints";
import type { ExpenseCategory } from "../../api/types";
import { Alert } from "../../components/Feedback";
import { Field } from "../../components/Form";
import { PageHeader } from "../../components/PageHeader";
import { useSubmit } from "../../hooks/useAsync";
import { todayIso } from "../../lib/dates";
import { expenseCategoryLabels } from "../../lib/labels";
import { parseTl } from "../../lib/money";

export function ExpenseFormPage() {
  const navigate = useNavigate();
  const [category, setCategory] = useState<ExpenseCategory | "">("");
  const [amount, setAmount] = useState("");
  const [spentAt, setSpentAt] = useState(todayIso());
  const [description, setDescription] = useState("");
  const [amountError, setAmountError] = useState<string>();
  const { submitting, error, run } = useSubmit();

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const amountKurus = parseTl(amount);
    if (!amountKurus) {
      setAmountError("Geçerli bir tutar girin. Örnek: 1250 veya 1.250,50");
      return;
    }
    if (!category) return;
    setAmountError(undefined);
    run(async () => {
      await expenseApi.create({ category, amountKurus, spentAt, description: description.trim() || null });
      navigate(`/giderler?ay=${spentAt.slice(0, 7)}`, { replace: true });
    });
  }

  const fields = error?.fields ?? {};

  return (
    <div className="stack">
      <PageHeader title="Gider ekle" backTo="/giderler" />
      <form className="card stack" onSubmit={handleSubmit}>
        {error && <Alert kind="error">{error.message}</Alert>}
        <Field label="Ne için" error={fields.category}>
          <select value={category} onChange={(e) => setCategory(e.target.value as ExpenseCategory)} required>
            <option value="" disabled>Seçin</option>
            {(Object.keys(expenseCategoryLabels) as ExpenseCategory[]).map((value) => (
              <option key={value} value={value}>{expenseCategoryLabels[value]}</option>
            ))}
          </select>
        </Field>
        <Field label="Tutar (TL)" error={amountError ?? fields.amountKurus}>
          <input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="450" required autoComplete="off" />
        </Field>
        <Field label="Tarih" error={fields.spentAt}>
          <input type="date" value={spentAt} max={todayIso()} onChange={(e) => setSpentAt(e.target.value)} required />
        </Field>
        <Field label="Açıklama" error={fields.description}>
          <input value={description} onChange={(e) => setDescription(e.target.value)} maxLength={200} placeholder="Örnek: Ekim ortak alan elektrik faturası" />
        </Field>
        <button className="btn block" disabled={submitting}>
          {submitting ? "Kaydediliyor…" : "Gideri kaydet"}
        </button>
      </form>
    </div>
  );
}
