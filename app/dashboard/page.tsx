'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import DomainRings from '@/components/DomainRings';
import ActionCard from '@/components/ActionCard';
import SaveProgressModal from '@/components/SaveProgressModal';
import { loadState, completedAction, updatePlan } from '@/lib/store';
import { generateDailyPlan } from '@/lib/mock-ai';
import type { AppState } from '@/lib/types';

const NAV_ITEMS = [
  { label: 'Dashboard', icon: '⬡', href: '/dashboard' },
  { label: 'Plan', icon: '◈', href: '/plan' },
  { label: 'Patterns', icon: '⟁', href: '/patterns' },
  { label: 'Goals', icon: '◎', href: '/goals' },
];

const MOBILE_NAV = [
  { label: 'Today', icon: HomeIcon, href: '/dashboard' },
  { label: 'Plan', icon: PlanIcon, href: '/plan' },
  { label: 'Patterns', icon: PatternIcon, href: '/patterns' },
  { label: 'Goals', icon: GoalIcon, href: '/goals' },
];

function HomeIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
}
function PlanIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>;
}
function PatternIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>;
}
function GoalIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>;
}

function formatDate() {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

function shouldShowSavePrompt(s: AppState): boolean {
  if (s.profile.phone) return false;          // already saved
  if (s.profile.phoneSkipped) return false;   // user dismissed it
  const completedCount = s.todaysPlan?.actions.filter(a => a.completed).length ?? 0;
  return completedCount >= 1;                 // show after first completion
}

export default function Dashboard() {
  const router = useRouter();
  const [state, setState] = useState<AppState | null>(null);
  const [mounted, setMounted] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showSavedConfirmation, setShowSavedConfirmation] = useState(false);

  useEffect(() => {
    const s = loadState();
    if (!s.profile.onboarded) {
      router.replace('/');
      return;
    }
    const today = new Date().toISOString().split('T')[0];
    if (!s.todaysPlan || s.todaysPlan.date !== today) {
      const plan = generateDailyPlan(s.profile, s.domainScores);
      updatePlan(plan);
      setState({ ...s, todaysPlan: plan });
    } else {
      setState(s);
    }
    setMounted(true);
  }, [router]);

  const handleComplete = useCallback((actionId: string) => {
    completedAction(actionId);
    const updated = loadState();
    setState(updated);
    // Show save modal after short delay so the completion animation plays first
    if (shouldShowSavePrompt(updated)) {
      setTimeout(() => setShowSaveModal(true), 700);
    }
  }, []);

  const handleSaved = useCallback(() => {
    setShowSaveModal(false);
    setState(loadState());
    setShowSavedConfirmation(true);
    setTimeout(() => setShowSavedConfirmation(false), 3000);
  }, []);

  const handleSkip = useCallback(() => {
    setShowSaveModal(false);
    setState(loadState());
  }, []);

  if (!mounted || !state) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div style={{ width: 32, height: 32, border: '2px solid rgba(168,255,62,0.2)', borderTopColor: '#a8ff3e', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const { domainScores, todaysPlan, streak, longestStreak, currentGoal, profile } = state;
  const nextAction = todaysPlan?.actions.find(a => !a.completed);
  const completedCount = todaysPlan?.actions.filter(a => a.completed).length ?? 0;
  const totalCount = todaysPlan?.actions.length ?? 0;
  const goalPct = Math.min(100, (currentGoal.completedDays / currentGoal.targetDays) * 100);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="app-shell">
      {/* Sidebar */}
      <nav className="sidebar">
        <div className="logo">
          <div className="logo-mark">T</div>
          <span className="logo-name">Trinitect</span>
        </div>

        <div className="nav-group">
          <span className="nav-label">Navigate</span>
          {NAV_ITEMS.map(item => (
            <button
              key={item.label}
              className={`nav-item ${item.href === '/dashboard' ? 'active' : ''}`}
              onClick={() => router.push(item.href)}
            >
              <span style={{ fontFamily: 'monospace', fontSize: 14 }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>

        <div className="streak-chip">
          <span className="streak-num">{streak}</span>
          <span className="streak-label">day streak</span>
        </div>
      </nav>

      {/* Main */}
      <main className="main-content">
        <div className="page-header fade-up">
          <h1 className="page-greeting">{greeting()}{profile.name ? `, ${profile.name}` : '.'}</h1>
          <p className="page-date">{formatDate()}</p>
        </div>

        {/* Saved confirmation toast */}
        {showSavedConfirmation && (
          <div style={{
            position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)',
            background: 'var(--surface)',
            border: '1px solid rgba(168,255,62,0.3)',
            borderRadius: 40,
            padding: '10px 20px',
            display: 'flex', alignItems: 'center', gap: 10,
            zIndex: 600,
            animation: 'fadeUp 0.3s ease both',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            whiteSpace: 'nowrap',
          }}>
            <span style={{ color: 'var(--physical)', fontSize: 15 }}>✓</span>
            <span style={{ fontSize: 13, color: 'var(--text1)', fontWeight: 500 }}>Progress saved</span>
          </div>
        )}

        <div className="dashboard-grid">
          <div className="dashboard-left">

            {/* Next best action banner */}
            {nextAction && (
              <div className="next-action-banner fade-up fade-up-d1" title={nextAction.description}>
                <div className="next-action-pulse" />
                <div style={{ flex: 1 }}>
                  <div className="next-action-label">Next best action</div>
                  <div className="next-action-text">{nextAction.title}</div>
                </div>
                <span className="next-action-arrow">→</span>
              </div>
            )}

            {/* Domain rings */}
            <div className="panel fade-up fade-up-d2">
              <div className="panel-title">Domain Balance</div>
              <DomainRings scores={domainScores} />
            </div>

            {/* Today's plan */}
            <div className="panel fade-up fade-up-d3">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                <div className="panel-title" style={{ marginBottom: 0 }}>Today's Plan</div>
                <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: completedCount === totalCount ? 'var(--physical)' : 'var(--text3)' }}>
                  {completedCount}/{totalCount} done
                </span>
              </div>
              <div className="actions-list">
                {todaysPlan?.actions.map((action, i) => (
                  <div key={action.id} className={`fade-up fade-up-d${i + 1}`}>
                    <ActionCard action={action} onComplete={handleComplete} />
                  </div>
                ))}
              </div>
            </div>

          </div>

          <div className="dashboard-right">

            {/* Momentum */}
            <div className="panel fade-up fade-up-d2">
              <div className="panel-title">Momentum</div>
              <div className="momentum-stats">
                <div className="stat-box">
                  <div className="stat-num" style={{ color: 'var(--physical)' }}>{streak}</div>
                  <div className="stat-label">Current streak</div>
                </div>
                <div className="stat-box">
                  <div className="stat-num" style={{ color: 'var(--mental)' }}>{longestStreak || streak}</div>
                  <div className="stat-label">Personal best</div>
                </div>
                <div className="stat-box">
                  <div className="stat-num" style={{ color: 'var(--spiritual)' }}>{completedCount}</div>
                  <div className="stat-label">Done today</div>
                </div>
                <div className="stat-box">
                  <div className="stat-num" style={{ color: 'var(--metaphysical)' }}>{totalCount - completedCount}</div>
                  <div className="stat-label">Remaining</div>
                </div>
              </div>
            </div>

            {/* Stage goal */}
            <div className="panel fade-up fade-up-d3">
              <div className="panel-title">Stage Goal</div>
              <div className="goal-name">{currentGoal.title}</div>
              <div className="goal-desc">{currentGoal.description}</div>
              <div className="goal-track">
                <div className="goal-fill" style={{ width: `${goalPct}%` }} />
              </div>
              <div className="goal-stats">
                <span className="goal-highlight">{currentGoal.completedDays} days</span>
                <span>{currentGoal.targetDays} days total</span>
              </div>
            </div>

            {/* Virtuous cycle */}
            <div className="panel fade-up fade-up-d4">
              <div className="panel-title">Virtuous Cycle</div>
              {[
                { from: 'Physical energy', to: 'Mental clarity' },
                { from: 'Mental clarity', to: 'Spiritual alignment' },
                { from: 'Spiritual alignment', to: 'Capacity to help others' },
              ].map(({ from, to }) => (
                <div key={from} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 12, color: 'var(--text2)' }}>
                  <span style={{ flex: 1 }}>{from}</span>
                  <span style={{ color: 'var(--physical)', fontFamily: 'var(--font-mono)', fontSize: 10 }}>→</span>
                  <span style={{ flex: 1, textAlign: 'right', color: 'var(--text1)' }}>{to}</span>
                </div>
              ))}
            </div>

            {/* Phone saved indicator */}
            {profile.phone && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px', borderRadius: 'var(--radius-sm)',
                background: 'var(--accent-dim)',
                border: '1px solid rgba(168,255,62,0.15)',
              }}>
                <span style={{ color: 'var(--physical)', fontSize: 13 }}>✓</span>
                <span style={{ fontSize: 12, color: 'var(--text2)' }}>
                  Progress saved · {profile.phone.replace('+1', '').replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3')}
                </span>
              </div>
            )}

          </div>
        </div>
      </main>

      {/* Mobile bottom nav */}
      <div className="mobile-nav">
        <div className="mobile-nav-items">
          {MOBILE_NAV.map(item => (
            <button
              key={item.label}
              className={`mobile-nav-item ${item.href === '/dashboard' ? 'active' : ''}`}
              onClick={() => router.push(item.href)}
            >
              <item.icon />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Save progress modal */}
      {showSaveModal && (
        <SaveProgressModal onSaved={handleSaved} onSkip={handleSkip} />
      )}
    </div>
  );
}
