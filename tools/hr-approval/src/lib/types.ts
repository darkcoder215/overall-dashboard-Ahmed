export type VacancyType = "replacement" | "new_position";
export type DepartureType = "resignation" | "termination";
export type Nationality = "saudi" | "arab" | "non_arab";
export type RoleNature = "full_time" | "part_time" | "contract" | "freelance" | "intern";

export type RequestStatus =
  | "received"
  | "under_review"
  | "pending_approval"
  | "approved"
  | "rejected"
  | "hiring_started";

export type ApprovalStatus = "pending" | "approved" | "rejected";

export interface ApprovalStep {
  id: string;
  order: number;
  role: string;
  approverName: string;
  approverEmail: string;
  slaHours: number;
  status: ApprovalStatus;
  comment?: string;
  internalComment?: string;
  decidedAt?: string;
  reminderSentAt?: string;
}

export interface VacancyRequest {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: RequestStatus;
  currentApprovalStep: number;

  // Requester info
  requesterName: string;
  requesterEmail: string;
  department: string;
  section: string;
  team: string;
  project: string;
  budgetOwner: string;

  // Vacancy details
  vacancyType: VacancyType;
  positionsCount: number;

  // Replacement fields
  previousEmployeeName?: string;
  departureDate?: string;
  departureType?: DepartureType;
  departureReason?: string;

  // New position fields
  isInApprovedStructure?: boolean;
  structureJustification?: string;

  // Role details
  jobTitle: string;
  jobTitleEn: string;
  jobLevel: string;
  roleNature: RoleNature;
  jobDescription: string;
  country: string;
  preferredCountry?: string;
  workLocation?: string;
  nationality: Nationality;

  // Assessment
  triedAlternatives: boolean;
  alternativesDescription?: string;
  risksIfNotHired: string;

  // AI assessment
  aiRoleIntegration: string;
  aiAutomationPotential: string;
  aiReplacementAssessment: string;

  // Hiring bar
  hiringBarCommitment: string;

  // Approval chain
  approvalChain: ApprovalStep[];

  // Rejection
  rejectionReason?: string;
}

export interface DashboardStats {
  totalRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  avgApprovalDays: number;
}

export interface UserRole {
  type: "requester" | "approver" | "culture_admin" | "department_head";
  name: string;
  email: string;
  department?: string;
}
