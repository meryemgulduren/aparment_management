import { todayIso } from "../../shared/dates.js";
import { NotFoundError, ValidationError } from "../../shared/errors.js";
import type { Expense, ExpenseRepository, NewExpense } from "./expense.repository.js";

const LIST_LIMIT = 200;

export class ExpenseService {
  private readonly expenses: ExpenseRepository;
  private readonly today: () => string;

  constructor(expenses: ExpenseRepository, today: () => string = () => todayIso()) {
    this.expenses = expenses;
    this.today = today;
  }

  create(data: NewExpense): Promise<Expense> {
    if (data.spentAt > this.today()) {
      throw new ValidationError("Gider tarihi ileri bir tarih olamaz.", {
        spentAt: "Gider tarihi bugünden sonra olamaz.",
      });
    }
    return this.expenses.create(data);
  }

  list(period?: string): Promise<Expense[]> {
    return this.expenses.list(period, LIST_LIMIT);
  }

  async delete(id: number): Promise<void> {
    if (!(await this.expenses.delete(id))) {
      throw new NotFoundError("Gider kaydı bulunamadı.");
    }
  }
}
