import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { installStaticApiShim } from "./lib/staticApiShim";

// In the unified Vercel deploy there is no Express backend, so every
// /api/* fetch would fail with a network error. Install a fetch shim that
// returns structurally-valid empty responses in PROD builds only.
if (import.meta.env.PROD) {
  installStaticApiShim();
}

createRoot(document.getElementById("root")!).render(<App />);
