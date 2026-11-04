import React from 'react';
import {
  Settings,
  Users,
  Shield,
  Sparkles,
  RefreshCw,
  Building2,
  Lock,
  Layers,
  CheckCircle2,
  Cpu,
} from 'lucide-react';
import { User } from '../../types';

interface SettingsProps {
  currentUser: User | null;
  users: User[];
  onSwitchUser: (userId: string) => void;
  onResetDemo: () => void;
  isResetting?: boolean;
}

export const SettingsTab: React.FC<SettingsProps> = ({
  currentUser,
  users,
  onSwitchUser,
  onResetDemo,
  isResetting = false,
}) => {
  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Settings className="w-5 h-5 text-teal-600" />
            <span>Platform Governance & Workspace Settings</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Role-based access permissions, Responsible AI audit disclosure, and workspace controls
          </p>
        </div>

        <button
          onClick={onResetDemo}
          disabled={isResetting}
          className="px-3.5 py-2 text-xs font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
          <span>Reset Sample Demo Data</span>
        </button>
      </div>

      {/* Role-Based Access Control (RBAC) */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-teal-600" />
              <span>User & Role Governance (RBAC)</span>
            </h3>
            <p className="text-xs text-slate-500">
              Switch between personas to test role-specific authority in the application
            </p>
          </div>
          <span className="text-xs font-mono text-slate-500">Active: {currentUser?.name}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {users.map((user) => {
            const isCurrent = user.id === currentUser?.id;
            return (
              <div
                key={user.id}
                className={`p-4 rounded-xl border transition-all ${
                  isCurrent
                    ? 'border-teal-500 bg-teal-50/20 ring-1 ring-teal-500 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono">
                    {user.role.replace('_', ' ')}
                  </span>
                  {isCurrent && (
                    <span className="text-[11px] font-semibold text-teal-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Active</span>
                    </span>
                  )}
                </div>

                <div className="font-bold text-sm text-slate-900">{user.name}</div>
                <div className="text-xs text-slate-500">{user.email}</div>

                <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-600 space-y-1">
                  {user.role === 'creator' && (
                    <p>Can submit copy, trigger AI scans, apply suggestions, and submit for sign-off.</p>
                  )}
                  {user.role === 'brand_manager' && (
                    <p>Authority to inspect compliance scores, append audit feedback, approve, or reject.</p>
                  )}
                  {user.role === 'admin' && (
                    <p>Full administrative rights: add guidelines, update corporate facts, and manage users.</p>
                  )}
                </div>

                <button
                  onClick={() => onSwitchUser(user.id)}
                  disabled={isCurrent}
                  className={`mt-3 w-full py-1.5 text-xs font-semibold rounded-md transition-colors ${
                    isCurrent
                      ? 'bg-teal-600 text-white cursor-default'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                  }`}
                >
                  {isCurrent ? 'Current Persona' : 'Switch to Persona'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Security & Responsible AI Framework */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Shield className="w-4 h-4 text-teal-600" />
          <span>Security & Responsible AI Architecture</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-slate-700" />
              <span>Human-in-the-Loop Safeguards</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              BrandGuard AI will never autonomously publish or broadcast marketing material. All algorithmic scans serve
              as guidance for human creators and brand managers who hold final release authority.
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-slate-700" />
              <span>Dual Engine Resilience</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Integrated with Google Gemini 3.8 Flash for contextual nuance, backed by a deterministic rule-based
              engine. If external AI API connectivity is absent, governance auditing continues seamlessly.
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-700" />
              <span>Anti-Hallucination & Fact Grounding</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Numeric assertions and statistics absent from the corporate knowledge base are explicitly classified as
              "Unverified" rather than arbitrarily deemed false, preventing false certainty.
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-700" />
              <span>Immutable Version & Audit Trails</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Every applied correction generates an incremental version entry in the SQLite schema, ensuring full
              regulatory compliance and review traceability.
            </p>
          </div>
        </div>
      </div>

      {/* Round 3 Future Scope (Section 14 Requirement) */}
      <div className="bg-slate-900 text-slate-100 p-6 rounded-xl border border-slate-800 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-teal-400 text-xs font-semibold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Round 3 Architectural Roadmap</span>
        </div>
        <h3 className="text-base font-bold text-white">Extensibility & Production Migration Paths</h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          The current modular architecture is designed for immediate extension into upcoming production phases:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs pt-1">
          <div className="p-3 rounded-lg bg-slate-800/80 border border-slate-700">
            <div className="font-bold text-teal-300 mb-1">1. Advanced Vector RAG</div>
            <p className="text-slate-400 text-[11px]">
              ChromaDB / FAISS vector indexing with semantic embeddings for large-scale multi-policy retrieval.
            </p>
          </div>
          <div className="p-3 rounded-lg bg-slate-800/80 border border-slate-700">
            <div className="font-bold text-teal-300 mb-1">2. Vision Brand Governance</div>
            <p className="text-slate-400 text-[11px]">
              OpenCV & Gemini Multimodal inspection for logo clear space, color temperature, and typography compliance.
            </p>
          </div>
          <div className="p-3 rounded-lg bg-slate-800/80 border border-slate-700">
            <div className="font-bold text-teal-300 mb-1">3. Enterprise Scale</div>
            <p className="text-slate-400 text-[11px]">
              Direct migration from SQLite to PostgreSQL with SSO, OAuth, and multi-tenant department segregation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
