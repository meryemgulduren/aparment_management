import { useState } from "react";
import { Link } from "react-router";
import { apartmentApi } from "../../api/endpoints";
import type { ApartmentListItem } from "../../api/types";
import { Balance } from "../../components/Display";
import { EmptyState, ErrorState, Loading } from "../../components/Feedback";
import { Icon } from "../../components/Icon";
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

  if (error) return <ErrorState error={error} onRetry={reload} />;

  const apartments = (data ?? []).filter((apartment) => matches(apartment, search));
  const people = (data ?? []).reduce((total, apartment) => total + apartment.householdSize, 0);

  return (
    <div className="stack-lg">
      <PageHeader
        eyebrow={data ? `${data.length} daire · ${people} kişi` : "Daireler"}
        title="Daireler"
        description="Kapı numarasına dokunarak sakinleri, borçları ve ödemeleri görün."
        actions={<Link to="/daireler/yeni" className="btn"><Icon name="plus" /> Daire ekle</Link>}
      />
      {data && data.length > 5 && (
        <input
          id="apartment-search"
          type="search"
          placeholder="Kapı numarası veya isimle ara"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Daire ara"
        />
      )}
      {loading && !data ? (
        <Loading />
      ) : data?.length === 0 ? (
        <EmptyState>
          Henüz daire eklenmemiş.
          <Link to="/daireler/yeni" className="btn"><Icon name="plus" /> İlk daireyi ekle</Link>
        </EmptyState>
      ) : apartments.length === 0 ? (
        <EmptyState>Aramaya uyan daire yok.</EmptyState>
      ) : (
        <ul className="list tiles">
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
                    {apartment.floor !== null ? `${apartment.floor === 0 ? "Zemin" : `${apartment.floor}.`} kat · ` : ""}
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
