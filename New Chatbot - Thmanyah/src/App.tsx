import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Under the unified Overall Dashboard deploy this app is served at
// /chatbot/. Vite's `base` already prefixes all bundled asset URLs, but
// React Router still needs to be told which prefix to strip off.
//
// React Router v6 requires the basename WITHOUT a trailing slash — it
// uses `pathname.startsWith(basename + "/")`-style checks internally, so
// a basename of `/chatbot/` fails to match when Vercel (configured with
// `trailingSlash: false`) serves the iframe at URL `/chatbot`. Stripping
// the trailing slash makes both `/chatbot` and `/chatbot/` match.
const routerBasename =
  (import.meta.env.BASE_URL || "/").replace(/\/$/, "") || "/";

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter basename={routerBasename}>
        <Routes>
          <Route path="/" element={<Index />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
