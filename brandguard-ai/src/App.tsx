/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Sidebar, NavItem } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { OverviewTab } from './components/overview/OverviewTab';
import { BrandKnowledgeHub } from './components/hub/BrandKnowledgeHub';
import { ContentReviewTab } from './components/review/ContentReviewTab';
import { ComplianceReportsTab } from './components/reports/ComplianceReportsTab';
import { ApprovalCentreTab } from './components/approval/ApprovalCentreTab';
import { GovernanceAnalyticsTab } from './components/analytics/GovernanceAnalyticsTab';
import { SettingsTab } from './components/settings/SettingsTab';
import {
  User,
  Guideline,
  ApprovedFact,
  TerminologyItem,
  BrandAsset,
  Submission,
  AnalyticsData,
} from './types';
import { api } from './services/api';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavItem>('overview');

  // Application data state
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [guidelines, setGuidelines] = useState<Guideline[]>([]);
  const [facts, setFacts] = useState<ApprovedFact[]>([]);
  const [terminology, setTerminology] = useState<TerminologyItem[]>([]);
  const [assets, setAssets] = useState<BrandAsset[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

  // Cross-tab review routing
  const [reviewSubmissionId, setReviewSubmissionId] = useState<string | undefined>(undefined);
  const [isResetting, setIsResetting] = useState(false);

  // Initial load
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      const [usersData, guidelinesData, factsData, termsData, assetsData, subsData, analyticsData] =
        await Promise.all([
          api.getUsers(),
          api.getGuidelines(),
          api.getFacts(),
          api.getTerminology(),
          api.getAssets(),
          api.getSubmissions(),
          api.getAnalytics(),
        ]);

      setUsers(usersData.users);
      const active = usersData.users.find((u) => u.id === usersData.currentUserId) || usersData.users[0];
      setCurrentUser(active);

      setGuidelines(guidelinesData);
      setFacts(factsData);
      setTerminology(termsData);
      setAssets(assetsData);
      setSubmissions(subsData);
      setAnalytics(analyticsData);
    } catch (err) {
      console.error('Error fetching initial application state:', err);
    }
  };

  const handleSwitchUser = async (userId: string) => {
    try {
      const res = await api.switchRole(userId);
      if (res.success) {
        setCurrentUser(res.currentUser);
      }
    } catch (err) {
      console.error('Failed to switch role:', err);
    }
  };

  const handleResetDemo = async () => {
    if (confirm('Reset database to pristine NOVA TECH demo state with verified facts & rules?')) {
      setIsResetting(true);
      try {
        await api.resetDemo();
        await loadAllData();
      } catch (err) {
        console.error('Reset failed:', err);
      } finally {
        setIsResetting(false);
      }
    }
  };

  // Launch Judge Test Flight
  const handleQuickTestDemo = () => {
    setReviewSubmissionId(undefined);
    setCurrentTab('review');
  };

  // Tab Title mapping
  const tabTitles: Record<NavItem, string> = {
    overview: 'Overview',
    hub: 'Brand Knowledge Hub',
    review: 'Content Review',
    reports: 'Compliance Reports',
    approval: 'Approval Centre',
    analytics: 'Governance Analytics',
    settings: 'Settings & RBAC',
  };

  const pendingCount = submissions.filter((s) => s.status === 'In Review').length;

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      {/* 1. Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setReviewSubmissionId(undefined);
          setCurrentTab(tab);
        }}
        pendingCount={pendingCount}
      />

      {/* 2. Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <Header
          currentTabName={tabTitles[currentTab]}
          currentUser={currentUser}
          users={users}
          onSwitchUser={handleSwitchUser}
          onResetDemo={handleResetDemo}
          isResetting={isResetting}
        />

        {/* Content Viewport */}
        <main className="flex-1 p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {currentTab === 'overview' && (
            <OverviewTab
              analytics={analytics}
              submissions={submissions}
              onNavigate={(tab, subId) => {
                if (subId) setReviewSubmissionId(subId);
                setCurrentTab(tab);
              }}
              onQuickTestDemo={handleQuickTestDemo}
            />
          )}

          {currentTab === 'hub' && (
            <BrandKnowledgeHub
              guidelines={guidelines}
              facts={facts}
              terminology={terminology}
              assets={assets}
              onRefresh={loadAllData}
            />
          )}

          {currentTab === 'review' && (
            <ContentReviewTab
              initialSubmissionId={reviewSubmissionId}
              onSubmissionUpdated={loadAllData}
              onNavigateToApproval={(subId) => {
                setReviewSubmissionId(subId);
                setCurrentTab('approval');
              }}
              onNavigateToReport={(subId) => {
                setReviewSubmissionId(subId);
                setCurrentTab('reports');
              }}
            />
          )}

          {currentTab === 'reports' && (
            <ComplianceReportsTab submissions={submissions} />
          )}

          {currentTab === 'approval' && (
            <ApprovalCentreTab
              submissions={submissions}
              currentUser={currentUser}
              onRefresh={loadAllData}
              onSelectSubmissionForReview={(subId) => {
                setReviewSubmissionId(subId);
                setCurrentTab('review');
              }}
              onSwitchUser={handleSwitchUser}
            />
          )}

          {currentTab === 'analytics' && (
            <GovernanceAnalyticsTab
              analytics={analytics}
              onRefresh={loadAllData}
            />
          )}

          {currentTab === 'settings' && (
            <SettingsTab
              currentUser={currentUser}
              users={users}
              onSwitchUser={handleSwitchUser}
              onResetDemo={handleResetDemo}
              isResetting={isResetting}
            />
          )}
        </main>
      </div>
    </div>
  );
}
