import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  Legend,
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Lightbulb,
  ShieldAlert,
} from 'lucide-react';
import { AnalyticsData } from '../../types';

interface AnalyticsProps {
  analytics: AnalyticsData | null;
  onRefresh: () => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  Tone: '#3B82F6',
  Terminology: '#0D9488',
  Messaging: '#8B5CF6',
  Facts: '#F59E0B',
  Claims: '#EF4444',
  'Visual identity': '#EC4899',
  Accessibility: '#10B981',
};

export const GovernanceAnalyticsTab: React.FC<AnalyticsProps> = ({ analytics, onRefresh }) => {
  if (!analytics) {
    return (
      <div className="p-12 text-center text-xs text-slate-500 bg-white rounded-xl border border-slate-200">
        Loading analytics from database...
      </div>
    );
  }

  const { metrics, submissionsByStatus, issuesByCategory, issuesBySeverity, topViolatedRules, repeatedTerminology, unclearGuidelines } = analytics;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-teal-600" />
            <span>Governance Analytics & Quality Telemetry</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time aggregate compliance data queried from persistent SQLite storage
          </p>
        </div>

        <button
          onClick={onRefresh}
          className="px-3.5 py-1.5 text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 shrink-0"
        >
          <span>Refresh Data</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="text-[11px] font-medium text-slate-500">Submissions</div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-1 tabular-nums">{metrics.totalSubmissions}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Total drafted</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="text-[11px] font-medium text-slate-500">Approved</div>
          <div className="text-2xl font-bold font-mono text-teal-600 mt-1 tabular-nums">{metrics.approvedSubmissions}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Cleared for release</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="text-[11px] font-medium text-slate-500">In Review</div>
          <div className="text-2xl font-bold font-mono text-blue-600 mt-1 tabular-nums">{metrics.pendingReviews}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Pending approval</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="text-[11px] font-medium text-slate-500">Needs Revision</div>
          <div className="text-2xl font-bold font-mono text-amber-600 mt-1 tabular-nums">{metrics.needsRevision}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Returned to creator</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="text-[11px] font-medium text-slate-500">Rejected</div>
          <div className="text-2xl font-bold font-mono text-rose-600 mt-1 tabular-nums">{metrics.rejectedSubmissions}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Unapproved</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="text-[11px] font-medium text-slate-500">Flagged Issues</div>
          <div className="text-2xl font-bold font-mono text-slate-800 mt-1 tabular-nums">{metrics.totalIssues}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">All violations</div>
        </div>
      </div>

      {/* Unclear Guidelines Alert (Section 9 Requirement) */}
      {unclearGuidelines && unclearGuidelines.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 shadow-sm flex items-start gap-3">
          <div className="p-2 rounded-lg bg-amber-100 text-amber-800 shrink-0 mt-0.5">
            <Lightbulb className="w-5 h-5 text-amber-700" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wider">
              Governance Optimization: Potentially Unclear Brand Guidelines
            </h4>
            <p className="text-xs text-amber-900 mt-0.5 leading-relaxed">
              The following rules trigger frequent repeat violations across submissions. Administrators should review their
              wording in the Brand Knowledge Hub to provide clearer creator examples:
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              {unclearGuidelines.map((rule) => (
                <span
                  key={rule.id}
                  className="px-2.5 py-1 rounded bg-white border border-amber-300 text-amber-950 text-xs font-semibold"
                >
                  {rule.title} ({rule.violations} violations)
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Visual Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Submissions by Approval Status */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
            Submissions Status Breakdown
          </h3>
          <p className="text-[11px] text-slate-400 mb-4">Pipeline distribution from persistent SQLite store</p>

          <div className="h-64 flex items-center justify-center">
            {submissionsByStatus.some((s) => s.count > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={submissionsByStatus.filter((s) => s.count > 0)}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={45}
                    paddingAngle={3}
                    label={(entry: any) => `${entry.name}: ${entry.value ?? entry.count}`}
                  >
                    {submissionsByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconSize={10} wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-slate-400">No submissions data available yet.</div>
            )}
          </div>
        </div>

        {/* Chart 2: Issues by Category */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
            Detected Violations by Brand Category
          </h3>
          <p className="text-[11px] text-slate-400 mb-4">Volume of flagged items per policy category</p>

          <div className="h-64">
            {issuesByCategory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={issuesByCategory} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="category" tick={{ fontSize: 10, fill: '#64748B' }} interval={0} angle={-15} textAnchor="end" />
                  <YAxis tick={{ fontSize: 10, fill: '#64748B' }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                  />
                  <Bar dataKey="count" name="Violations" radius={[4, 4, 0, 0]}>
                    {issuesByCategory.map((entry, index) => (
                      <Cell key={`bar-${index}`} fill={CATEGORY_COLORS[entry.category] || '#0D9488'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No violation issues registered.
              </div>
            )}
          </div>
        </div>

        {/* Chart 3: Frequently Violated Rules */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
            Frequently Violated Brand Guidelines
          </h3>
          <p className="text-[11px] text-slate-400 mb-4">Rules most often flagged during creator compliance scans</p>

          <div className="space-y-3">
            {topViolatedRules.length > 0 ? (
              topViolatedRules.map((rule) => (
                <div key={rule.id} className="text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-slate-800 truncate max-w-xs">{rule.title}</span>
                    <span className="font-mono font-bold text-slate-700">{rule.violations} flags</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-teal-600 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(100, Math.max(10, rule.violations * 25))}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{rule.category} · {rule.id}</div>
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-400 py-8 text-center">No rule violations tracked yet.</div>
            )}
          </div>
        </div>

        {/* Chart 4: Repeated Terminology Mistakes */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
            Repeated Terminology Mistakes
          </h3>
          <p className="text-[11px] text-slate-400 mb-4">Prohibited words most frequently replaced by creators</p>

          <div className="space-y-3">
            {repeatedTerminology.length > 0 ? (
              repeatedTerminology.map((term) => (
                <div key={term.term} className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <code className="text-rose-700 bg-rose-100/60 px-1.5 py-0.5 rounded font-mono font-bold">"{term.term}"</code>
                      <span className="text-slate-400">→</span>
                      <span className="text-teal-900 font-semibold">"{term.preferred}"</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">Replaced automatically by AI Correction Engine</div>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-bold font-mono text-slate-900">{term.count}</div>
                    <div className="text-[10px] text-slate-400">occurrences</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-400 py-8 text-center">No prohibited terms detected yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
