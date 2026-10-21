import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // The built app is committed to /value-chain/ in the repo root and served
  // by GitHub Pages at https://phillipplanes.github.io/SQL-fun/value-chain/.
  // Relative base keeps it working at any subpath (or a custom domain).
  base: "./",
});
