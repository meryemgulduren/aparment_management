import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router";
import { apartmentApi, residentApi } from "../../api/endpoints";
import type { ResidentKind } from "../../api/types";
import { Alert, ErrorState, Loading } from "../../components/Feedback";
import { Field, Segmented } from "../../components/Form";
import { PageHeader } from "../../components/PageHeader";
import { toApiError, useAsync, useSubmit } from "../../hooks/useAsync";
import { residentKindLabels } from "../../lib/labels";

const kindOptions = (Object.keys(residentKindLabels) as ResidentKind[]).map((value) => ({
  value,
  label: residentKindLabels[value],
}));

/** Yeni sakin (/daireler/:id/sakin-ekle) ve düzenleme (/daireler/:id/sakinler/:residentId). */
export function ResidentFormPage() {
  const params = useParams();
  const apartmentId = Number(params.id);
  const residentId = params.residentId ? Number(params.residentId) : null;
  const navigate = useNavigate();
  const backTo = `/daireler/${apartmentId}`;

  const apartment = useAsync(() => apartmentApi.get(apartmentId), [apartmentId]);
  const resident = apartment.data?.residents.find((r) => r.id === residentId);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [kind, setKind] = useState<ResidentKind>("owner");
  const [note, setNote] = useState("");
  const [isActive, setIsActive] = useState(true);
  const { submitting, error, setError, run } = useSubmit();

  useEffect(() => {
    if (!resident) return;
    setFullName(resident.fullName);
    setPhone(resident.phone ?? "");
    setKind(resident.kind);
    setNote(resident.note ?? "");
    setIsActive(resident.isActive);
  }, [resident]);

  if (apartment.error) return <ErrorState error={apartment.error} onRetry={apartment.reload} />;
  if (apartment.loading && !apartment.data) return <Loading />;
  if (residentId && !resident) return <Alert kind="error">Sakin bulunamadı.</Alert>;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const data = { fullName: fullName.trim(), phone: phone.trim() || null, kind, note: note.trim() || null };
    run(async () => {
      if (residentId) {
        await residentApi.update(residentId, { ...data, isActive });
      } else {
        await residentApi.create(apartmentId, data);
      }
      navigate(backTo, { replace: true });
    });
  }

  async function handleDelete() {
    if (!residentId || !window.confirm(`${fullName} kaydı tamamen silinsin mi?`)) return;
    try {
      await residentApi.delete(residentId);
      navigate(backTo, { replace: true });
    } catch (caught) {
      setError(toApiError(caught));
    }
  }

  const fields = error?.fields ?? {};
  const label = apartment.data?.label ?? "";

  return (
    <div className="stack">
      <PageHeader title={residentId ? "Sakin bilgileri" : `Daire ${label} · yeni sakin`} backTo={backTo} />
      <form className="card stack" onSubmit={handleSubmit}>
        {error && <Alert kind="error">{error.message}</Alert>}
        <Field label="Ad soyad" error={fields.fullName}>
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} required minLength={2} maxLength={100} autoComplete="off" />
        </Field>
        <Segmented label="Durumu" value={kind} options={kindOptions} onChange={setKind} />
        <Field label="Telefon" error={fields.phone}>
          <input type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={20} placeholder="0532 123 45 67" autoComplete="off" />
        </Field>
        <Field label="Not" error={fields.note}>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} />
        </Field>
        {residentId && (
          <label className="checkbox">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            Hâlâ bu dairede oturuyor
          </label>
        )}
        <button className="btn block" disabled={submitting}>
          {submitting ? "Kaydediliyor…" : "Kaydet"}
        </button>
      </form>
      {residentId && (
        <>
          <p className="note">
            Taşınan kişiyi silmek yerine "Hâlâ bu dairede oturuyor" işaretini kaldırın; geçmiş kaybolmaz.
            Silme yalnızca yanlış girilen kayıtlar içindir.
          </p>
          <button type="button" className="btn danger block" onClick={handleDelete}>
            Kaydı sil
          </button>
        </>
      )}
    </div>
  );
}
