"use client";

import { useState, useCallback } from "react";
import { ViewType } from "@/lib/types";
import Header from "@/components/ui/Header";
import Dashboard from "@/components/Dashboard";
import NewAnalysis from "@/components/NewAnalysis";
import CandidateDetail from "@/components/CandidateDetail";
import HistoryView from "@/components/HistoryView";
import CompareView from "@/components/CompareView";

export default function Home() {
  const [view, setView] = useState<ViewType>("dashboard");
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const navigateTo = useCallback((v: ViewType) => {
    setView(v);
    if (v === "dashboard") {
      setSelectedCandidateId(null);
      setRefreshKey((k) => k + 1);
    }
  }, []);

  const viewCandidate = useCallback((id: string) => {
    setSelectedCandidateId(id);
    setView("candidate");
  }, []);

  const handleAnalysisComplete = useCallback((id: string) => {
    setSelectedCandidateId(id);
    setView("candidate");
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header currentView={view} onNavigate={navigateTo} />

      <main className="flex-1">
        {view === "dashboard" && (
          <Dashboard
            key={refreshKey}
            onNewAnalysis={() => navigateTo("new-analysis")}
            onViewCandidate={viewCandidate}
          />
        )}

        {view === "new-analysis" && (
          <NewAnalysis
            onComplete={handleAnalysisComplete}
            onCancel={() => navigateTo("dashboard")}
          />
        )}

        {view === "candidate" && selectedCandidateId && (
          <CandidateDetail
            candidateId={selectedCandidateId}
            onBack={() => navigateTo("dashboard")}
            onDeleted={() => navigateTo("dashboard")}
          />
        )}

        {view === "history" && (
          <HistoryView
            onViewCandidate={viewCandidate}
            onNewAnalysis={() => navigateTo("new-analysis")}
          />
        )}

        {view === "compare" && (
          <CompareView
            onViewCandidate={viewCandidate}
            onNewAnalysis={() => navigateTo("new-analysis")}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="py-6 text-center border-t border-thmanyah-warm-border mt-auto no-print">
        <p className="text-[12px] text-thmanyah-muted font-ui">
          منصة تحليل المرشحين &middot; ثمانية &copy; {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}
