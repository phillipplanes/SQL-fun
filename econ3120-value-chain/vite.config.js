import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // The built app is committed to /value-chain/ in the repo root and served
  // by Cloudflare Pages from that subpath:
  base: "/value-chain/",
});
