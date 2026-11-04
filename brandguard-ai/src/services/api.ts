import {
  User,
  Guideline,
  ApprovedFact,
  TerminologyItem,
  BrandAsset,
  Submission,
  ComplianceIssue,
  ReviewLog,
  ContentVersion,
  AnalyticsData,
} from '../types';

export const api = {
  // Users & Role
  async getUsers(): Promise<{ users: User[]; currentUserId: string }> {
    const res = await fetch('/api/users');
    return res.json();
  },

  async switchRole(userId: string): Promise<{ success: boolean; currentUser: User }> {
    const res = await fetch('/api/users/switch-role', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    return res.json();
  },

  // Guidelines
  async getGuidelines(): Promise<Guideline[]> {
    const res = await fetch('/api/guidelines');
    return res.json();
  },

  async createGuideline(data: Partial<Guideline>): Promise<Guideline> {
    const res = await fetch('/api/guidelines', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async deleteGuideline(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`/api/guidelines/${id}`, { method: 'DELETE' });
    return res.json();
  },

  // Approved Facts
  async getFacts(): Promise<ApprovedFact[]> {
    const res = await fetch('/api/facts');
    return res.json();
  },

  async createFact(data: { fact: string; source: string }): Promise<ApprovedFact> {
    const res = await fetch('/api/facts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async deleteFact(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`/api/facts/${id}`, { method: 'DELETE' });
    return res.json();
  },

  // Terminology
  async getTerminology(): Promise<TerminologyItem[]> {
    const res = await fetch('/api/terminology');
    return res.json();
  },

  async createTerminology(data: { prohibited_term: string; preferred_term: string; explanation?: string }): Promise<TerminologyItem> {
    const res = await fetch('/api/terminology', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async deleteTerminology(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`/api/terminology/${id}`, { method: 'DELETE' });
    return res.json();
  },

  // Assets
  async getAssets(): Promise<BrandAsset[]> {
    const res = await fetch('/api/assets');
    return res.json();
  },

  async createAsset(data: Partial<BrandAsset>): Promise<BrandAsset> {
    const res = await fetch('/api/assets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  // Document parsing
  async parseDocument(fileBase64: string, fileName: string, mimeType?: string): Promise<{ text: string; pageCount?: number }> {
    const res = await fetch('/api/documents/parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileBase64, fileName, mimeType }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Document extraction failed');
    }
    return res.json();
  },

  // Submissions & Analysis
  async analyzeContent(data: {
    title: string;
    content: string;
    content_type: string;
    submission_id?: string;
  }): Promise<{
    submission: Submission;
    issues: ComplianceIssue[];
    compliance_score: number;
    overall_summary: string;
    used_ai: boolean;
  }> {
    const res = await fetch('/api/submissions/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Compliance analysis failed');
    }
    return res.json();
  },

  async getSubmissions(): Promise<Submission[]> {
    const res = await fetch('/api/submissions');
    return res.json();
  },

  async getSubmissionDetails(id: string): Promise<{
    submission: Submission;
    issues: ComplianceIssue[];
    reviews: ReviewLog[];
    versions: ContentVersion[];
  }> {
    const res = await fetch(`/api/submissions/${id}`);
    if (!res.ok) throw new Error('Submission not found');
    return res.json();
  },

  async updateContent(id: string, content: string, compliance_score?: number): Promise<{ success: boolean; submission: Submission; version_number: number }> {
    const res = await fetch(`/api/submissions/${id}/content`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, compliance_score }),
    });
    return res.json();
  },

  async updateIssueStatus(submissionId: string, issueId: string, human_status: string, suggested_correction?: string): Promise<ComplianceIssue> {
    const res = await fetch(`/api/submissions/${submissionId}/issue/${issueId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ human_status, suggested_correction }),
    });
    return res.json();
  },

  async submitForReview(id: string): Promise<{ success: boolean; submission: Submission }> {
    const res = await fetch(`/api/submissions/${id}/submit-review`, {
      method: 'POST',
    });
    return res.json();
  },

  async reviewSubmission(id: string, decision: 'Approved' | 'Rejected' | 'Needs Revision', comments: string): Promise<{
    success: boolean;
    submission: Submission;
    reviews: ReviewLog[];
  }> {
    const res = await fetch(`/api/submissions/${id}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision, comments }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Review failed');
    }
    return res.json();
  },

  // Analytics
  async getAnalytics(): Promise<AnalyticsData> {
    const res = await fetch('/api/analytics');
    return res.json();
  },

  // Reset Demo
  async resetDemo(): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/reset-demo', { method: 'POST' });
    return res.json();
  },
};
