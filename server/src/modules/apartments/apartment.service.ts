import { ConflictError, NotFoundError } from "../../shared/errors.js";
import type { Resident, ResidentRepository } from "../residents/resident.repository.js";
import type {
  Apartment,
  ApartmentChanges,
  ApartmentRepository,
  ApartmentWithBalance,
  NewApartment,
} from "./apartment.repository.js";

export type ResidentSummary = Pick<Resident, "id" | "fullName" | "kind" | "phone">;

export interface ApartmentListItem extends ApartmentWithBalance {
  activeResidents: ResidentSummary[];
}

export interface ApartmentDetail extends Apartment {
  residents: Resident[];
}

// "2", "10", "3A" gibi kapı numaralarını insanın beklediği sırada dizer (10, 2'den sonra gelir).
const labelCollator = new Intl.Collator("tr", { numeric: true, sensitivity: "base" });

export function compareApartmentLabels(a: { label: string }, b: { label: string }): number {
  return labelCollator.compare(a.label, b.label);
}

export class ApartmentService {
  private readonly apartments: ApartmentRepository;
  private readonly residents: ResidentRepository;

  constructor(apartments: ApartmentRepository, residents: ResidentRepository) {
    this.apartments = apartments;
    this.residents = residents;
  }

  async list(): Promise<ApartmentListItem[]> {
    const [apartments, activeResidents] = await Promise.all([
      this.apartments.listWithBalances(),
      this.residents.listActive(),
    ]);

    const residentsByApartment = new Map<number, ResidentSummary[]>();
    for (const { id, fullName, kind, phone, apartmentId } of activeResidents) {
      const list = residentsByApartment.get(apartmentId) ?? [];
      list.push({ id, fullName, kind, phone });
      residentsByApartment.set(apartmentId, list);
    }

    return apartments
      .map((apartment) => ({
        ...apartment,
        activeResidents: residentsByApartment.get(apartment.id) ?? [],
      }))
      .sort(compareApartmentLabels);
  }

  async get(id: number): Promise<ApartmentDetail> {
    const apartment = await this.getOrThrow(id);
    const residents = await this.residents.listByApartment(id);
    return { ...apartment, residents };
  }

  async getOrThrow(id: number): Promise<Apartment> {
    const apartment = await this.apartments.findById(id);
    if (!apartment) {
      throw new NotFoundError("Daire bulunamadı.");
    }
    return apartment;
  }

  async create(data: NewApartment): Promise<Apartment> {
    await this.assertLabelFree(data.label);
    return this.apartments.create(data);
  }

  async update(id: number, changes: ApartmentChanges): Promise<Apartment> {
    const current = await this.getOrThrow(id);
    if (Object.keys(changes).length === 0) {
      return current;
    }
    if (changes.label !== undefined && changes.label !== current.label) {
      await this.assertLabelFree(changes.label);
    }
    return (await this.apartments.update(id, changes)) ?? current;
  }

  async delete(id: number): Promise<void> {
    await this.getOrThrow(id);
    // Geçmiş kayıtları olan daire silinirse borç/ödeme geçmişi kaybolur.
    if (await this.apartments.hasLinkedRecords(id)) {
      throw new ConflictError(
        "Bu dairenin sakin, borç veya ödeme kaydı var. Silmek için önce bu kayıtları silin.",
      );
    }
    await this.apartments.delete(id);
  }

  private async assertLabelFree(label: string): Promise<void> {
    if (await this.apartments.findByLabel(label)) {
      throw new ConflictError(`"${label}" kapı numaralı daire zaten kayıtlı.`);
    }
  }
}
