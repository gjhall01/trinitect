'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import { loadState, updateProfile } from '@/lib/store';
import { logout, getToken } from '@/lib/api-client';
import { getNotifPermission, requestNotifPermission, type NotifPermission } from '@/lib/push';
import type { UserProfile, SmsPreferences } from '@/lib/types';

function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 10) return phone;
  const ten = digits.slice(-10);
  return `(${ten.slice(0, 3)}) ${ten.slice(3, 6)}-••••`;
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      style={{
        width: 40, height: 22, borderRadius: 11,
        background: on ? 'var(--physical)' : 'var(--surface3)',
        border: 'none', cursor: 'pointer', position: 'relative',
        transition: 'background 0.2s', flexShrink: 0,
      }}
    >
      <div style={{
        width: 16, height: 16, borderRadius: '50%', background: '#fff',
        position: 'absolute', top: 3,
        left: on ? 21 : 3,
        transition: 'left 0.2s',
      }} />
    </button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{
        fontSize: 9, fontFamily: 'var(--font-mono)', textTransform: 'uppercase',
        letterSpacing: '0.14em', color: 'var(--text4)', marginBottom: 12,
      }}>
        {title}
      </div>
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius)', overflow: 'hidden',
      }}>
        {children}
      </div>
    </div>
  );
}

