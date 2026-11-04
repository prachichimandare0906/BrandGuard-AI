export type UserRole = 'creator' | 'brand_manager' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export type GuidelineCategory =
  | 'Tone'
  | 'Terminology'
  | 'Messaging'
  | 'Facts'
  | 'Claims'
  | 'Visual identity'
  | 'Accessibility';

export type SeverityLevel = 'High' | 'Medium' | 'Low';

export interface Guideline {
  id: string;
  title: string;
  category: GuidelineCategory;
  description: string;
  severity: SeverityLevel;
  source_document?: string;
  prohibited_phrase?: string | null;
  preferred_replacement?: string | null;
  created_at: string;
}

export interface ApprovedFact {
  id: string;
  fact: string;
  source: string;
  verified_at: string;
  created_at: string;
}

export interface TerminologyItem {
  id: string;
  prohibited_term: string;
  preferred_term: string;
  explanation: string;
  created_at: string;
}

export interface BrandAsset {
  id: string;
  asset_name: string;
  asset_type: string;
  file_path: string;
  guidelines?: string;
  created_at: string;
}

export type SubmissionStatus = 'Draft' | 'In Review' | 'Needs Revision' | 'Approved' | 'Rejected';

export type ContentType =
  | 'Social Media'
  | 'Email Campaign'
  | 'Advertisement'
  | 'Website Copy'
  | 'Press Release';

export interface ComplianceIssue {
  id: string;
  submission_id: string;
  title: string;
  category: GuidelineCategory;
  severity: SeverityLevel;
  problematic_text: string;
  explanation: string;
  source_guideline_id?: string;
  suggested_correction: string;
  confidence: 'High' | 'Medium' | 'Unverified';
  human_status: 'Pending' | 'Accepted' | 'Rejected' | 'Modified';
  created_at: string;
}

export interface ReviewLog {
  id: string;
  submission_id: string;
  reviewer_id: string;
  reviewer_name?: string;
  reviewer_role?: string;
  reviewer_avatar?: string;
  decision: 'Approved' | 'Rejected' | 'Needs Revision';
  comments?: string;
  created_at: string;
}

export interface ContentVersion {
  id: string;
  submission_id: string;
  version_number: number;
  content: string;
  created_at: string;
}

export interface Submission {
  id: string;
  title: string;
  content: string;
  original_content: string;
  content_type: ContentType;
  created_by: string;
  author_name?: string;
  author_role?: string;
  status: SubmissionStatus;
  compliance_score: number;
  created_at: string;
  updated_at: string;
  total_issues?: number;
  high_issues?: number;
}

export interface AnalyticsData {
  metrics: {
    totalSubmissions: number;
    approvedSubmissions: number;
    rejectedSubmissions: number;
    pendingReviews: number;
    needsRevision: number;
    totalIssues: number;
  };
  submissionsByStatus: Array<{ name: string; count: number; color: string }>;
  issuesByCategory: Array<{ category: string; count: number }>;
  issuesBySeverity: Array<{ severity: string; count: number }>;
  topViolatedRules: Array<{ id: string; title: string; category: string; violations: number }>;
  repeatedTerminology: Array<{ term: string; count: number; preferred: string }>;
  unclearGuidelines: Array<{ id: string; title: string; category: string; violations: number }>;
}
