import { Router, Switch, Route } from "wouter";

// Under the unified Overall-Dashboard deploy this app is served from
// `/social-listening/...`. Vite's `base` is set from BASE_PATH at build
// time, so `import.meta.env.BASE_URL` resolves to `/social-listening/`
// (or `/` in standalone dev). Strip the trailing slash so wouter routes
// match `/x`, `/tiktok`, etc. correctly.
const routerBase = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DateRangeProvider } from "@/components/DateRangeFilter";
import { Layout } from "@/components/layout";
import Overview from "@/pages/overview";
import XPage from "@/pages/x";
import TikTok from "@/pages/tiktok";
import Instagram from "@/pages/instagram";
import YouTube from "@/pages/youtube";
import Analytics from "@/pages/analytics";
import Admin from "@/pages/admin";
import NotFound from "@/pages/not-found";

function AppRouter() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Overview} />
        <Route path="/overview" component={Overview} />

        <Route path="/x" component={XPage} />
        <Route path="/x/admin" component={Admin} />

        <Route path="/tiktok" component={TikTok} />
        <Route path="/tiktok/:username" component={TikTok} />

        <Route path="/instagram" component={Instagram} />
        <Route path="/instagram/:username" component={Instagram} />

        <Route path="/youtube" component={YouTube} />
        <Route path="/youtube/:channelId" component={YouTube} />

        <Route path="/analytics/x/:identifier" component={Analytics} />
        <Route path="/analytics/tiktok/:identifier" component={Analytics} />
        <Route path="/analytics/instagram/:identifier" component={Analytics} />
        <Route path="/analytics/youtube/:identifier" component={Analytics} />

        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <DateRangeProvider>
          <Toaster />
          <Router base={routerBase}>
            <AppRouter />
          </Router>
        </DateRangeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
