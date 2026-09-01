'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { loadState, hydrateFromServer } from '@/lib/store';
import { logout } from '@/lib/api-client';
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
function ProgressIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>;
}
function SettingsIcon({ size = 20 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>;
}

const NAV = [
  { label: 'Today',       Icon: TodayIcon,      href: '/today' },
  { label: 'Commitments', Icon: CommitmentIcon, href: '/commitments' },
  { label: 'Community',   Icon: CommunityIcon,  href: '/community' },
  { label: 'Progress',    Icon: ProgressIcon,   href: '/progress' },
];

const MOBILE_NAV = [
  ...NAV,
  { label: 'Account', Icon: SettingsIcon, href: '/settings' },
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
    // Hydrate from server on first authenticated load (non-blocking)
    hydrateFromServer().then(() => {
      const fresh = loadState();
      setStreak(fresh.streak);
      setPlan(fresh.subscriptionPlan);
      setName(fresh.profile.name);
    });
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

          <div
            className="streak-chip"
            style={{ margin: 0, cursor: 'pointer' }}
            onClick={() => router.push('/progress')}
            title="View your momentum"
          >
            <span className="streak-num">{streak}</span>
            <span className="streak-label">day streak</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button
              onClick={async () => { await logout(); router.replace('/login'); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text4)', padding: '4px 0', letterSpacing: '0.06em', textAlign: 'left' }}
            >
              sign out
            </button>
            <button
              onClick={() => router.push('/settings')}
              style={{
                background: '/settings' === activeHref ? 'var(--surface2)' : 'none',
                border: 'none', cursor: 'pointer',
                color: '/settings' === activeHref ? 'var(--text1)' : 'var(--text4)',
                padding: '5px 7px', borderRadius: 6,
                display: 'flex', alignItems: 'center',
                transition: 'all var(--transition)',
              }}
              title="Account settings"
            >
              <SettingsIcon size={16} />
            </button>
          </div>
        </div>
      </nav>

      <main className="main-content">
        {children}
      </main>

      {/* Mobile nav */}
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
