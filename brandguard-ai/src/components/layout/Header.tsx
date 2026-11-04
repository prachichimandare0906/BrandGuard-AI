import React from 'react';
import { User } from '../../types';
import { ShieldCheck, UserCheck, RefreshCw, Cpu, Sparkles } from 'lucide-react';

interface HeaderProps {
  currentTabName: string;
  currentUser: User | null;
  users: User[];
  onSwitchUser: (userId: string) => void;
  onResetDemo: () => void;
  isResetting?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentTabName,
  currentUser,
  users,
  onSwitchUser,
  onResetDemo,
  isResetting = false,
}) => {
  return (
    <header className="h-16 px-6 bg-white border-b border-slate-200 flex items-center justify-between gap-6 shrink-0 sticky top-0 z-20">
      {/* Zone 1: Breadcrumb Trail */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-slate-400 font-medium">BrandGuard</span>
        <span className="text-slate-300">/</span>
        <span className="font-semibold text-slate-800">{currentTabName}</span>
      </div>

      {/* Zone 2 & 3: Controls, Engine Status & Role Switcher */}
      <div className="flex items-center gap-3">
        {/* Engine status indicator */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-100 text-xs text-slate-600 border border-slate-200">
          <Cpu className="w-3.5 h-3.5 text-teal-600" />
          <span>AI Engine:</span>
          <span className="font-semibold text-slate-800 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-teal-600 inline" />
            Gemini 3.8 Flash + Rule Engine
          </span>
        </div>

        {/* Reset Demo Data Button */}
        <button
          onClick={onResetDemo}
          disabled={isResetting}
          title="Reset database to initial NOVA TECH sample state"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
          <span className="hidden md:inline">Reset Demo</span>
        </button>

        {/* Interactive Role Switcher for Judges */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="text-right hidden lg:block">
            <div className="text-xs font-bold text-slate-900 leading-tight">
              {currentUser?.name || 'User'}
            </div>
            <div className="text-[11px] text-teal-700 font-medium capitalize">
              Role: {currentUser?.role?.replace('_', ' ')}
            </div>
          </div>

          <div className="relative">
            <select
              value={currentUser?.id || ''}
              onChange={(e) => onSwitchUser(e.target.value)}
              aria-label="Switch active test role"
              className="text-xs font-medium bg-slate-100 border border-slate-300 text-slate-800 rounded-md py-1.5 pl-2.5 pr-7 hover:bg-slate-200 transition-colors cursor-pointer appearance-none focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role === 'brand_manager' ? 'Brand Manager' : u.role === 'admin' ? 'Administrator' : 'Creator'})
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
              <UserCheck className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
