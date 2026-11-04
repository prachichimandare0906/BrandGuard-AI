import React, { useState, useEffect } from 'react';
import {
  FileSearch,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Check,
  X,
  Edit3,
  Send,
  Upload,
  FileText,
  HelpCircle,
  Copy,
  Layers,
  ArrowRight,
  ShieldAlert,
  RotateCcw,
  Eye,
} from 'lucide-react';
import { Submission, ComplianceIssue, ContentType, ContentVersion } from '../../types';
import { api } from '../../services/api';

interface ContentReviewProps {
  initialSubmissionId?: string;
  onSubmissionUpdated?: () => void;
  onNavigateToApproval?: (submissionId: string) => void;
  onNavigateToReport?: (submissionId: string) => void;
}

export const ContentReviewTab: React.FC<ContentReviewProps> = ({
  initialSubmissionId,
  onSubmissionUpdated,
  onNavigateToApproval,
  onNavigateToReport,
}) => {
  // Input form state
  const [title, setTitle] = useState('');
  const [contentType, setContentType] = useState<ContentType>('Social Media');
  const [content, setContent] = useState('');
  const [activeSubmissionId, setActiveSubmissionId] = useState<string | null>(initialSubmissionId || null);

  // Analysis status
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Active submission details
  const [activeSubmission, setActiveSubmission] = useState<Submission | null>(null);
  const [issues, setIssues] = useState<ComplianceIssue[]>([]);
  const [versions, setVersions] = useState<ContentVersion[]>([]);
  const [usedAI, setUsedAI] = useState<boolean>(true);
  const [overallSummary, setOverallSummary] = useState<string>('');

  // Comparison view toggle
  const [viewMode, setViewMode] = useState<'editor' | 'compare'>('editor');

  // Editing individual issue correction
  const [editingIssueId, setEditingIssueId] = useState<string | null>(null);
  const [customCorrection, setCustomCorrection] = useState<string>('');

  // Success notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (initialSubmissionId) {
      loadSubmission(initialSubmissionId);
    }
  }, [initialSubmissionId]);

  const loadSubmission = async (id: string) => {
    try {
      const data = await api.getSubmissionDetails(id);
      setActiveSubmission(data.submission);
      setActiveSubmissionId(data.submission.id);
      setTitle(data.submission.title);
      setContentType(data.submission.content_type);
      setContent(data.submission.content);
      setIssues(data.issues);
      setVersions(data.versions);
    } catch (err: any) {
      console.error('Failed to load submission:', err);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Preload demo text requested in Prompt
  const handlePreloadDemoContent = () => {
    setTitle('Spring Launch Omni-Suite Promo Copy');
    setContentType('Social Media');
    setContent('We are the best ever! Our product guarantees results. Trusted by 50,000 customers. Buy now or miss out!');
    setActiveSubmission(null);
    setActiveSubmissionId(null);
    setIssues([]);
    showToast('Loaded benchmark test copy.');
  };

  // Upload document
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64 = (reader.result as string).split(',')[1];
          const result = await api.parseDocument(base64, file.name, file.type);
          setContent(result.text);
          if (!title) {
            setTitle(file.name.replace(/\.[^/.]+$/, ''));
          }
          showToast(`Extracted ${result.text.length} characters from ${file.name}`);
        } catch (err: any) {
          setAnalysisError(err.message || 'Error extracting document.');
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setAnalysisError(err.message || 'Failed reading file.');
    }
  };

  // Run Compliance Analysis
  const handleAnalyze = async () => {
    if (!content.trim()) {
      setAnalysisError('Please enter or paste text to analyze.');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const result = await api.analyzeContent({
        title: title || 'Marketing Content Draft',
        content,
        content_type: contentType,
        submission_id: activeSubmissionId || undefined,
      });

      setActiveSubmission(result.submission);
      setActiveSubmissionId(result.submission.id);
      setIssues(result.issues);
      setUsedAI(result.used_ai);
      setOverallSummary(result.overall_summary);

      // Refresh versions
      const details = await api.getSubmissionDetails(result.submission.id);
      setVersions(details.versions);

      showToast(`Analysis complete: Found ${result.issues.length} compliance item(s).`);
      onSubmissionUpdated?.();
    } catch (err: any) {
      setAnalysisError(err.message || 'Failed to complete compliance analysis.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Apply single correction
  const handleApplySingleCorrection = async (issue: ComplianceIssue, replacementText: string) => {
    if (!activeSubmission) return;

    // Replace first occurrence of problematic text in content
    const updatedContent = content.replace(issue.problematic_text, replacementText);
    setContent(updatedContent);

    // Update issue status to Accepted in DB
    await api.updateIssueStatus(activeSubmission.id, issue.id, 'Accepted', replacementText);

    // Save updated content as new version in DB
    const res = await api.updateContent(activeSubmission.id, updatedContent);
    setActiveSubmission(res.submission);

    // Update local issue state
    setIssues((prev) =>
      prev.map((i) => (i.id === issue.id ? { ...i, human_status: 'Accepted', suggested_correction: replacementText } : i))
    );

    showToast(`Applied correction: "${issue.problematic_text}" → "${replacementText}"`);
    onSubmissionUpdated?.();
  };

  // Reject single suggestion
  const handleRejectIssue = async (issue: ComplianceIssue) => {
    if (!activeSubmission) return;
    await api.updateIssueStatus(activeSubmission.id, issue.id, 'Rejected');
    setIssues((prev) =>
      prev.map((i) => (i.id === issue.id ? { ...i, human_status: 'Rejected' } : i))
    );
    showToast(`Flag marked as rejected by creator.`);
  };

  // Apply all pending corrections
  const handleApplyAllCorrections = async () => {
    if (!activeSubmission) return;
    let newContent = content;

    for (const issue of issues) {
      if (issue.human_status !== 'Rejected' && issue.suggested_correction) {
        newContent = newContent.replace(issue.problematic_text, issue.suggested_correction);
        await api.updateIssueStatus(activeSubmission.id, issue.id, 'Accepted');
      }
    }

    setContent(newContent);
    const res = await api.updateContent(activeSubmission.id, newContent);
    setActiveSubmission(res.submission);

    setIssues((prev) =>
      prev.map((i) => (i.human_status !== 'Rejected' ? { ...i, human_status: 'Accepted' } : i))
    );

    showToast('Applied all recommended brand corrections.');
    onSubmissionUpdated?.();
  };

  // Submit revised content for Manager Approval
  const handleSubmitForApproval = async () => {
    if (!activeSubmission) return;
    try {
      await api.submitForReview(activeSubmission.id);
      showToast('Content successfully submitted for Brand Manager review!');
      onSubmissionUpdated?.();
      if (onNavigateToApproval) {
        onNavigateToApproval(activeSubmission.id);
      }
    } catch (err: any) {
      setAnalysisError(err.message || 'Failed to submit for approval.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-lg shadow-lg border border-teal-500/40 text-xs flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner & Demo Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <FileSearch className="w-5 h-5 text-teal-600" />
              <span>Content Review & AI Compliance Scanner</span>
            </h2>
            {activeSubmission && (
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 font-mono">
                {activeSubmission.id}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time compliance checks against approved facts, brand tone, restricted claims, and terminology
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handlePreloadDemoContent}
            className="px-3.5 py-1.5 text-xs font-semibold bg-teal-50 text-teal-800 hover:bg-teal-100 border border-teal-200 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            <span>Load Sample Benchmark Copy</span>
          </button>

          <label className="px-3.5 py-1.5 text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 rounded-lg cursor-pointer transition-colors flex items-center gap-1.5">
            <Upload className="w-3.5 h-3.5 text-slate-600" />
            <span>Upload Document</span>
            <input
              type="file"
              accept=".pdf,.docx,.txt,text/plain,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Main Review Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Content Input & Editor (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
            {/* Metadata inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Content Title</label>
                <input
                  type="text"
                  placeholder="e.g. Q1 Global Cloud Launch Copy"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Content Channel</label>
                <select
                  value={contentType}
                  onChange={(e) => setContentType(e.target.value as ContentType)}
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="Social Media">Social Media</option>
                  <option value="Email Campaign">Email Campaign</option>
                  <option value="Advertisement">Advertisement</option>
                  <option value="Website Copy">Website Copy</option>
                  <option value="Press Release">Press Release</option>
                </select>
              </div>
            </div>

            {/* View Mode Switcher */}
            <div className="flex items-center justify-between pt-1">
              <label className="text-[11px] font-semibold text-slate-700">
                Draft Content Text ({content.length} chars)
              </label>

              {activeSubmission && (
                <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded text-[11px]">
                  <button
                    onClick={() => setViewMode('editor')}
                    className={`px-2 py-0.5 rounded font-medium ${
                      viewMode === 'editor' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                    }`}
                  >
                    Editor
                  </button>
                  <button
                    onClick={() => setViewMode('compare')}
                    className={`px-2 py-0.5 rounded font-medium flex items-center gap-1 ${
                      viewMode === 'compare' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                    }`}
                  >
                    <Eye className="w-3 h-3" />
                    <span>Compare Original vs Current</span>
                  </button>
                </div>
              )}
            </div>

            {/* Editor or Compare View */}
            {viewMode === 'editor' ? (
              <textarea
                rows={10}
                placeholder="Paste marketing copy, press statement, product claim, or website text here to analyze against brand rules..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full text-xs font-mono p-3.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 leading-relaxed"
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div>
                  <div className="text-[11px] font-bold uppercase text-slate-500 mb-1.5 flex items-center gap-1">
                    <span>Original Submission</span>
                  </div>
                  <div className="p-2.5 bg-white rounded border border-slate-200 text-slate-600 leading-relaxed min-h-[140px] whitespace-pre-wrap">
                    {activeSubmission?.original_content || content}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] font-bold uppercase text-teal-700 mb-1.5 flex items-center gap-1">
                    <span>Current Revised Version</span>
                  </div>
                  <div className="p-2.5 bg-teal-50/50 rounded border border-teal-200 text-teal-950 leading-relaxed min-h-[140px] whitespace-pre-wrap">
                    {content}
                  </div>
                </div>
              </div>
            )}

            {/* Analysis Error */}
            {analysisError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{analysisError}</span>
              </div>
            )}

            {/* Primary Action Button Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
              >
                {isAnalyzing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Auditing against brand rules...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-teal-400" />
                    <span>ANALYSE CONTENT</span>
                  </>
                )}
              </button>

              {activeSubmission && (
                <div className="flex items-center gap-2">
                  {issues.length > 0 && issues.some((i) => i.human_status === 'Pending') && (
                    <button
                      onClick={handleApplyAllCorrections}
                      className="px-3 py-2 text-xs font-medium bg-teal-50 text-teal-800 hover:bg-teal-100 border border-teal-200 rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Apply All AI Corrections</span>
                    </button>
                  )}

                  <button
                    onClick={handleSubmitForApproval}
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send for Manager Approval</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Version History Drawer */}
          {versions.length > 0 && (
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-xs">
              <div className="flex items-center justify-between mb-2">
                <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-slate-500" />
                  <span>Version History & Audit Log ({versions.length} versions)</span>
                </div>
                <span className="text-[11px] text-slate-400">Creator revisions preserved in database</span>
              </div>
              <div className="space-y-1.5">
                {versions.map((ver) => (
                  <div
                    key={ver.id}
                    className="flex items-center justify-between p-2 rounded bg-slate-50 hover:bg-slate-100 transition-colors text-slate-700"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900">v{ver.version_number}</span>
                      <span className="text-slate-400 font-mono text-[11px]">
                        {new Date(ver.created_at).toLocaleTimeString()} · {ver.content.slice(0, 48)}...
                      </span>
                    </div>
                    <button
                      onClick={() => setContent(ver.content)}
                      className="text-[11px] font-medium text-teal-700 hover:underline"
                    >
                      Restore to Editor
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Compliance Findings & AI Corrections (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Compliance Score Widget */}
          {activeSubmission ? (
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Compliance Score
                  </div>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span
                      className={`text-3xl font-extrabold font-mono tabular-nums ${
                        activeSubmission.compliance_score >= 80
                          ? 'text-teal-600'
                          : activeSubmission.compliance_score >= 50
                          ? 'text-amber-600'
                          : 'text-rose-600'
                      }`}
                    >
                      {activeSubmission.compliance_score}%
                    </span>
                    <span className="text-xs text-slate-500 font-medium">/ 100</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[11px] font-semibold text-slate-500">Submission Status</div>
                  <span
                    className={`inline-block px-2.5 py-1 rounded text-xs font-bold mt-1 ${
                      activeSubmission.status === 'Approved'
                        ? 'bg-teal-50 text-teal-700 border border-teal-200'
                        : activeSubmission.status === 'In Review'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : activeSubmission.status === 'Needs Revision'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : activeSubmission.status === 'Rejected'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {activeSubmission.status}
                  </span>
                </div>
              </div>

              {/* Explicit Heuristic Notice required in Section 7 */}
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-[11px] text-slate-500 flex items-start gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Internal Heuristic Score:</strong> Indicates alignment with current Nova Tech guidelines.
                  It does not replace human editorial sign-off.
                </span>
              </div>

              {overallSummary && (
                <p className="text-xs text-slate-600 leading-relaxed pt-1">
                  {overallSummary}
                </p>
              )}
            </div>
          ) : (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-center py-10">
              <FileSearch className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <div className="text-sm font-semibold text-slate-800">Ready for Content Review</div>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                Paste copy on the left and click <strong>ANALYSE CONTENT</strong> to test brand guidelines, facts, and prohibited phrases.
              </p>
            </div>
          )}

          {/* Detected Issues List */}
          {issues.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                <span>Detected Governance Issues ({issues.length})</span>
                <span className="text-[11px] text-slate-400 font-normal">
                  {issues.filter((i) => i.human_status === 'Accepted').length} of {issues.length} resolved
                </span>
              </div>

              {issues.map((issue) => {
                let sevStyle = 'bg-amber-50 text-amber-800 border-amber-200';
                if (issue.severity === 'High') sevStyle = 'bg-rose-50 text-rose-800 border-rose-200';
                else if (issue.severity === 'Low') sevStyle = 'bg-blue-50 text-blue-800 border-blue-200';

                const isResolved = issue.human_status === 'Accepted';
                const isRejected = issue.human_status === 'Rejected';

                return (
                  <div
                    key={issue.id}
                    className={`bg-white rounded-xl border p-4 shadow-sm transition-all ${
                      isResolved
                        ? 'border-teal-200 bg-teal-50/20'
                        : isRejected
                        ? 'border-slate-200 opacity-60'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {/* Issue Header */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                          <span className="font-semibold text-slate-700">{issue.category}</span>
                          <span>·</span>
                          <span className="font-mono">{issue.source_guideline_id || 'Standard'}</span>
                          <span>·</span>
                          <span className="text-slate-400">Confidence: {issue.confidence}</span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 mt-0.5">{issue.title}</h4>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${sevStyle}`}>
                        {issue.severity}
                      </span>
                    </div>

                    {/* Problematic Text Excerpt */}
                    <div className="p-2 rounded bg-rose-50/70 border border-rose-100 text-xs text-rose-950 font-mono mb-2">
                      <span className="text-[10px] uppercase font-bold text-rose-700 block font-sans mb-0.5">
                        Flagged Phrase:
                      </span>
                      "{issue.problematic_text}"
                    </div>

                    {/* Why this is flagged */}
                    <p className="text-xs text-slate-600 leading-relaxed mb-3">
                      {issue.explanation}
                    </p>

                    {/* AI Suggested Correction */}
                    <div className="p-2.5 rounded-lg bg-teal-50/60 border border-teal-200 text-xs mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-[11px] uppercase tracking-wider text-teal-900 flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-teal-600" />
                          <span>Suggested Correction:</span>
                        </span>
                        {editingIssueId !== issue.id && !isResolved && (
                          <button
                            onClick={() => {
                              setEditingIssueId(issue.id);
                              setCustomCorrection(issue.suggested_correction);
                            }}
                            className="text-[10px] text-teal-700 hover:underline flex items-center gap-0.5 font-medium"
                          >
                            <Edit3 className="w-2.5 h-2.5" />
                            <span>Edit Suggestion</span>
                          </button>
                        )}
                      </div>

                      {editingIssueId === issue.id ? (
                        <div className="space-y-2 mt-1">
                          <input
                            type="text"
                            value={customCorrection}
                            onChange={(e) => setCustomCorrection(e.target.value)}
                            className="w-full text-xs p-1.5 bg-white border border-teal-300 rounded focus:ring-1 focus:ring-teal-500"
                          />
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => setEditingIssueId(null)}
                              className="text-[10px] px-2 py-0.5 rounded bg-slate-200 text-slate-700"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => {
                                handleApplySingleCorrection(issue, customCorrection);
                                setEditingIssueId(null);
                              }}
                              className="text-[10px] px-2 py-0.5 rounded bg-teal-600 text-white font-medium"
                            >
                              Apply Custom
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="font-semibold text-teal-950 font-sans">
                          "{issue.suggested_correction}"
                        </div>
                      )}
                    </div>

                    {/* Human Action Controls */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                      <span className="text-[11px] text-slate-400">
                        Status: <strong className="text-slate-700">{issue.human_status}</strong>
                      </span>

                      {!isResolved && !isRejected ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleRejectIssue(issue)}
                            className="px-2 py-1 text-[11px] text-slate-600 hover:bg-slate-100 rounded transition-colors flex items-center gap-1"
                            title="Dismiss issue without changing content"
                          >
                            <X className="w-3 h-3 text-slate-400" />
                            <span>Dismiss</span>
                          </button>
                          <button
                            onClick={() => handleApplySingleCorrection(issue, issue.suggested_correction)}
                            className="px-3 py-1 text-[11px] font-semibold bg-teal-600 hover:bg-teal-700 text-white rounded transition-colors flex items-center gap-1 shadow-xs"
                          >
                            <Check className="w-3 h-3" />
                            <span>Accept & Apply</span>
                          </button>
                        </div>
                      ) : isResolved ? (
                        <span className="text-[11px] font-semibold text-teal-700 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Correction Applied</span>
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Dismissed by creator</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
