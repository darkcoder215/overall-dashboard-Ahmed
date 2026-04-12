export type AnalysisStatus = "pending" | "analyzing" | "completed" | "failed";
export type CandidateDecision = "strong_hire" | "hire" | "maybe" | "no_hire" | "pending";
export type ExperienceLevel = "intern" | "junior" | "mid" | "senior" | "lead" | "manager" | "director" | "executive";

export interface RoleContext {
  roleTitle: string;
  roleTitleEn: string;
  department: string;
  experienceLevel: ExperienceLevel;
  requiredSkills: string;
  roleDescription: string;
  niceToHaveSkills: string;
  languageRequirements: string;
  additionalNotes: string;
}

export interface AnalysisDimension {
  name: string;
  nameEn: string;
  score: number;
  maxScore: number;
  detail: string;
  icon: string;
}

export interface CVAnalysisResult {
  overallScore: number;
  scoreLabel: string;
  summary: string;
  dimensions: AnalysisDimension[];
  strengths: string[];
  concerns: string[];
  experienceHighlights: string[];
  educationSummary: string;
  skillsMatch: string;
  recommendation: string;
  suggestedQuestions: string[];
}

export interface VideoAnalysisResult {
  communicationScore: number;
  confidenceScore: number;
  clarityScore: number;
  professionalismScore: number;
  overallVideoScore: number;
  summary: string;
  strengths: string[];
  concerns: string[];
  bodyLanguageNotes: string;
  communicationStyle: string;
  keyMoments: string[];
}

export interface CandidateAnalysis {
  id: string;
  candidateName: string;
  candidateEmail: string;
  roleContext: RoleContext;
  cvFileName: string;
  videoFileName: string;
  status: AnalysisStatus;
  decision: CandidateDecision;
  cvAnalysis: CVAnalysisResult | null;
  videoAnalysis: VideoAnalysisResult | null;
  combinedScore: number;
  createdAt: string;
  updatedAt: string;
  notes: string;
}

export type ViewType = "dashboard" | "new-analysis" | "candidate" | "history" | "compare";
