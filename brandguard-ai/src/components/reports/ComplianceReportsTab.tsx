import React, { useState } from 'react';
import {
  FileCheck2,
  Printer,
  AlertTriangle,
  CheckCircle2,
  FileText,
  ShieldAlert,
  ChevronRight,
  Info,
  Calendar,
  User,
} from 'lucide-react';
import { Submission, ComplianceIssue, ReviewLog } from '../../types';
import { api } from '../../services/api';

interface ReportsProps {
  submissions: Submission[];
}

export const ComplianceReportsTab: React.FC<ReportsProps> = ({ submissions }) => {
  const [selectedSubId, setSelectedSubId] = useState<string>(submissions[0]?.id || '');
  const [detailedReport, setDetailedReport] = useState<{
    submission: Submission;
    issues: ComplianceIssue[];
    reviews: ReviewLog[];
  } | null>(null);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (selectedSubId) {
      loadReport(selectedSubId);
    }
  }, [selectedSubId]);

  const loadReport = async (id: string) => {
    setLoading(true);
    try {
      const data = await api.getSubmissionDetails(id);
      setDetailedReport(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const sub = detailedReport?.submission;
  const issues = detailedReport?.issues || [];

  const highCount = issues.filter((i) => i.severity === 'High').length;
  const medCount = issues.filter((i) => i.severity === 'Medium').length;
  const lowCount = issues.filter((i) => i.severity === 'Low').length;

  return (
    <div className="space-y-6">
      {/* Header and report selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm print:hidden">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-teal-600" />
            <span>Formal Compliance Audit Reports</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Executive brand governance statements, issue severity distribution, and source guideline audit trails
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedSubId}
            onChange={(e) => setSelectedSubId(e.target.value)}
            aria-label="Select submission report to audit"
            className="text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            {submissions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title} ({s.id}) · {s.status}
              </option>
            ))}
          </select>

          <button
            onClick={handlePrint}
            className="px-3.5 py-2 text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>Export / Print PDF</span>
          </button>
        </div>
      </div>

      {loading && (
        <div className="p-12 text-center text-xs text-slate-500">
          Loading audit report details...
        </div>
      )}

      {/* Printable Report Canvas */}
      {!loading && sub && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6 max-w-5xl mx-auto print:border-none print:shadow-none print:p-0">
          {/* Report Top Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between pb-6 border-b border-slate-200 gap-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-teal-700">
                BrandGuard AI · Governance Certification
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900 mt-1">{sub.title}</h1>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-2">
                <span>ID: <strong className="font-mono text-slate-800">{sub.id}</strong></span>
                <span>·</span>
                <span>Channel: <strong className="text-slate-800">{sub.content_type}</strong></span>
                <span>·</span>
                <span>Author: <strong className="text-slate-800">{sub.author_name || 'Creator'}</strong></span>
                <span>·</span>
                <span>Audited: {new Date(sub.updated_at).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="text-right flex sm:flex-col items-center sm:items-end justify-between gap-2">
              <span
                className={`px-3 py-1 rounded text-xs font-bold uppercase ${
                  sub.status === 'Approved'
                    ? 'bg-teal-50 text-teal-700 border border-teal-200'
                    : sub.status === 'Needs Revision'
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : sub.status === 'In Review'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}
              >
                {sub.status}
              </span>
              <div className="text-xs text-slate-400">Organization: NOVA TECH</div>
            </div>
          </div>

          {/* Compliance Score & Severity KPI Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-5 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Compliance Score
              </div>
              <div className="flex items-baseline gap-1 mt-1">
                <span
                  className={`text-3xl font-extrabold font-mono tabular-nums ${
                    sub.compliance_score >= 80
                      ? 'text-teal-600'
                      : sub.compliance_score >= 50
                      ? 'text-amber-600'
                      : 'text-rose-600'
                  }`}
                >
                  {sub.compliance_score}%
                </span>
                <span className="text-xs text-slate-400">/ 100</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Internal heuristic score</div>
            </div>

            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-rose-700">
                High Severity Issues
              </div>
              <div className="text-2xl font-bold font-mono text-rose-800 mt-1 tabular-nums">{highCount}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Mandatory legal/claim blocks</div>
            </div>

            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
                Medium Severity
              </div>
              <div className="text-2xl font-bold font-mono text-amber-800 mt-1 tabular-nums">{medCount}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Tone & terminology fixes</div>
            </div>

            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-blue-700">
                Low Severity
              </div>
              <div className="text-2xl font-bold font-mono text-blue-800 mt-1 tabular-nums">{lowCount}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Stylistic recommendations</div>
            </div>
          </div>

          {/* Mandated Heuristic Indicator Disclaimer */}
          <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-start gap-2">
            <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong>Governance Transparency Note:</strong> The compliance score represents an internal heuristic
              indicator calculated against Nova Tech registered brand rules and facts. It does not constitute an absolute
              guarantee of regulatory or brand safety without designated human approval.
            </div>
          </div>

          {/* Side-by-Side Content Evolution */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Content Evolution (Original vs Revised)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 font-sans">
                  Original Submitted Draft
                </div>
                <div className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {sub.original_content}
                </div>
              </div>

              <div className="p-4 rounded-lg bg-teal-50/40 border border-teal-200">
                <div className="text-[11px] font-bold text-teal-800 uppercase tracking-wider mb-2 font-sans flex items-center justify-between">
                  <span>Revised Compliant Text</span>
                  <span className="text-[10px] bg-teal-100 text-teal-800 px-1.5 py-0.5 rounded">Current Release</span>
                </div>
                <div className="text-teal-950 whitespace-pre-wrap leading-relaxed font-semibold">
                  {sub.content}
                </div>
              </div>
            </div>
          </div>

          {/* Granular Issue Audit Trail */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Itemized Compliance Violations & Guidance ({issues.length})
            </h3>

            {issues.length === 0 ? (
              <div className="p-6 text-center text-xs text-teal-700 bg-teal-50 rounded-lg border border-teal-200">
                No compliance issues flagged. Content fully complies with active brand guidelines.
              </div>
            ) : (
              <div className="space-y-3">
                {issues.map((issue) => (
                  <div key={issue.id} className="p-4 rounded-lg border border-slate-200 bg-white space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-slate-500">{issue.id}</span>
                        <span className="font-bold text-xs text-slate-900">{issue.title}</span>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          issue.severity === 'High'
                            ? 'bg-rose-100 text-rose-800'
                            : issue.severity === 'Medium'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {issue.severity} Severity
                      </span>
                    </div>

                    <div className="text-xs text-slate-600">
                      <strong>Flagged Text:</strong> <code className="bg-rose-50 text-rose-900 px-1 py-0.5 rounded font-mono">"{issue.problematic_text}"</code>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      <strong>Violation Explanation:</strong> {issue.explanation}
                    </p>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
                      <div className="text-teal-900">
                        <strong>Suggested Correction:</strong> "{issue.suggested_correction}"
                      </div>
                      <div className="text-slate-400 text-[11px]">
                        Source: {issue.source_guideline_id || 'Brand Policy'} · Human Action: <span className="font-semibold text-slate-700">{issue.human_status}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Review Decision Audit Trail */}
          {detailedReport?.reviews && detailedReport.reviews.length > 0 && (
            <div className="space-y-2 pt-4 border-t border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Managerial Review Audit History
              </h3>
              <div className="space-y-2">
                {detailedReport.reviews.map((rev) => (
                  <div key={rev.id} className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-slate-800">
                        {rev.reviewer_name || 'Reviewer'} ({rev.reviewer_role?.replace('_', ' ')})
                      </span>
                      <span className="font-bold text-teal-700">{rev.decision}</span>
                    </div>
                    <p className="text-slate-600">{rev.comments || 'No comments left.'}</p>
                    <div className="text-[10px] text-slate-400 mt-1 font-mono">
                      {new Date(rev.created_at).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Report Footer */}
          <div className="pt-6 border-t border-slate-200 text-center text-xs text-slate-400">
            Generated by <strong>BrandGuard AI</strong> · Enterprise Brand Governance
          </div>
        </div>
      )}
    </div>
  );
};
