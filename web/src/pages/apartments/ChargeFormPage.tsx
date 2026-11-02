import { useNavigate, useParams } from "react-router";
import { apartmentApi, chargeApi } from "../../api/endpoints";
import { ChargeForm } from "../../components/ChargeForm";
import { ErrorState, Loading } from "../../components/Feedback";
import { PageHeader } from "../../components/PageHeader";
import { useAsync, useSubmit } from "../../hooks/useAsync";

/** Tek bir daireye borç yazar (sonradan taşınan daireye aidat, kişisel tamir masrafı vb.). */
export function ChargeFormPage() {
  const apartmentId = Number(useParams().id);
  const navigate = useNavigate();
  const { data, error, loading, reload } = useAsync(
    () => Promise.all([apartmentApi.get(apartmentId), chargeApi.lastDuesAmount()]),
    [apartmentId],
  );
  const submit = useSubmit();

  if (error) return <ErrorState error={error} onRetry={reload} />;
  if (loading || !data) return <Loading />;
  const [apartment, lastDues] = data;
  const backTo = `/daireler/${apartmentId}`;

  return (
    <div className="stack-lg form-page">
      <PageHeader
        eyebrow={`Daire ${apartment.label}`}
        title="Borç ekle"
        description="Yalnızca bu daireye borç yazar. Tüm dairelere aidat için Aidat sayfasını kullanın."
        backTo={backTo}
      />
      <ChargeForm
        suggestedAmountKurus={lastDues.amountKurus}
        submitLabel="Borcu yaz"
        submitting={submit.submitting}
        error={submit.error}
        onSubmit={(input) =>
          submit.run(async () => {
            await chargeApi.create(apartmentId, input);
            navigate(backTo, { replace: true });
          })
        }
      />
    </div>
  );
}
