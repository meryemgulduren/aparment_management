import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    // Geliştirme sırasında /api istekleri Express sunucusuna aktarılır; böylece
    // tarayıcı açısından arayüz ve API aynı adreste olur (çerez sorunsuz çalışır).
    proxy: {
      "/api": "http://localhost:3000",
    },
  },
});
