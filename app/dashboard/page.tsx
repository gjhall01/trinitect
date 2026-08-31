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
  { label: 'Progress', icon: '⇧', href: '/progress' },
  { label: 'Community', icon: '⟡', href: '/community' },
];

const MOBILE_NAV = [
  { label: 'Today', icon: HomeIcon, href: '/dashboard' },
  { label: 'Goals', icon: GoalIcon, href: '/goals' },
  { label: 'Progress', icon: ProgressIcon, href: '/progress' },
  { label: 'Community', icon: CommunityIcon, href: '/community' },
  { label: 'Plan', icon: PlanIcon, href: '/plan' },
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
function ProgressIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>;
}
function CommunityIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>;
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
  const [showUpgradeSuccess, setShowUpgradeSuccess] = useState(false);

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

    // Show upgrade success toast if returning from Stripe
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('upgraded') === '1') {
        setShowUpgradeSuccess(true);
        setTimeout(() => setShowUpgradeSuccess(false), 6000);
        window.history.replaceState({}, '', '/dashboard');
      }
    }
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

  const { domainScores, todaysPlan, streak, longestStreak, currentGoal, profile, subscriptionPlan } = state;
  const isPro = subscriptionPlan === 'pro';
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

        <div style={{ padding: '0 16px', marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Plan badge */}
          <div
            onClick={() => router.push(isPro ? '#' : '/pricing')}
            style={{
              background: isPro ? 'rgba(168,255,62,0.08)' : 'rgba(212,160,255,0.08)',
              border: `1px solid ${isPro ? 'rgba(168,255,62,0.2)' : 'rgba(212,160,255,0.2)'}`,
              borderRadius: 10, padding: '10px 14px',
              cursor: isPro ? 'default' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}
          >
            <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: isPro ? 'var(--physical)' : 'var(--spiritual)' }}>
              {isPro ? '✦ Pro' : '○ Free'}
            </span>
            {!isPro && <span style={{ fontSize: 10, color: 'var(--spiritual)', fontFamily: 'var(--font-mono)' }}>Upgrade →</span>}
          </div>

          {/* Streak */}
          <div className="streak-chip" style={{ margin: 0 }}>
            <span className="streak-num">{streak}</span>
            <span className="streak-label">day streak</span>
          </div>
        </div>
      </nav>

      {/* Main */}
      <main className="main-content">
        <div className="page-header fade-up">
          <h1 className="page-greeting">{greeting()}{profile.name ? `, ${profile.name}` : '.'}</h1>
          <p className="page-date">{formatDate()}</p>
        </div>

        {/* Upgrade success toast */}
        {showUpgradeSuccess && (
          <div style={{
            position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)',
            background: 'var(--surface)',
            border: '1px solid rgba(168,255,62,0.4)',
            borderRadius: 40,
            padding: '12px 24px',
            display: 'flex', alignItems: 'center', gap: 12,
            zIndex: 600,
            animation: 'fadeUp 0.3s ease both',
            boxShadow: '0 8px 40px rgba(168,255,62,0.15)',
            whiteSpace: 'nowrap',
          }}>
            <span style={{ fontSize: 18 }}>✦</span>
            <div>
              <div style={{ fontSize: 13, color: 'var(--physical)', fontWeight: 700, fontFamily: 'var(--font-display)' }}>Welcome to Trinitect Pro</div>
              <div style={{ fontSize: 11, color: 'var(--text2)', fontFamily: 'var(--font-mono)', marginTop: 1 }}>All 3 domains + personalized patterns unlocked</div>
            </div>
          </div>
        )}

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
                  <div className="next-action-label">Next pattern to build</div>
                  <div className="next-action-text">{nextAction.title}</div>
                </div>
                <span className="next-action-arrow">→</span>
              </div>
            )}

            {/* Pro upgrade banner — free users only */}
            {!isPro && (
              <div
                onClick={() => router.push('/pricing')}
                className="fade-up fade-up-d2"
                style={{
                  background: 'linear-gradient(135deg, rgba(212,160,255,0.08) 0%, rgba(56,217,245,0.06) 100%)',
                  border: '1px solid rgba(212,160,255,0.25)',
                  borderRadius: 'var(--radius)',
                  padding: '14px 18px',
                  display: 'flex', alignItems: 'center', gap: 14,
                  cursor: 'pointer',
                  transition: 'border-color var(--transition)',
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--spiritual)', marginBottom: 2 }}>
                    Unlock Pro
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text1)', fontWeight: 500 }}>
                    All 3 domains, AI-matched patterns, SMS reminders
                  </div>
                </div>
                <div style={{ background: 'var(--spiritual)', color: 'var(--bg)', fontSize: 11, fontWeight: 700, padding: '5px 12px', borderRadius: 20, fontFamily: 'var(--font-display)', whiteSpace: 'nowrap' }}>
                  $8.99/mo →
                </div>
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
                <div className="panel-title" style={{ marginBottom: 0 }}>Today's Patterns</div>
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
                  <div className="stat-num" style={{ color: 'var(--mental)' }}>{totalCount - completedCount}</div>
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
              <div className="panel-title">Compounding Cycle</div>
              <p style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-mono)', marginBottom: 14, lineHeight: 1.5 }}>
                It's the pattern, not the person.
              </p>
              {[
                { from: 'Daily patterns', to: 'Skills compound' },
                { from: 'Skills compound', to: 'Goals accelerate' },
                { from: 'Goals achieved', to: 'Better version of you' },
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
