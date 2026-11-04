import React from 'react';
import {
  FileSearch,
  CheckCircle2,
  Clock,
  AlertTriangle,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  FileText,
} from 'lucide-react';
import { Submission, AnalyticsData } from '../../types';

interface OverviewTabProps {
  analytics: AnalyticsData | null;
  submissions: Submission[];
  onNavigate: (tab: any, submissionId?: string) => void;
  onQuickTestDemo: () => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  analytics,
  submissions,
  onNavigate,
  onQuickTestDemo,
}) => {
  const metrics = analytics?.metrics;
  const recentSubmissions = submissions.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Welcome & Hackathon Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-xl p-6 shadow-sm border border-slate-700/60 relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-400 mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Enterprise Brand Integrity & Quality Control</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white mb-2">
            Enterprise Brand Governance & Pre-Publication Compliance
          </h2>
          <p className="text-slate-300 text-sm leading-relaxed mb-4">
            BrandGuard AI safeguards <strong>NOVA TECH</strong> against outdated facts, prohibited terminology,
            aggressive sales tone, and unsupported claims before content goes live. Built with Gemini 3.8 Flash
            and robust deterministic rule verification.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onQuickTestDemo}
              className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold text-xs rounded-lg transition-colors flex items-center gap-2 shadow-sm"
            >
              <FileSearch className="w-4 h-4" />
              <span>Launch Judge Test Flight (Sample Content)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onNavigate('hub')}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs rounded-lg border border-slate-600 transition-colors flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4 text-teal-400" />
              <span>Explore Brand Guidelines Hub</span>
            </button>
          </div>
        </div>
      </div>

      {/* Primary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500">Total Submissions</div>
            <div className="text-2xl font-bold font-mono text-slate-900 mt-1 tabular-nums">
              {metrics?.totalSubmissions ?? submissions.length}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Across all content types</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500">Approved Submissions</div>
            <div className="text-2xl font-bold font-mono text-teal-600 mt-1 tabular-nums">
              {metrics?.approvedSubmissions ?? 0}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Brand-safe & cleared</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500">Pending Reviews</div>
            <div className="text-2xl font-bold font-mono text-amber-600 mt-1 tabular-nums">
              {metrics?.pendingReviews ?? 0}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Awaiting manager sign-off</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500">Detected Issues</div>
            <div className="text-2xl font-bold font-mono text-rose-600 mt-1 tabular-nums">
              {metrics?.totalIssues ?? 0}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Prevented from publishing</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* End-to-End Governance Lifecycle Diagram */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">End-to-End Governance Workflow</h3>
            <p className="text-xs text-slate-500">How BrandGuard AI keeps human authorities firmly in control</p>
          </div>
          <div className="text-xs font-medium text-teal-700 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200">
            Human-in-the-Loop Architecture
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 relative">
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
            <div className="font-bold text-slate-900 mb-1">1. Creator Input</div>
            <p className="text-slate-600 text-[11px]">Paste marketing copy or upload PDF, DOCX, or TXT draft.</p>
          </div>
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
            <div className="font-bold text-slate-900 mb-1">2. AI Compliance Scan</div>
            <p className="text-slate-600 text-[11px]">Checked against approved facts, tone rules, and banned terms.</p>
          </div>
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
            <div className="font-bold text-slate-900 mb-1">3. Guided Correction</div>
            <p className="text-slate-600 text-[11px]">Creator reviews flags, accepts suggestions, or edits directly.</p>
          </div>
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
            <div className="font-bold text-slate-900 mb-1">4. Human Approval</div>
            <p className="text-slate-600 text-[11px]">Brand Manager inspects score & comments: Approve / Reject / Revise.</p>
          </div>
          <div className="p-3.5 rounded-lg bg-teal-50/70 border border-teal-200 text-xs">
            <div className="font-bold text-teal-900 mb-1">5. Safe Publication</div>
            <p className="text-teal-800 text-[11px]">Audited release with complete decision logs and version history.</p>
          </div>
        </div>
      </div>

      {/* Recent Submissions Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Recent Content Submissions</h3>
            <p className="text-xs text-slate-500">Live items stored in persistent SQLite database</p>
          </div>
          <button
            onClick={() => onNavigate('review')}
            className="text-xs font-semibold text-teal-700 hover:text-teal-800 flex items-center gap-1"
          >
            <span>Review New Content</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentSubmissions.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            No submissions yet. Click "Launch Judge Test Flight" above to analyze your first content!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-5">Title & Type</th>
                  <th className="py-3 px-5">Author</th>
                  <th className="py-3 px-5">Compliance Score</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5">Last Updated</th>
                  <th className="py-3 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentSubmissions.map((sub) => {
                  let statusColor = 'text-slate-600 bg-slate-100';
                  if (sub.status === 'Approved') statusColor = 'text-teal-700 bg-teal-50 border border-teal-200';
                  else if (sub.status === 'In Review') statusColor = 'text-blue-700 bg-blue-50 border border-blue-200';
                  else if (sub.status === 'Needs Revision') statusColor = 'text-amber-700 bg-amber-50 border border-amber-200';
                  else if (sub.status === 'Rejected') statusColor = 'text-rose-700 bg-rose-50 border border-rose-200';

                  return (
                    <tr key={sub.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-5">
                        <div className="font-semibold text-slate-900">{sub.title}</div>
                        <div className="text-[11px] text-slate-400">{sub.content_type} · {sub.id}</div>
                      </td>
                      <td className="py-3.5 px-5 text-slate-600">
                        {sub.author_name || 'Creator'}
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-2">
                          <span className={`font-mono font-bold tabular-nums text-sm ${sub.compliance_score >= 80 ? 'text-teal-600' : sub.compliance_score >= 50 ? 'text-amber-600' : 'text-rose-600'}`}>
                            {sub.compliance_score}%
                          </span>
                          <span className="text-[11px] text-slate-400">heuristic</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-5">
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${statusColor}`}>
                          {sub.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-slate-500 font-mono text-[11px]">
                        {new Date(sub.updated_at).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <button
                          onClick={() => onNavigate('review', sub.id)}
                          className="px-2.5 py-1 text-xs font-medium text-slate-700 hover:text-teal-700 hover:bg-slate-100 rounded transition-colors"
                        >
                          Open Review
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
