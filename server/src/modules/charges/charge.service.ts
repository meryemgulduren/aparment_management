import { ConflictError, NotFoundError } from "../../shared/errors.js";
import type { ApartmentRepository } from "../apartments/apartment.repository.js";
import type { Charge, ChargeRepository, NewCharge } from "./charge.repository.js";

export type BulkChargeData = Omit<NewCharge, "apartmentId">;

export interface BulkChargeResult {
  /** Borç yazılan daire sayısı. */
  created: number;
  /** O ay için aidatı zaten olduğu için atlanan daire sayısı. */
  skipped: number;
}

export class ChargeService {
  private readonly charges: ChargeRepository;
  private readonly apartments: Pick<ApartmentRepository, "findById" | "listIds">;

  constructor(
    charges: ChargeRepository,
    apartments: Pick<ApartmentRepository, "findById" | "listIds">,
  ) {
    this.charges = charges;
    this.apartments = apartments;
  }

  /**
   * Tüm dairelere aynı borcu yazar. Aidatta aynı ay için ikinci kez çalıştırılırsa
   * daha önce yazılmış daireleri atlar; böylece sonradan eklenen daireye
   * aidat yazmak için de aynı işlem güvenle tekrarlanabilir.
   */
  async createForAllApartments(data: BulkChargeData): Promise<BulkChargeResult> {
    const apartmentIds = await this.apartments.listIds();
    if (apartmentIds.length === 0) {
      throw new ConflictError("Henüz daire yok. Önce daireleri ekleyin.");
    }
    const created = await this.charges.createMany(
      apartmentIds.map((apartmentId) => ({ ...data, apartmentId })),
    );
    return { created, skipped: apartmentIds.length - created };
  }

  async create(data: NewCharge): Promise<Charge> {
    if (!(await this.apartments.findById(data.apartmentId))) {
      throw new NotFoundError("Daire bulunamadı.");
    }
    const charge = await this.charges.create(data);
    if (!charge) {
      throw new ConflictError(`Bu daireye ${data.period} dönemi için aidat zaten yazılmış.`);
    }
    return charge;
  }

  async delete(id: number): Promise<void> {
    if (!(await this.charges.delete(id))) {
      throw new NotFoundError("Borç kaydı bulunamadı.");
    }
  }

  /** Borçlandırma formunda önerilecek tutar: en son yazılan aidat. */
  lastDuesAmount(): Promise<number | null> {
    return this.charges.findLastDuesAmount();
  }
}
