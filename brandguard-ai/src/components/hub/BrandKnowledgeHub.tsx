import React, { useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Upload,
  FileText,
  Search,
  Tag,
  Palette,
  Shield,
  Layers,
  Sparkles,
} from 'lucide-react';
import {
  Guideline,
  ApprovedFact,
  TerminologyItem,
  BrandAsset,
  GuidelineCategory,
  SeverityLevel,
} from '../../types';
import { api } from '../../services/api';

interface HubProps {
  guidelines: Guideline[];
  facts: ApprovedFact[];
  terminology: TerminologyItem[];
  assets: BrandAsset[];
  onRefresh: () => void;
}

type HubSection = 'guidelines' | 'facts' | 'terminology' | 'assets' | 'upload_doc';

export const BrandKnowledgeHub: React.FC<HubProps> = ({
  guidelines,
  facts,
  terminology,
  assets,
  onRefresh,
}) => {
  const [activeSection, setActiveSection] = useState<HubSection>('guidelines');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Modals & form state
  const [isAddingGuideline, setIsAddingGuideline] = useState(false);
  const [newGuideline, setNewGuideline] = useState<{
    title: string;
    category: GuidelineCategory;
    description: string;
    severity: SeverityLevel;
    source_document: string;
    prohibited_phrase: string;
    preferred_replacement: string;
  }>({
    title: '',
    category: 'Tone',
    description: '',
    severity: 'Medium',
    source_document: 'NovaTech_Policy_Addendum_2026.pdf',
    prohibited_phrase: '',
    preferred_replacement: '',
  });

  const [isAddingFact, setIsAddingFact] = useState(false);
  const [newFact, setNewFact] = useState({ fact: '', source: '' });

  const [isAddingTerm, setIsAddingTerm] = useState(false);
  const [newTerm, setNewTerm] = useState({ prohibited_term: '', preferred_term: '', explanation: '' });

  // Document Upload & Preview State
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [extractedDocText, setExtractedDocText] = useState<string>('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);

  // Filters
  const filteredGuidelines = guidelines.filter((g) => {
    const matchesSearch =
      g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (g.prohibited_phrase && g.prohibited_phrase.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCat = selectedCategory === 'All' || g.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const filteredFacts = facts.filter(
    (f) =>
      f.fact.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.source.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredTerms = terminology.filter(
    (t) =>
      t.prohibited_term.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.preferred_term.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.explanation.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handlers
  const handleCreateGuideline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGuideline.title || !newGuideline.description) return;
    await api.createGuideline(newGuideline);
    setIsAddingGuideline(false);
    setNewGuideline({
      title: '',
      category: 'Tone',
      description: '',
      severity: 'Medium',
      source_document: 'NovaTech_Policy_Addendum_2026.pdf',
      prohibited_phrase: '',
      preferred_replacement: '',
    });
    onRefresh();
  };

  const handleDeleteGuideline = async (id: string) => {
    if (confirm('Delete this brand guideline rule?')) {
      await api.deleteGuideline(id);
      onRefresh();
    }
  };

  const handleCreateFact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFact.fact || !newFact.source) return;
    await api.createFact(newFact);
    setIsAddingFact(false);
    setNewFact({ fact: '', source: '' });
    onRefresh();
  };

  const handleDeleteFact = async (id: string) => {
    if (confirm('Delete this approved fact?')) {
      await api.deleteFact(id);
      onRefresh();
    }
  };

  const handleCreateTerm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTerm.prohibited_term || !newTerm.preferred_term) return;
    await api.createTerminology(newTerm);
    setIsAddingTerm(false);
    setNewTerm({ prohibited_term: '', preferred_term: '', explanation: '' });
    onRefresh();
  };

  const handleDeleteTerm = async (id: string) => {
    if (confirm('Delete this terminology rule?')) {
      await api.deleteTerminology(id);
      onRefresh();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);
    setIsExtracting(true);
    setExtractError(null);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64 = (reader.result as string).split(',')[1];
          const result = await api.parseDocument(base64, file.name, file.type);
          setExtractedDocText(result.text);
        } catch (err: any) {
          setExtractError(err.message || 'Error extracting document text.');
        } finally {
          setIsExtracting(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setExtractError(err.message || 'Failed reading file.');
      setIsExtracting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and section switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-teal-600" />
            <span>Brand Knowledge Hub</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Single source of truth for approved brand guidelines, verified facts, and corporate glossary
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-lg text-xs font-medium">
          <button
            onClick={() => setActiveSection('guidelines')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeSection === 'guidelines'
                ? 'bg-white text-slate-900 shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Guidelines ({guidelines.length})
          </button>
          <button
            onClick={() => setActiveSection('facts')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeSection === 'facts'
                ? 'bg-white text-slate-900 shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Approved Facts ({facts.length})
          </button>
          <button
            onClick={() => setActiveSection('terminology')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeSection === 'terminology'
                ? 'bg-white text-slate-900 shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Terminology ({terminology.length})
          </button>
          <button
            onClick={() => setActiveSection('assets')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeSection === 'assets'
                ? 'bg-white text-slate-900 shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Brand Assets ({assets.length})
          </button>
          <button
            onClick={() => setActiveSection('upload_doc')}
            className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1 ${
              activeSection === 'upload_doc'
                ? 'bg-teal-600 text-white shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Guidelines</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: GUIDELINES */}
      {activeSection === 'guidelines' && (
        <div className="space-y-4">
          {/* Action bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 flex-1 max-w-lg">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search guidelines, prohibited words..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                aria-label="Filter guideline categories"
                className="text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="All">All Categories</option>
                <option value="Tone">Tone</option>
                <option value="Terminology">Terminology</option>
                <option value="Messaging">Messaging</option>
                <option value="Facts">Facts</option>
                <option value="Claims">Claims</option>
                <option value="Visual identity">Visual identity</option>
                <option value="Accessibility">Accessibility</option>
              </select>
            </div>

            <button
              onClick={() => setIsAddingGuideline(true)}
              className="px-3.5 py-2 text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add Brand Rule</span>
            </button>
          </div>

          {/* Add Guideline Modal */}
          {isAddingGuideline && (
            <div className="bg-white p-5 rounded-xl border border-teal-200 shadow-md">
              <h3 className="text-sm font-bold text-slate-900 mb-3">Create New Brand Guideline Rule</h3>
              <form onSubmit={handleCreateGuideline} className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Rule Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Friendly & Informative Tone"
                      value={newGuideline.title}
                      onChange={(e) => setNewGuideline({ ...newGuideline, title: e.target.value })}
                      className="w-full text-xs p-2 border border-slate-200 rounded-md focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Category</label>
                    <select
                      value={newGuideline.category}
                      onChange={(e) => setNewGuideline({ ...newGuideline, category: e.target.value as any })}
                      className="w-full text-xs p-2 border border-slate-200 rounded-md"
                    >
                      <option value="Tone">Tone</option>
                      <option value="Terminology">Terminology</option>
                      <option value="Messaging">Messaging</option>
                      <option value="Facts">Facts</option>
                      <option value="Claims">Claims</option>
                      <option value="Visual identity">Visual identity</option>
                      <option value="Accessibility">Accessibility</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Severity</label>
                    <select
                      value={newGuideline.severity}
                      onChange={(e) => setNewGuideline({ ...newGuideline, severity: e.target.value as any })}
                      className="w-full text-xs p-2 border border-slate-200 rounded-md"
                    >
                      <option value="High">High (Blocking Violation)</option>
                      <option value="Medium">Medium (Correction Required)</option>
                      <option value="Low">Low (Stylistic Advisory)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Rule Description & Rationale</label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Provide full description of why this rule exists and how creators should adhere..."
                    value={newGuideline.description}
                    onChange={(e) => setNewGuideline({ ...newGuideline, description: e.target.value })}
                    className="w-full text-xs p-2 border border-slate-200 rounded-md focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Prohibited Phrase (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. guarantees results"
                      value={newGuideline.prohibited_phrase}
                      onChange={(e) => setNewGuideline({ ...newGuideline, prohibited_phrase: e.target.value })}
                      className="w-full text-xs p-2 border border-slate-200 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Preferred Replacement</label>
                    <input
                      type="text"
                      placeholder="e.g. designed to deliver measurable results"
                      value={newGuideline.preferred_replacement}
                      onChange={(e) => setNewGuideline({ ...newGuideline, preferred_replacement: e.target.value })}
                      className="w-full text-xs p-2 border border-slate-200 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Source Document Reference</label>
                    <input
                      type="text"
                      placeholder="e.g. NovaTech_Brand_Guide_2026.pdf"
                      value={newGuideline.source_document}
                      onChange={(e) => setNewGuideline({ ...newGuideline, source_document: e.target.value })}
                      className="w-full text-xs p-2 border border-slate-200 rounded-md"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingGuideline(false)}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs font-semibold bg-teal-600 text-white hover:bg-teal-700 rounded-md"
                  >
                    Save Guideline
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Guidelines Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredGuidelines.map((rule) => {
              let sevColor = 'text-amber-700 bg-amber-50 border-amber-200';
              if (rule.severity === 'High') sevColor = 'text-rose-700 bg-rose-50 border-rose-200';
              else if (rule.severity === 'Low') sevColor = 'text-blue-700 bg-blue-50 border-blue-200';

              return (
                <div key={rule.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-colors">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                          <span className="font-mono text-slate-600">{rule.id}</span>
                          <span>·</span>
                          <span className="font-medium text-slate-700">{rule.category}</span>
                          <span>·</span>
                          <span>{rule.source_document || 'Corporate Standard'}</span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 mt-1">{rule.title}</h4>
                      </div>
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${sevColor}`}>
                        {rule.severity}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed mb-3">
                      {rule.description}
                    </p>

                    {(rule.prohibited_phrase || rule.preferred_replacement) && (
                      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1">
                        {rule.prohibited_phrase && (
                          <div className="flex items-center gap-1.5 text-rose-700">
                            <span className="font-semibold text-[11px] uppercase tracking-wider text-rose-800">Prohibited:</span>
                            <code className="bg-rose-100/60 px-1 rounded font-mono text-[11px]">"{rule.prohibited_phrase}"</code>
                          </div>
                        )}
                        {rule.preferred_replacement && (
                          <div className="flex items-center gap-1.5 text-teal-800">
                            <span className="font-semibold text-[11px] uppercase tracking-wider text-teal-900">Preferred:</span>
                            <span className="font-medium">"{rule.preferred_replacement}"</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 text-[11px] text-slate-500">
                    <span>Added {new Date(rule.created_at).toLocaleDateString()}</span>
                    <button
                      onClick={() => handleDeleteGuideline(rule.id)}
                      className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                      title="Delete Rule"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 2: APPROVED FACTS */}
      {activeSection === 'facts' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search verified corporate facts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <button
              onClick={() => setIsAddingFact(true)}
              className="px-3.5 py-2 text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Verified Fact</span>
            </button>
          </div>

          {isAddingFact && (
            <div className="bg-white p-5 rounded-xl border border-teal-200 shadow-md">
              <h3 className="text-sm font-bold text-slate-900 mb-2">Register Approved Corporate Fact</h3>
              <p className="text-xs text-slate-500 mb-3">
                Claims in published marketing are checked against this ledger. Missing facts are flagged as "Unverified".
              </p>
              <form onSubmit={handleCreateFact} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Fact Statement</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Nova Tech achieved 99.99% uptime SLA across 2025."
                    value={newFact.fact}
                    onChange={(e) => setNewFact({ ...newFact, fact: e.target.value })}
                    className="w-full text-xs p-2 border border-slate-200 rounded-md focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Verifiable Source / Audit Document</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SOC 2 Type II Compliance Report 2025"
                    value={newFact.source}
                    onChange={(e) => setNewFact({ ...newFact, source: e.target.value })}
                    className="w-full text-xs p-2 border border-slate-200 rounded-md focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingFact(false)}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs font-semibold bg-teal-600 text-white hover:bg-teal-700 rounded-md"
                  >
                    Save Approved Fact
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-5">ID</th>
                  <th className="py-3 px-5">Approved Fact Statement</th>
                  <th className="py-3 px-5">Verification Source</th>
                  <th className="py-3 px-5">Verified Date</th>
                  <th className="py-3 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredFacts.map((fact) => (
                  <tr key={fact.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-5 font-mono text-[11px] text-slate-500">{fact.id}</td>
                    <td className="py-3.5 px-5 font-medium text-slate-900 max-w-md">
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                        <span>{fact.fact}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-5 text-slate-600">{fact.source}</td>
                    <td className="py-3.5 px-5 text-slate-500 font-mono text-[11px]">
                      {new Date(fact.verified_at).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <button
                        onClick={() => handleDeleteFact(fact.id)}
                        className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                        title="Delete Fact"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 3: TERMINOLOGY */}
      {activeSection === 'terminology' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search prohibited or preferred terms..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <button
              onClick={() => setIsAddingTerm(true)}
              className="px-3.5 py-2 text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Terminology Rule</span>
            </button>
          </div>

          {isAddingTerm && (
            <div className="bg-white p-5 rounded-xl border border-teal-200 shadow-md">
              <h3 className="text-sm font-bold text-slate-900 mb-2">Define Corporate Terminology</h3>
              <form onSubmit={handleCreateTerm} className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Prohibited Term</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. users"
                      value={newTerm.prohibited_term}
                      onChange={(e) => setNewTerm({ ...newTerm, prohibited_term: e.target.value })}
                      className="w-full text-xs p-2 border border-slate-200 rounded-md focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Preferred Replacement Term</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. customers"
                      value={newTerm.preferred_term}
                      onChange={(e) => setNewTerm({ ...newTerm, preferred_term: e.target.value })}
                      className="w-full text-xs p-2 border border-slate-200 rounded-md focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Reason & Context</label>
                  <input
                    type="text"
                    placeholder="e.g. In marketing copy, use customers to reinforce professional relationship."
                    value={newTerm.explanation}
                    onChange={(e) => setNewTerm({ ...newTerm, explanation: e.target.value })}
                    className="w-full text-xs p-2 border border-slate-200 rounded-md"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingTerm(false)}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs font-semibold bg-teal-600 text-white hover:bg-teal-700 rounded-md"
                  >
                    Save Term Rule
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTerms.map((t) => (
              <div key={t.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono mb-2">
                    <span>{t.id}</span>
                    <button
                      onClick={() => handleDeleteTerm(t.id)}
                      className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-2 mb-3">
                    <div className="flex items-center justify-between p-2 rounded-md bg-rose-50 border border-rose-100 text-xs">
                      <span className="font-semibold text-rose-800">Prohibited:</span>
                      <code className="font-mono text-rose-900 font-bold text-xs">{t.prohibited_term}</code>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-md bg-teal-50 border border-teal-100 text-xs">
                      <span className="font-semibold text-teal-800">Preferred:</span>
                      <span className="font-bold text-teal-950 text-xs">{t.preferred_term}</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 italic">
                    {t.explanation || 'Approved brand terminology standard.'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 4: ASSETS */}
      {activeSection === 'assets' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-1">Approved Brand Visual Assets</h3>
            <p className="text-xs text-slate-500 mb-4">
              Authorized logos, corporate colors, and typography standards for NOVA TECH.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {assets.map((asset) => (
                <div key={asset.id} className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 flex flex-col justify-between">
                  <div>
                    <div className="text-[11px] font-mono text-slate-400 mb-1">{asset.asset_type} · {asset.id}</div>
                    <div className="font-bold text-sm text-slate-900 mb-2">{asset.asset_name}</div>

                    {asset.asset_type === 'Logo' && (
                      <div className="h-32 bg-white rounded border border-slate-200 flex items-center justify-center p-3 mb-3">
                        <img
                          src={asset.file_path}
                          alt={asset.asset_name}
                          className="max-h-full max-w-full object-contain"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    )}

                    {asset.asset_type === 'Color Palette' && (
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-10 h-10 rounded bg-[#0F172A] border border-slate-300" title="Deep Navy (#0F172A)" />
                        <div className="w-10 h-10 rounded bg-[#0D9488] border border-slate-300" title="Cyan Teal (#0D9488)" />
                        <div className="w-10 h-10 rounded bg-[#F8FAFC] border border-slate-300" title="Canvas Off-White (#F8FAFC)" />
                      </div>
                    )}

                    {asset.asset_type === 'Typography' && (
                      <div className="p-3 bg-white rounded border border-slate-200 mb-3 space-y-1">
                        <div className="text-lg font-bold font-sans">Plus Jakarta Sans</div>
                        <div className="text-xs font-mono text-slate-600">JetBrains Mono tabular-nums</div>
                      </div>
                    )}

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {asset.guidelines}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 5: UPLOAD GUIDELINES & PREVIEW TEXT */}
      {activeSection === 'upload_doc' && (
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-1">Upload Brand Guidelines Document</h3>
            <p className="text-xs text-slate-500 mb-5">
              Upload brand policy documents in PDF, DOCX, or TXT format. The system extracts raw text and previews the document.
            </p>

            <div className="border-2 border-dashed border-slate-300 hover:border-teal-500 rounded-xl p-8 text-center bg-slate-50/50 transition-colors">
              <Upload className="w-8 h-8 text-slate-400 mx-auto mb-3" />
              <div className="text-sm font-semibold text-slate-800 mb-1">
                Choose a PDF, DOCX, or TXT file to inspect
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Supported: .pdf, .docx, .txt (up to 20MB)
              </p>

              <label className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg cursor-pointer transition-colors">
                <FileText className="w-4 h-4" />
                <span>Select Document</span>
                <input
                  type="file"
                  accept=".pdf,.docx,.txt,text/plain,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {uploadedFile && (
                <div className="mt-4 text-xs text-slate-700 font-medium">
                  Selected: <span className="font-semibold text-slate-900">{uploadedFile.name}</span> ({(uploadedFile.size / 1024).toFixed(1)} KB)
                </div>
              )}
            </div>

            {isExtracting && (
              <div className="mt-4 p-4 rounded-lg bg-teal-50 text-teal-800 text-xs flex items-center gap-2 border border-teal-200">
                <div className="w-3.5 h-3.5 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
                <span>Extracting document text using parser engine...</span>
              </div>
            )}

            {extractError && (
              <div className="mt-4 p-4 rounded-lg bg-rose-50 text-rose-800 text-xs flex items-center gap-2 border border-rose-200">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{extractError}</span>
              </div>
            )}

            {extractedDocText && (
              <div className="mt-6 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Extracted Document Text Preview ({extractedDocText.length} characters)
                  </h4>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(extractedDocText);
                      alert('Extracted text copied to clipboard!');
                    }}
                    className="text-xs text-teal-700 hover:text-teal-800 font-semibold"
                  >
                    Copy Extracted Text
                  </button>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-xs font-mono text-slate-800 max-h-80 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                  {extractedDocText}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
