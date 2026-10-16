import { todayIso } from "../../shared/dates.js";
import { NotFoundError, ValidationError } from "../../shared/errors.js";
import type { ApartmentRepository } from "../apartments/apartment.repository.js";
import type {
  NewPayment,
  Payment,
  PaymentFilter,
  PaymentListItem,
  PaymentRepository,
} from "./payment.repository.js";

// Telefonda uzun liste yerine son kayıtlar gösterilir.
const LIST_LIMIT = 200;

export class PaymentService {
  private readonly payments: PaymentRepository;
  private readonly apartments: Pick<ApartmentRepository, "findById">;
  private readonly today: () => string;

  constructor(
    payments: PaymentRepository,
    apartments: Pick<ApartmentRepository, "findById">,
    today: () => string = () => todayIso(),
  ) {
    this.payments = payments;
    this.apartments = apartments;
    this.today = today;
  }

  async create(data: NewPayment): Promise<Payment> {
    if (data.paidAt > this.today()) {
      throw new ValidationError("Ödeme tarihi ileri bir tarih olamaz.", {
        paidAt: "Ödeme tarihi bugünden sonra olamaz.",
      });
    }
    if (!(await this.apartments.findById(data.apartmentId))) {
      throw new NotFoundError("Daire bulunamadı.");
    }
    return this.payments.create(data);
  }

  list(filter: PaymentFilter): Promise<PaymentListItem[]> {
    return this.payments.list(filter, LIST_LIMIT);
  }

  async delete(id: number): Promise<void> {
    if (!(await this.payments.delete(id))) {
      throw new NotFoundError("Ödeme kaydı bulunamadı.");
    }
  }
}
