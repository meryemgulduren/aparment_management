import { useState } from "react";
import { Link } from "react-router";
import { apartmentApi } from "../../api/endpoints";
import type { ApartmentListItem } from "../../api/types";
import { Balance } from "../../components/Display";
import { EmptyState, ErrorState, Loading } from "../../components/Feedback";
import { PageHeader } from "../../components/PageHeader";
import { useAsync } from "../../hooks/useAsync";

function matches(apartment: ApartmentListItem, search: string): boolean {
  const needle = search.trim().toLocaleLowerCase("tr");
  if (!needle) return true;
  return [apartment.label, ...apartment.activeResidents.map((r) => r.fullName)].some((text) =>
    text.toLocaleLowerCase("tr").includes(needle),
  );
}

export function ApartmentsPage() {
  const { data, error, loading, reload } = useAsync(() => apartmentApi.list(), []);
  const [search, setSearch] = useState("");

  const action = (
    <Link to="/daireler/yeni" className="btn small">+ Daire</Link>
  );

  if (error) return <ErrorState error={error} onRetry={reload} />;

  const apartments = (data ?? []).filter((apartment) => matches(apartment, search));

  return (
    <div className="stack">
      <PageHeader title="Daireler" action={action} />
      {data && data.length > 5 && (
        <input
          type="search"
          placeholder="Kapı no veya isim ara"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Ara"
        />
      )}
      {loading && !data ? (
        <Loading />
      ) : data?.length === 0 ? (
        <EmptyState>
          Henüz daire eklenmemiş.
          <br />
          <Link to="/daireler/yeni" className="btn">İlk daireyi ekle</Link>
        </EmptyState>
      ) : apartments.length === 0 ? (
        <EmptyState>Aramaya uyan daire yok.</EmptyState>
      ) : (
        <ul className="list">
          {apartments.map((apartment) => (
            <li key={apartment.id}>
              <Link to={`/daireler/${apartment.id}`} className="list-item">
                <span className="door">{apartment.label}</span>
                <span className="grow">
                  <span className="title">
                    {apartment.activeResidents.map((r) => r.fullName).join(", ") || "Sakin kaydı yok"}
                  </span>
                  <br />
                  <span className="sub">
                    {apartment.floor !== null ? `${apartment.floor}. kat · ` : ""}
                    {apartment.householdSize} kişi
                  </span>
                </span>
                <Balance kurus={apartment.balanceKurus} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
