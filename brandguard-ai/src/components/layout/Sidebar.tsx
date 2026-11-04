import React from 'react';
import {
  LayoutDashboard,
  BookOpen,
  FileSearch,
  FileCheck2,
  ShieldCheck,
  BarChart3,
  Settings,
  Sparkles,
  Building2,
} from 'lucide-react';

export type NavItem =
  | 'overview'
  | 'hub'
  | 'review'
  | 'reports'
  | 'approval'
  | 'analytics'
  | 'settings';

interface SidebarProps {
  currentTab: NavItem;
  onSelectTab: (tab: NavItem) => void;
  pendingCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab, pendingCount = 0 }) => {
  const menuItems = [
    { id: 'overview' as NavItem, label: 'Overview', icon: LayoutDashboard },
    { id: 'hub' as NavItem, label: 'Brand Knowledge Hub', icon: BookOpen },
    { id: 'review' as NavItem, label: 'Content Review', icon: FileSearch, highlight: true },
    { id: 'reports' as NavItem, label: 'Compliance Reports', icon: FileCheck2 },
    { id: 'approval' as NavItem, label: 'Approval Centre', icon: ShieldCheck, badge: pendingCount > 0 ? pendingCount : undefined },
    { id: 'analytics' as NavItem, label: 'Governance Analytics', icon: BarChart3 },
    { id: 'settings' as NavItem, label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 shrink-0 bg-slate-900 text-slate-100 flex flex-col min-h-screen border-r border-slate-800 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400 font-bold text-lg">
            BG
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
              BrandGuard AI
            </h1>
            <p className="text-xs text-slate-400">Governance Platform</p>
          </div>
        </div>

        {/* Workspace info */}
        <div className="mt-4 p-2.5 rounded-md bg-slate-800/60 border border-slate-700/60 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 truncate">
            <Building2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
            <span className="text-slate-300 font-medium truncate">NOVA TECH</span>
          </div>
          <span className="text-slate-400 font-mono text-[11px]">Enterprise</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Navigation
        </div>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-teal-600 text-white shadow-sm font-semibold'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span className="text-xs font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500 text-slate-950">
                  {item.badge}
                </span>
              )}
              {item.highlight && !item.badge && (
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  Core
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40 text-xs text-slate-400">
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
          <Sparkles className="w-3.5 h-3.5 text-teal-400 shrink-0" />
          <span>Assisting humans, not replacing</span>
        </div>
      </div>
    </aside>
  );
};
