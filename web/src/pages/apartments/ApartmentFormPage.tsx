import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router";
import { apartmentApi } from "../../api/endpoints";
import { Alert, ErrorState, Loading } from "../../components/Feedback";
import { Field } from "../../components/Form";
import { PageHeader } from "../../components/PageHeader";
import { useAsync, useSubmit } from "../../hooks/useAsync";

/** Hem yeni daire (/daireler/yeni) hem düzenleme (/daireler/:id/duzenle) için. */
export function ApartmentFormPage() {
  const { id } = useParams();
  const apartmentId = id ? Number(id) : null;
  const navigate = useNavigate();

  const existing = useAsync(
    () => (apartmentId ? apartmentApi.get(apartmentId) : Promise.resolve(null)),
    [apartmentId],
  );

  const [label, setLabel] = useState("");
  const [floor, setFloor] = useState("");
  const [householdSize, setHouseholdSize] = useState("0");
  const [note, setNote] = useState("");
  const { submitting, error, run } = useSubmit();

  // Düzenlemede mevcut değerleri forma yerleştir.
  useEffect(() => {
    const apartment = existing.data;
    if (!apartment) return;
    setLabel(apartment.label);
    setFloor(apartment.floor === null ? "" : String(apartment.floor));
    setHouseholdSize(String(apartment.householdSize));
    setNote(apartment.note ?? "");
  }, [existing.data]);

  if (existing.error) return <ErrorState error={existing.error} onRetry={existing.reload} />;
  if (apartmentId && existing.loading) return <Loading />;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const data = {
      label: label.trim(),
      floor: floor.trim() === "" ? null : Number(floor),
      householdSize: Number(householdSize || 0),
      note: note.trim() || null,
    };
    run(async () => {
      const saved = apartmentId
        ? await apartmentApi.update(apartmentId, data)
        : await apartmentApi.create(data);
      navigate(`/daireler/${saved.id}`, { replace: true });
    });
  }

  const fields = error?.fields ?? {};

  return (
    <div className="stack">
      <PageHeader
        title={apartmentId ? `Daire ${existing.data?.label ?? ""} düzenle` : "Yeni daire"}
        backTo={apartmentId ? `/daireler/${apartmentId}` : "/daireler"}
      />
      <form className="card stack" onSubmit={handleSubmit}>
        {error && <Alert kind="error">{error.message}</Alert>}
        <Field label="Kapı numarası" error={fields.label} hint='Örnek: 5, 12, 3A'>
          <input value={label} onChange={(e) => setLabel(e.target.value)} required maxLength={20} autoFocus={!apartmentId} />
        </Field>
        <Field label="Kat" error={fields.floor} hint="Zemin kat için 0, bodrum için -1">
          <input type="number" inputMode="numeric" value={floor} onChange={(e) => setFloor(e.target.value)} min={-5} max={100} />
        </Field>
        <Field label="Oturan kişi sayısı" error={fields.householdSize} hint="Boş daire için 0">
          <input type="number" inputMode="numeric" value={householdSize} onChange={(e) => setHouseholdSize(e.target.value)} min={0} max={50} required />
        </Field>
        <Field label="Not" error={fields.note}>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} />
        </Field>
        <button className="btn block" disabled={submitting}>
          {submitting ? "Kaydediliyor…" : "Kaydet"}
        </button>
      </form>
    </div>
  );
}
