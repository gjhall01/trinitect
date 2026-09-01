'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { loadState } from '@/lib/store';
import type { SubscriptionPlan } from '@/lib/types';

function TodayIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
}
function CommitmentIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>;
}
function CommunityIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>;
}

const NAV = [
  { label: 'Today',       Icon: TodayIcon,      href: '/today' },
  { label: 'Commitments', Icon: CommitmentIcon, href: '/commitments' },
  { label: 'Community',   Icon: CommunityIcon,  href: '/community' },
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
          {NAV.map(({ label, Icon, href }) => (
            <button
              key={label}
              className={`nav-item ${href === activeHref ? 'active' : ''}`}
              onClick={() => router.push(href)}
            >
              <Icon />
              {label}
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

      {/* Mobile nav */}
      <div className="mobile-nav">
        <div className="mobile-nav-items">
          {NAV.map(({ label, Icon, href }) => (
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
