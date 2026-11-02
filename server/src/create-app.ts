import { existsSync } from "node:fs";
import { extname } from "node:path";
import { fileURLToPath } from "node:url";
import cookieParser from "cookie-parser";
import express, { type Express } from "express";
import helmet from "helmet";
import { sql } from "drizzle-orm";
import type { Database } from "./db/index.js";
import { apiNotFound, errorHandler } from "./middleware/error-handler.js";
import { requireAuth } from "./middleware/require-auth.js";
import { DrizzleApartmentRepository } from "./modules/apartments/apartment.repository.js";
import { createApartmentRouter } from "./modules/apartments/apartment.routes.js";
import { ApartmentService } from "./modules/apartments/apartment.service.js";
import { DrizzleAuthRepository } from "./modules/auth/auth.repository.js";
import { createAuthRouter } from "./modules/auth/auth.routes.js";
import { AuthService } from "./modules/auth/auth.service.js";
import { DrizzleAttemptStore } from "./modules/auth/login-attempt.repository.js";
import { LoginLimiter } from "./modules/auth/login-limiter.js";
import { DrizzleChargeRepository } from "./modules/charges/charge.repository.js";
import { createChargeRouter } from "./modules/charges/charge.routes.js";
import { ChargeService } from "./modules/charges/charge.service.js";
import { DrizzleExpenseRepository } from "./modules/expenses/expense.repository.js";
import { createExpenseRouter } from "./modules/expenses/expense.routes.js";
import { ExpenseService } from "./modules/expenses/expense.service.js";
import { DrizzleIncomeRepository } from "./modules/incomes/income.repository.js";
import { createIncomeRouter } from "./modules/incomes/income.routes.js";
import { IncomeService } from "./modules/incomes/income.service.js";
import { DrizzlePaymentRepository } from "./modules/payments/payment.repository.js";
import { createPaymentRouter } from "./modules/payments/payment.routes.js";
import { PaymentService } from "./modules/payments/payment.service.js";
import { createReportRouter } from "./modules/reports/report.routes.js";
import { ReportService } from "./modules/reports/report.service.js";
import { DrizzleResidentRepository } from "./modules/residents/resident.repository.js";
import { createResidentRouter } from "./modules/residents/resident.routes.js";
import { ResidentService } from "./modules/residents/resident.service.js";

export interface AppOptions {
  db: Database;
  secureCookie: boolean;
  trustProxy: boolean;
}

// Derlenmiş arayüz (web/dist) varsa aynı sunucudan verilir. Tarayıcı ve API aynı
// adreste olduğu için çerez ve CORS ayarı gerekmez.
const webDist = fileURLToPath(new URL("../../web/dist", import.meta.url));

/**
 * Uygulamanın kurulduğu tek yer ("composition root"): repository'ler, servisler
 * ve route'lar burada birbirine bağlanır. Diğer dosyalar birbirini oluşturmaz,
 * yalnızca ihtiyaç duyduğu şeyi parametre olarak alır.
 */
export function createApp({ db, secureCookie, trustProxy }: AppOptions): Express {
  // Repository'ler: veritabanına erişen tek katman.
  const apartmentRepository = new DrizzleApartmentRepository(db);
  const residentRepository = new DrizzleResidentRepository(db);
  const chargeRepository = new DrizzleChargeRepository(db);
  const paymentRepository = new DrizzlePaymentRepository(db);
  const expenseRepository = new DrizzleExpenseRepository(db);
  const incomeRepository = new DrizzleIncomeRepository(db);

  // Servisler: iş kuralları.
  const authService = new AuthService(new DrizzleAuthRepository(db));
  const apartmentService = new ApartmentService(apartmentRepository, residentRepository);
  const residentService = new ResidentService(residentRepository, apartmentRepository);
  const chargeService = new ChargeService(chargeRepository, apartmentRepository);
  const paymentService = new PaymentService(paymentRepository, apartmentRepository);
  const expenseService = new ExpenseService(expenseRepository);
  const incomeService = new IncomeService(incomeRepository);
  const reportService = new ReportService({
    apartments: apartmentRepository,
    residents: residentRepository,
    charges: chargeRepository,
    payments: paymentRepository,
    expenses: expenseRepository,
    incomes: incomeRepository,
  });

  const app = express();
  app.set("trust proxy", trustProxy);
  app.disable("x-powered-by");
  app.use(
    helmet({
      // HTTPS yokken (geliştirme, ev ağında telefondan deneme) tarayıcıya "her şeyi
      // HTTPS'ten yükle" denirse sayfa açılmaz; bu iki ayar yalnızca üretimde açık.
      contentSecurityPolicy: {
        directives: { upgradeInsecureRequests: secureCookie ? [] : null },
      },
      strictTransportSecurity: secureCookie,
    }),
  );
  app.use(express.json({ limit: "100kb" }));
  app.use(cookieParser());

  app.get("/health", async (_req, res) => {
    try {
      await db.execute(sql`select 1`);
      res.json({ status: "ok", database: "up" });
    } catch (error) {
      console.error("Veritabanına ulaşılamadı:", error);
      res.status(503).json({ status: "error", database: "down" });
    }
  });

  // Giriş gerektirmeyen tek API bölümü.
  app.use("/api/auth", createAuthRouter(authService, new LoginLimiter(new DrizzleAttemptStore(db)), { secureCookie }));

  // Bu satırdan sonraki tüm /api adresleri oturum ister.
  app.use("/api", requireAuth(authService));
  app.use("/api/apartments", createApartmentRouter(apartmentService));
  app.use("/api/residents", createResidentRouter(residentService));
  app.use("/api/charges", createChargeRouter(chargeService));
  app.use("/api/payments", createPaymentRouter(paymentService));
  app.use("/api/expenses", createExpenseRouter(expenseService));
  app.use("/api/incomes", createIncomeRouter(incomeService));
  app.use("/api/reports", createReportRouter(reportService));
  app.use("/api", apiNotFound);

  if (existsSync(webDist)) {
    app.use(express.static(webDist));
    // Arayüzün kendi adresleri (/daireler/5 gibi) için index.html döner. Uzantılı
    // adresler (eksik bir .js dosyası gibi) gerçek 404 alır.
    app.get("/{*path}", (req, res, next) => {
      if (extname(req.path)) return next();
      res.sendFile("index.html", { root: webDist });
    });
  }

  app.use(errorHandler);
  return app;
}
