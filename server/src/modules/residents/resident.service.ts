import { NotFoundError } from "../../shared/errors.js";
import type { ApartmentRepository } from "../apartments/apartment.repository.js";
import type {
  NewResident,
  Resident,
  ResidentChanges,
  ResidentRepository,
} from "./resident.repository.js";

export class ResidentService {
  private readonly residents: ResidentRepository;
  private readonly apartments: Pick<ApartmentRepository, "findById">;

  constructor(residents: ResidentRepository, apartments: Pick<ApartmentRepository, "findById">) {
    this.residents = residents;
    this.apartments = apartments;
  }

  async create(data: NewResident): Promise<Resident> {
    if (!(await this.apartments.findById(data.apartmentId))) {
      throw new NotFoundError("Daire bulunamadı.");
    }
    return this.residents.create(data);
  }

  async update(id: number, changes: ResidentChanges): Promise<Resident> {
    const current = await this.getOrThrow(id);
    if (Object.keys(changes).length === 0) {
      return current;
    }
    return (await this.residents.update(id, changes)) ?? current;
  }

  /** Yanlış girilen kayıt içindir. Taşınan sakin silinmez, pasife alınır. */
  async delete(id: number): Promise<void> {
    if (!(await this.residents.delete(id))) {
      throw new NotFoundError("Sakin bulunamadı.");
    }
  }

  private async getOrThrow(id: number): Promise<Resident> {
    const resident = await this.residents.findById(id);
    if (!resident) {
      throw new NotFoundError("Sakin bulunamadı.");
    }
    return resident;
  }
}
