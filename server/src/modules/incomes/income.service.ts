import { todayIso } from "../../shared/dates.js";
import { ConflictError, NotFoundError, ValidationError } from "../../shared/errors.js";
import type { Income, IncomeRepository, NewIncome } from "./income.repository.js";

const LIST_LIMIT = 200;

export class IncomeService {
  private readonly incomes: IncomeRepository;
  private readonly today: () => string;

  constructor(incomes: IncomeRepository, today: () => string = () => todayIso()) {
    this.incomes = incomes;
    this.today = today;
  }

  async create(data: NewIncome): Promise<Income> {
    if (data.receivedAt > this.today()) {
      throw new ValidationError("Tarih ileri bir tarih olamaz.", {
        receivedAt: "Tarih bugünden sonra olamaz.",
      });
    }
    const income = await this.incomes.create(data);
    if (!income) {
      throw new ConflictError(
        "Kasa devri zaten girilmiş. Değiştirmek için önce mevcut kaydı silin.",
      );
    }
    return income;
  }

  list(): Promise<Income[]> {
    return this.incomes.list(LIST_LIMIT);
  }

  async delete(id: number): Promise<void> {
    if (!(await this.incomes.delete(id))) {
      throw new NotFoundError("Kayıt bulunamadı.");
    }
  }
}
