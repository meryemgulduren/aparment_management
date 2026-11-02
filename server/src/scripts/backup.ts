// Veritabanındaki tüm apartman kayıtlarını tarihli bir JSON dosyasına yazar.
// Kullanım (server klasöründe): npm run backup
// Canlı veritabanının yedeği için DATABASE_URL önce canlı adrese ayarlanır (bkz. DEPLOY.md).
//
// Oturumlar ve giriş denemeleri geçici bilgi olduğu için yedeğe alınmaz.
// Kullanıcıların şifre özetleri de alınmaz; hesap gerekirse `npm run admin` ile yeniden açılır.
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { db, pool } from "../db/index.js";
import { apartments, charges, expenses, incomes, payments, residents, users } from "../db/schema.js";

const backupDir = fileURLToPath(new URL("../../../backups/", import.meta.url));

async function main() {
  const [apartmentRows, residentRows, chargeRows, paymentRows, expenseRows, incomeRows, userRows] =
    await Promise.all([
      db.select().from(apartments),
      db.select().from(residents),
      db.select().from(charges),
      db.select().from(payments),
      db.select().from(expenses),
      db.select().from(incomes),
      db.select({ id: users.id, username: users.username, createdAt: users.createdAt }).from(users),
    ]);

  const backup = {
    createdAt: new Date().toISOString(),
    note: "Tutarlar kuruş cinsindendir (125050 = 1.250,50 TL).",
    tables: {
      apartments: apartmentRows,
      residents: residentRows,
      charges: chargeRows,
      payments: paymentRows,
      expenses: expenseRows,
      incomes: incomeRows,
      users: userRows,
    },
  };

  const stamp = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Istanbul",
    dateStyle: "short",
    timeStyle: "short",
  })
    .format(new Date())
    .replace(" ", "_")
    .replace(":", "-");
  mkdirSync(backupDir, { recursive: true });
  const file = `${backupDir}yedek-${stamp}.json`;
  writeFileSync(file, JSON.stringify(backup, null, 2), "utf8");

  const counts = Object.entries(backup.tables).map(([name, rows]) => `${name}: ${rows.length}`);
  console.log(`Yedek yazıldı: ${file}\n${counts.join(", ")}`);
}

try {
  await main();
} catch (error) {
  console.error("Yedek alınamadı:", error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