function Row({ label, sub, right, border = true }: {
  label: string;
  sub?: string;
  right: React.ReactNode;
  border?: boolean;
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 18px',
      borderBottom: border ? '1px solid var(--border)' : 'none',
    }}>
      <div>
        <div style={{ fontSize: 13, color: 'var(--text1)' }}>{label}</div>
        {sub && <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text4)', marginTop: 2 }}>{sub}</div>}
      </div>
      {right}
    </div>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [plan, setPlan] = useState<'free' | 'pro'>('free');
  const [saving, setSaving] = useState(false);
  const [savedToast, setSavedToast] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [notifPermission, setNotifPermission] = useState<NotifPermission>('unsupported');
  const [notifRequesting, setNotifRequesting] = useState(false);

  useEffect(() => {
    const s = loadState();
    if (!s.profile.onboarded) { router.replace('/'); return; }
    setProfile(s.profile);
    setPlan(s.subscriptionPlan);
    setIsAuthenticated(!!getToken());
    setNotifPermission(getNotifPermission());
    setMounted(true);
  }, [router]);

  const handleEnablePush = useCallback(async () => {
    if (notifPermission === 'granted') return;
    setNotifRequesting(true);
    const result = await requestNotifPermission();
    setNotifPermission(result);
    setNotifRequesting(false);
  }, [notifPermission]);

  const updateSmsPreference = useCallback(async (key: keyof SmsPreferences, val: boolean) => {
    if (!profile) return;
    const newPrefs: SmsPreferences = {
      loginConfirmation: profile.smsPreferences?.loginConfirmation ?? true,
      dailyReminders: profile.smsPreferences?.dailyReminders ?? true,
      milestoneNotifications: profile.smsPreferences?.milestoneNotifications ?? true,
      [key]: val,
    };
    const updated = { ...profile, smsPreferences: newPrefs };
    setProfile(updated);
    setSaving(true);
    try {
      updateProfile(updated);
      setSavedToast(true);
      setTimeout(() => setSavedToast(false), 2000);
    } finally {
      setSaving(false);
    }
  }, [profile]);

  const handleSignOut = useCallback(async () => {
    await logout();
    router.replace('/login');
  }, [router]);

  if (!mounted || !profile) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div style={{ width: 32, height: 32, border: '2px solid rgba(168,255,62,0.2)', borderTopColor: '#a8ff3e', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const prefs = profile.smsPreferences ?? { loginConfirmation: true, dailyReminders: true, milestoneNotifications: true };
  const phone = profile.phone;
  const isPro = plan === 'pro';

  return (
    <AppLayout activeHref="/settings">
      <div style={{ maxWidth: 560 }}>

        {/* Toast */}
        {savedToast && (
          <div style={{
            position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)',
            background: 'var(--surface)', border: '1px solid rgba(168,255,62,0.3)',
            borderRadius: 40, padding: '10px 20px',
            display: 'flex', alignItems: 'center', gap: 10,
            zIndex: 600, animation: 'toastIn 0.3s ease both',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            whiteSpace: 'nowrap',
          }}>
            <span style={{ color: 'var(--physical)', fontSize: 15 }}>✓</span>
            <span style={{ fontSize: 13, color: 'var(--text1)', fontWeight: 500 }}>Preferences saved</span>
          </div>
        )}

        {/* Header */}
        <div style={{ marginBottom: 32 }} className="fade-up">
          <h1 style={{
            fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 700,
            letterSpacing: '-0.03em', color: 'var(--text1)', lineHeight: 1.15,
          }}>
            Account
          </h1>
          <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 5, fontFamily: 'var(--font-mono)' }}>
            {profile.name ? `${profile.name}'s settings` : 'Your settings'}
          </p>
        </div>

        {/* Identity */}
        <div className="fade-up fade-up-d1">
          <Section title="Account">
            <Row
              label={phone ? maskPhone(phone) : 'No phone linked'}
              sub={isAuthenticated ? 'Trinitect account' : 'Progress stored on this device only'}
              right={
                phone ? (
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    padding: '4px 10px', borderRadius: 20,
                    background: isAuthenticated ? 'rgba(168,255,62,0.08)' : 'var(--surface2)',
                    border: `1px solid ${isAuthenticated ? 'rgba(168,255,62,0.25)' : 'var(--border)'}`,
                  }}>
                    <div style={{
                      width: 6, height: 6, borderRadius: '50%',
                      background: isAuthenticated ? 'var(--physical)' : 'var(--text4)',
                    }} />
                    <span style={{
                      fontSize: 10, fontFamily: 'var(--font-mono)', letterSpacing: '0.06em',
                      color: isAuthenticated ? 'var(--physical)' : 'var(--text4)',
                    }}>
                      {isAuthenticated ? 'authenticated' : 'local only'}
                    </span>
                  </div>
                ) : (
                  <button
                    onClick={() => router.push('/login')}
                    style={{
                      fontSize: 10, fontFamily: 'var(--font-mono)', letterSpacing: '0.06em',
                      padding: '5px 12px', borderRadius: 20, cursor: 'pointer',
                      background: 'rgba(168,255,62,0.08)', border: '1px solid rgba(168,255,62,0.25)',
                      color: 'var(--physical)',
                    }}
                  >
                    Link phone →
                  </button>
                )
              }
            />
            <Row
              label="Plan"
              sub={isPro ? 'All features unlocked' : 'Limited to 2 daily patterns'}
              border={false}
              right={
                isPro ? (
                  <span style={{
                    fontSize: 10, fontFamily: 'var(--font-mono)', letterSpacing: '0.08em',
                    padding: '4px 10px', borderRadius: 20,
                    background: 'rgba(168,255,62,0.08)', border: '1px solid rgba(168,255,62,0.25)',
                    color: 'var(--physical)',
                  }}>
                    ✦ Pro
                  </span>
                ) : (
                  <button
                    onClick={() => router.push('/pricing')}
                    style={{
                      fontSize: 10, fontFamily: 'var(--font-mono)', letterSpacing: '0.06em',
                      padding: '5px 12px', borderRadius: 20, cursor: 'pointer',
                      background: 'rgba(212,160,255,0.1)', border: '1px solid rgba(212,160,255,0.3)',
                      color: 'var(--spiritual)',
                    }}
                  >
                    Upgrade →
                  </button>
                )
              }
            />
          </Section>
        </div>

        {/* SMS preferences */}
        <div className="fade-up fade-up-d2">
          <Section title="SMS Notifications">
            <Row
              label="Daily reminders"
              sub={prefs.dailyReminders ? 'Morning nudge to complete today\'s patterns' : 'Off'}
              right={
                <Toggle
                  on={prefs.dailyReminders}
                  onChange={v => updateSmsPreference('dailyReminders', v)}
                />
              }
            />
            <Row
              label="Milestone alerts"
              sub={prefs.milestoneNotifications ? 'Notified when you hit streak milestones' : 'Off'}
              right={
                <Toggle
                  on={prefs.milestoneNotifications}
                  onChange={v => updateSmsPreference('milestoneNotifications', v)}
                />
              }
            />
            <Row
              label="Login confirmation"
              sub="SMS code when signing in — required"
              border={false}
              right={
                <Toggle on={true} onChange={() => {}} />
              }
            />
          </Section>

          {saving && (
            <p style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text4)', textAlign: 'center', marginTop: -16, marginBottom: 16 }}>
              saving…
            </p>
          )}

          {!phone && (
            <div style={{
              padding: '12px 16px', marginTop: -20, marginBottom: 24,
              background: 'rgba(255,140,105,0.06)', border: '1px solid rgba(255,140,105,0.18)',
              borderRadius: 'var(--radius-sm)',
              fontSize: 11, fontFamily: 'var(--font-mono)', color: 'rgba(255,140,105,0.8)', lineHeight: 1.5,
            }}>
              Link your phone number to enable SMS notifications.
            </div>
          )}
        </div>

        {/* Push Notifications */}
        {notifPermission !== 'unsupported' && (
          <div className="fade-up fade-up-d3">
            <Section title="Browser Notifications">
              <Row
                label="Daily practice reminder"
                sub={
                  notifPermission === 'granted'
                    ? 'Fires morning + evening if you haven\'t visited'
                    : notifPermission === 'denied'
                    ? 'Blocked — enable in browser settings'
                    : 'Get nudged when your streak is at risk'
                }
                border={false}
                right={
                  notifPermission === 'granted' ? (
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      padding: '4px 10px', borderRadius: 20,
                      background: 'rgba(168,255,62,0.08)',
                      border: '1px solid rgba(168,255,62,0.25)',
                    }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--physical)' }} />
                      <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', letterSpacing: '0.06em', color: 'var(--physical)' }}>
                        on
                      </span>
                    </div>
                  ) : notifPermission === 'denied' ? (
                    <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text4)' }}>
                      blocked
                    </span>
                  ) : (
                    <button
                      onClick={handleEnablePush}
                      disabled={notifRequesting}
                      style={{
                        fontSize: 10, fontFamily: 'var(--font-mono)', letterSpacing: '0.06em',
                        padding: '5px 12px', borderRadius: 20, cursor: 'pointer',
                        background: 'rgba(168,255,62,0.08)', border: '1px solid rgba(168,255,62,0.25)',
                        color: 'var(--physical)', opacity: notifRequesting ? 0.5 : 1,
                      }}
                    >
                      {notifRequesting ? 'requesting…' : 'Enable →'}
                    </button>
                  )
                }
              />
            </Section>
          </div>
        )}

        {/* Data */}
        <div className="fade-up fade-up-d4">
          <Section title="Session">
            <Row
              label="Sign out"
              sub="You'll need to verify your phone to sign back in"
              border={false}
              right={
                <button
                  onClick={handleSignOut}
                  style={{
                    fontSize: 11, fontFamily: 'var(--font-mono)', letterSpacing: '0.06em',
                    padding: '6px 14px', borderRadius: 20, cursor: 'pointer',
                    background: 'var(--surface2)', border: '1px solid var(--border)',
                    color: 'var(--text2)',
                  }}
                >
                  Sign out
                </button>
              }
            />
          </Section>
        </div>

      </div>

      <style>{`
        @keyframes toastIn { from { opacity: 0; transform: translate(-50%, 10px); } to { opacity: 1; transform: translate(-50%, 0); } }
      `}</style>
    </AppLayout>
  );
}
