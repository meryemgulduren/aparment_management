// Yönetici hesabı oluşturur ya da var olan hesabın şifresini değiştirir.
// Kullanım (server klasöründe): npm run admin
//
// Uygulamada "kayıt ol" sayfası bilerek yok: hesap yalnızca sunucuya erişimi olan
// kişi tarafından bu komutla açılabilir.
import { createInterface } from "node:readline";
import { Writable } from "node:stream";
import { pool, db } from "../db/index.js";
import { DrizzleAuthRepository } from "../modules/auth/auth.repository.js";
import { AuthService } from "../modules/auth/auth.service.js";
import { AppError } from "../shared/errors.js";

// Şifre yazılırken ekrana basılmasın diye çıktıyı geçici olarak susturan akış.
let muted = false;
const output = new Writable({
  write(chunk, _encoding, callback) {
    if (!muted) {
      process.stdout.write(chunk);
    }
    callback();
  },
});
const rl = createInterface({ input: process.stdin, output, terminal: process.stdin.isTTY });
// Satırları sırayla okur; girdi önceden gelmişse (ör. yönlendirme ile) kaybolmaz.
const lines = rl[Symbol.asyncIterator]();

async function ask(prompt: string, hidden = false): Promise<string> {
  process.stdout.write(prompt);
  muted = hidden;
  const { value, done } = await lines.next();
  muted = false;
  if (hidden) {
    process.stdout.write("\n");
  }
  if (done) {
    throw new AppError(400, "Girdi beklenmeden bitti.");
  }
  return value;
}

async function main() {
  const username = (await ask("Kullanıcı adı: ")).trim().toLowerCase();
  const password = await ask("Şifre (en az 10 karakter): ", true);
  const repeated = await ask("Şifre (tekrar): ", true);
  if (password !== repeated) {
    throw new AppError(400, "Şifreler aynı değil.");
  }

  const result = await new AuthService(new DrizzleAuthRepository(db)).upsertUser(username, password);
  console.log(
    result === "created"
      ? `"${username}" kullanıcısı oluşturuldu.`
      : `"${username}" kullanıcısının şifresi değiştirildi; açık oturumları kapatıldı.`,
  );
}

try {
  await main();
} catch (error) {
  console.error(error instanceof AppError ? error.message : error);
  process.exitCode = 1;
} finally {
  rl.close();
  await pool.end();
}
