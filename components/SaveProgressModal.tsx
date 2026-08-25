'use client';

import { useState } from 'react';
import type { SmsPreferences } from '@/lib/types';
import { savePhoneNumber, skipPhoneCollection } from '@/lib/store';

function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

function rawDigits(formatted: string): string {
  return formatted.replace(/\D/g, '');
}

type Props = {
  onSaved: () => void;
  onSkip: () => void;
};

export default function SaveProgressModal({ onSaved, onSkip }: Props) {
  const [phone, setPhone] = useState('');
  const [prefs, setPrefs] = useState<SmsPreferences>({
    loginConfirmation: true,
    dailyReminders: true,
    milestoneNotifications: true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const digits = rawDigits(phone);
  const isValid = digits.length === 10;

  function handlePhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
    setPhone(formatPhone(e.target.value));
    setError('');
  }

  function togglePref(key: keyof SmsPreferences) {
    setPrefs(p => ({ ...p, [key]: !p[key] }));
  }

  function handleSave() {
    if (!isValid) { setError('Enter a valid 10-digit US phone number.'); return; }
    setSaving(true);
    // In Phase 1 this will POST to an API that sends a verification SMS.
    // For now we store locally and confirm immediately.
    savePhoneNumber(`+1${digits}`, prefs);
    setTimeout(() => { setSaving(false); onSaved(); }, 600);
  }

  function handleSkip() {
    skipPhoneCollection();
    onSkip();
  }

  const SMS_OPTIONS: { key: keyof SmsPreferences; label: string; description: string }[] = [
    {
      key: 'loginConfirmation',
      label: 'Login confirmation',
      description: 'Verify your identity when signing in from a new device.',
    },
    {
      key: 'dailyReminders',
      label: 'Daily plan reminders',
      description: "A nudge when your plan is ready or hasn't been started.",
    },
    {
      key: 'milestoneNotifications',
      label: 'Milestone notifications',
      description: 'Streak milestones, stage goal completions, and momentum wins.',
    },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleSkip}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(7,8,15,0.82)',
          backdropFilter: 'blur(6px)',
          zIndex: 500,
          animation: 'fadeIn 0.2s ease both',
        }}
      />

      {/* Sheet */}
      <div style={{
        position: 'fixed',
        bottom: 0, left: 0, right: 0,
        zIndex: 501,
        background: 'var(--surface)',
        borderTop: '1px solid rgba(168,255,62,0.15)',
        borderRadius: '20px 20px 0 0',
        padding: '28px 24px 40px',
        maxWidth: 520,
        margin: '0 auto',
        animation: 'slideUp 0.32s cubic-bezier(0.4,0,0.2,1) both',
      }}>
        {/* Pull handle */}
        <div style={{
          width: 36, height: 4, borderRadius: 2,
          background: 'var(--surface3)',
          margin: '0 auto 24px',
        }} />

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 20 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 12, flexShrink: 0,
            background: 'var(--accent-dim)',
            border: '1px solid rgba(168,255,62,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--physical)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
            </svg>
          </div>
          <div>
            <h2 style={{
              fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800,
              letterSpacing: '-0.03em', color: 'var(--text1)', lineHeight: 1.2, marginBottom: 4,
            }}>
              Save your progress
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.5 }}>
              Add your number to keep your plan across devices and get reminders that keep you on track.
            </p>
          </div>
        </div>

        {/* Phone input */}
        <div style={{ marginBottom: 20 }}>
          <label style={{
            display: 'block', fontSize: 10, fontFamily: 'var(--font-mono)',
            textTransform: 'uppercase', letterSpacing: '0.1em',
            color: 'var(--text3)', marginBottom: 8,
          }}>
            Mobile number (US)
          </label>
          <div style={{ position: 'relative' }}>
            <span style={{
              position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
              fontSize: 14, color: 'var(--text3)', fontFamily: 'var(--font-mono)',
              pointerEvents: 'none', userSelect: 'none',
            }}>+1</span>
            <input
              type="tel"
              inputMode="numeric"
              value={phone}
              onChange={handlePhoneChange}
              placeholder="(555) 000-0000"
              autoFocus
              style={{
                width: '100%',
                background: 'var(--surface2)',
                border: `1.5px solid ${error ? 'rgba(255,80,80,0.5)' : isValid ? 'rgba(168,255,62,0.35)' : 'var(--border)'}`,
                borderRadius: 'var(--radius-sm)',
                padding: '13px 14px 13px 38px',
                color: 'var(--text1)',
                fontSize: 15,
                fontFamily: 'var(--font-mono)',
                outline: 'none',
                letterSpacing: '0.04em',
                transition: 'border-color var(--transition)',
              }}
            />
            {isValid && (
              <span style={{
                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                color: 'var(--physical)', fontSize: 16,
              }}>✓</span>
            )}
          </div>
          {error && (
            <p style={{ fontSize: 11, color: 'rgba(255,80,80,0.9)', marginTop: 6, fontFamily: 'var(--font-mono)' }}>
              {error}
            </p>
          )}
        </div>

        {/* SMS opt-ins */}
        <div style={{ marginBottom: 24 }}>
          <p style={{
            fontSize: 10, fontFamily: 'var(--font-mono)', textTransform: 'uppercase',
            letterSpacing: '0.1em', color: 'var(--text3)', marginBottom: 10,
          }}>
            SMS preferences
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {SMS_OPTIONS.map(({ key, label, description }, i) => (
              <button
                key={key}
                onClick={() => togglePref(key)}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 12,
                  padding: '12px 0',
                  borderTop: i === 0 ? '1px solid var(--border)' : 'none',
                  borderBottom: '1px solid var(--border)',
                  background: 'none', border: 'none',
                  cursor: 'pointer', textAlign: 'left', width: '100%',
                }}
              >
                {/* Custom checkbox */}
                <div style={{
                  width: 20, height: 20, borderRadius: 6, flexShrink: 0, marginTop: 1,
                  background: prefs[key] ? 'var(--physical)' : 'var(--surface2)',
                  border: `1.5px solid ${prefs[key] ? 'var(--physical)' : 'var(--border-hover)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all var(--transition)',
                }}>
                  {prefs[key] && (
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--bg)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text1)', lineHeight: 1.3 }}>
                    {label}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2, lineHeight: 1.45 }}>
                    {description}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <p style={{ fontSize: 10, color: 'var(--text4)', lineHeight: 1.5, marginBottom: 20 }}>
          By saving, you agree to receive SMS messages per your selections above. Message & data rates may apply. Reply STOP to unsubscribe at any time.
        </p>

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              width: '100%', padding: 15,
              background: saving ? 'rgba(168,255,62,0.6)' : 'var(--physical)',
              border: 'none', borderRadius: 'var(--radius)',
              fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700,
              color: 'var(--bg)', cursor: saving ? 'default' : 'pointer',
              transition: 'opacity var(--transition)',
              letterSpacing: '-0.01em',
            }}
          >
            {saving ? 'Saving…' : 'Save my progress →'}
          </button>
          <button
            onClick={handleSkip}
            style={{
              width: '100%', padding: 12,
              background: 'none', border: 'none',
              fontFamily: 'var(--font-body)', fontSize: 13,
              color: 'var(--text3)', cursor: 'pointer',
            }}
          >
            Not now
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </>
  );
}
