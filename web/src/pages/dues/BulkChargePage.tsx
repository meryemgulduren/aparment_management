import { useState } from "react";
import { Link, useSearchParams } from "react-router";
import { chargeApi } from "../../api/endpoints";
import { ChargeForm } from "../../components/ChargeForm";
import { Alert, ErrorState, Loading } from "../../components/Feedback";
import { PageHeader } from "../../components/PageHeader";
import { useAsync, useSubmit } from "../../hooks/useAsync";
import { formatPeriod, periodOrCurrent } from "../../lib/dates";

interface Result {
  period: string;
  created: number;
  skipped: number;
}

/** Tüm dairelere aynı anda borç yazar (her ay aidat için). */
export function BulkChargePage() {
  const [params] = useSearchParams();
  const initialPeriod = periodOrCurrent(params.get("ay"));
  const lastDues = useAsync(() => chargeApi.lastDuesAmount(), []);
  const submit = useSubmit();
  const [result, setResult] = useState<Result | null>(null);

  if (lastDues.error) return <ErrorState error={lastDues.error} onRetry={lastDues.reload} />;
  if (lastDues.loading) return <Loading />;

  // Sonuç gösterildikten sonra form kapanır; ek ödemenin yanlışlıkla iki kez yazılmasını önler.
  if (result) {
    return (
      <div className="stack-lg form-page">
        <PageHeader eyebrow={formatPeriod(result.period)} title="Borç yazıldı" backTo={`/aidat?ay=${result.period}`} />
        <Alert kind="success">
          {result.created} daireye borç yazıldı.
          {result.skipped > 0 && ` ${result.skipped} dairede bu ayın aidatı zaten vardı, atlandı.`}
        </Alert>
        <Link to={`/aidat?ay=${result.period}`} className="btn block">
          {formatPeriod(result.period)} aidat listesine git
        </Link>
      </div>
    );
  }

  return (
    <div className="stack-lg form-page">
      <PageHeader
        eyebrow="Aidat"
        title="Tüm dairelere borç yaz"
        description="Her ayın aidatını veya herkesi ilgilendiren ek ödemeyi tek seferde yazın."
        backTo={`/aidat?ay=${initialPeriod}`}
      />
      <Alert kind="info">
        Aynı ayın aidatı ikinci kez yazılmaz; daha önce yazılan daireler atlanır. Sonradan eklenen
        daireye aidat yazmak için de bu sayfayı kullanabilirsiniz.
      </Alert>
      <ChargeForm
        initialPeriod={initialPeriod}
        suggestedAmountKurus={lastDues.data?.amountKurus}
        submitLabel="Tüm dairelere yaz"
        submitting={submit.submitting}
        error={submit.error}
        onSubmit={(input) =>
          submit.run(async () => {
            const { created, skipped } = await chargeApi.createForAll(input);
            setResult({ period: input.period, created, skipped });
          })
        }
      />
    </div>
  );
}
