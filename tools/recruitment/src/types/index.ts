/* ═══════════════════════════════════════════
   Recruitee API Types
   ═══════════════════════════════════════════ */

export interface RecruiteeConfig {
  id?: string;
  company_id: string;
  api_token: string;
  company_name?: string;
}

export interface Offer {
  id: number;
  title: string;
  slug: string;
  status: "published" | "draft" | "closed" | "archived" | "internal";
  kind: "job" | "talent_pool";
  position: number;
  department: Department | null;
  location: string;
  city: string;
  country: string;
  postal_code: string;
  employment_type: string;
  candidates_count: number;
  hired_candidates_count: number;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  closed_at: string | null;
  pipeline_template: PipelineTemplate | null;
  careers_url: string;
  recruiter_id: number | null;
  hiring_manager_id: number | null;
  tags: OfferTag[];
  offer_tags: OfferTag[];
  mailbox_email: string;
  description: string;
  requirements: string;
}

export interface OfferTag {
  id: number;
  name: string;
}

export interface Department {
  id: number;
  name: string;
}

export interface Location {
  id: number;
  name: string;
  country_code: string;
  state_code: string;
  full_address: string;
}

export interface PipelineTemplate {
  id: number;
  name: string;
  stages: Stage[];
}

export interface Stage {
  id: number;
  name: string;
  category: StageCategory;
  pipeline_template_id: number;
  position: number;
}

export type StageCategory =
  | "none"
  | "apply"
  | "phone_screen"
  | "interview"
  | "evaluation"
  | "offer"
  | "hire"
  | "disqualified";

export interface Candidate {
  id: number;
  name: string;
  emails: string[];
  phones: string[];
  photo_url: string | null;
  photo_thumb_url: string | null;
  cv_original_url: string | null;
  source: string | null;
  referrer: string | null;
  tags: string[];
  admin_id: number | null;
  positive_ratings: number;
  ratings_count: number;
  viewed: boolean;
  created_at: string;
  updated_at: string;
  last_activity_at: string | null;
  placements: Placement[];
  links: string[];
  fields: Record<string, any>;
}

export interface Placement {
  id: number;
  candidate_id: number;
  offer_id: number;
  stage_id: number;
  disqualified: boolean;
  disqualified_at: string | null;
  disqualify_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface CandidateNote {
  id: number;
  body: string;
  author_name: string;
  created_at: string;
}

export interface InterviewEvent {
  id: number;
  candidate_id: number;
  offer_id: number;
  start_time: string;
  end_time: string;
  status: string;
  timezone: string;
}

/* ═══════════════════════════════════════════
   AI Analysis Types
   ═══════════════════════════════════════════ */

export interface AIAnalysis {
  score: number;
  summary: string;
  strengths: string[];
  concerns: string[];
  recommendation: "strong_hire" | "hire" | "maybe" | "pass";
  recommended_questions: string[];
  skill_match: SkillMatch[];
}

export interface SkillMatch {
  skill: string;
  level: "strong" | "moderate" | "weak" | "unknown";
  evidence: string;
}

export interface AISearchResult {
  candidate: Candidate;
  relevance: number;
  match_reason: string;
}

/* ═══════════════════════════════════════════
   Analytics Types
   ═══════════════════════════════════════════ */

export interface PipelineMetrics {
  stage_name: string;
  category: StageCategory;
  count: number;
  percentage: number;
}

export interface HiringMetrics {
  total_open_jobs: number;
  total_candidates: number;
  total_hired: number;
  avg_time_to_hire_days: number;
  new_candidates_this_week: number;
  pipeline_by_stage: PipelineMetrics[];
  candidates_by_source: { source: string; count: number }[];
  candidates_by_department: { department: string; count: number }[];
}
