// Vercel'in derleme adımı (vercel.json > buildCommand).
// 1. Arayüzü derleyip server/public içine yazar; Vercel bu klasörü CDN'den sunar.
// 2. Yalnızca canlı (production) derlemede veritabanı migration'larını uygular.
//    Önizleme derlemeleri canlı veritabanına dokunmaz.
import { execSync } from "node:child_process";

function run(command, cwd) {
  console.log(`\n> ${command}${cwd ? `  (${cwd})` : ""}`);
  execSync(command, { stdio: "inherit", cwd });
}

run("npm ci", "../web");
run("npm run build:vercel", "../web");

if (process.env.VERCEL_ENV === "production") {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL tanımlı değil. Vercel > Settings > Environment Variables'a ekleyin.");
    process.exit(1);
  }
  run("npx drizzle-kit migrate");
} else {
  console.log(`\nMigration atlandı (ortam: ${process.env.VERCEL_ENV ?? "yerel"}).`);
}
