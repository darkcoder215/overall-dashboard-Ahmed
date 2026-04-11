import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
//
// BASE_PATH is set by the unified Overall-Dashboard build script
// (`build.sh` at repo root) so that this tool can live under
// /social-listening/ on the same Vercel origin as the dashboard.
// Local dev keeps `/` as the base.
export default defineConfig(({ mode }) => ({
  base: process.env.BASE_PATH || "/",
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
