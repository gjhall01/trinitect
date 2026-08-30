'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { loadState } from '@/lib/store';
import type { SubscriptionPlan } from '@/lib/types';

const NAV_ITEMS = [
  { label: 'Dashboard', icon: '⬡', href: '/dashboard' },
  { label: 'Plan', icon: '◈', href: '/plan' },
  { label: 'Patterns', icon: '⟁', href: '/patterns' },
  { label: 'Goals', icon: '◎', href: '/goals' },
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

const MOBILE_NAV = [
  { label: 'Today', Icon: HomeIcon, href: '/dashboard' },
  { label: 'Plan', Icon: PlanIcon, href: '/plan' },
  { label: 'Patterns', Icon: PatternIcon, href: '/patterns' },
  { label: 'Goals', Icon: GoalIcon, href: '/goals' },
];

export default function AppLayout({
  children,
  activeHref,
}: {
  children: React.ReactNode;
  activeHref: string;
}) {
  const router = useRouter();
  const [streak, setStreak] = useState(0);
  const [plan, setPlan] = useState<SubscriptionPlan>('free');
  const [name, setName] = useState('');

  useEffect(() => {
    const s = loadState();
    setStreak(s.streak);
    setPlan(s.subscriptionPlan);
    setName(s.profile.name);
  }, []);

  const isPro = plan === 'pro';

  return (
    <div className="app-shell">
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
              className={`nav-item ${item.href === activeHref ? 'active' : ''}`}
              onClick={() => router.push(item.href)}
            >
              <span style={{ fontFamily: 'monospace', fontSize: 14 }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>

        <div style={{ padding: '0 16px', marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
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

          <div className="streak-chip" style={{ margin: 0 }}>
            <span className="streak-num">{streak}</span>
            <span className="streak-label">day streak</span>
          </div>
        </div>
      </nav>

      <main className="main-content">
        {children}
      </main>

      <div className="mobile-nav">
        <div className="mobile-nav-items">
          {MOBILE_NAV.map(({ label, Icon, href }) => (
            <button
              key={label}
              className={`mobile-nav-item ${href === activeHref ? 'active' : ''}`}
              onClick={() => router.push(href)}
            >
              <Icon />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
