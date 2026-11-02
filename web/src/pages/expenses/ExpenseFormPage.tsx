import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
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
    <div className="stack-lg form-page">
      <PageHeader eyebrow="Giderler" title="Gider ekle" description="Kasadan çıkan her harcamayı kaydedin." backTo="/giderler" />
      <form className="card stack" onSubmit={handleSubmit}>
        {error && <Alert kind="error">{error.message}</Alert>}
        <Field label="Ne için" error={fields.category}>
          <select id="expense-category" value={category} onChange={(e) => setCategory(e.target.value as ExpenseCategory)} required>
            <option value="" disabled>Seçin</option>
            {(Object.keys(expenseCategoryLabels) as ExpenseCategory[]).map((value) => (
              <option key={value} value={value}>{expenseCategoryLabels[value]}</option>
            ))}
          </select>
        </Field>
        <div className="form-grid cols-2">
          <Field label="Tutar (TL)" error={amountError ?? fields.amountKurus}>
            <input id="expense-amount" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="450" required autoComplete="off" />
          </Field>
          <Field label="Tarih" error={fields.spentAt}>
            <input id="expense-date" type="date" value={spentAt} max={todayIso()} onChange={(e) => setSpentAt(e.target.value)} required />
          </Field>
        </div>
        <Field label="Açıklama" error={fields.description}>
          <input id="expense-description" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={200} placeholder="Örnek: Ekim ortak alan elektrik faturası" />
        </Field>
        <div className="form-actions">
          <Link to="/giderler" className="btn secondary">Vazgeç</Link>
          <button className="btn" disabled={submitting}>{submitting ? "Kaydediliyor…" : "Gideri kaydet"}</button>
        </div>
      </form>
    </div>
  );
}
