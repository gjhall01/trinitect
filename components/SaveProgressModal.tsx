'use client';

import { useRef, useState } from 'react';
import type { SmsPreferences } from '@/lib/types';
import { savePhoneNumber, skipPhoneCollection } from '@/lib/store';
import { requestOTP, verifyOTP, setToken, syncState } from '@/lib/api-client';
import { loadState } from '@/lib/store';

function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

function rawDigits(formatted: string): string {
  return formatted.replace(/\D/g, '');
}

type Step = 'phone' | 'otp';

type Props = {
  onSaved: () => void;
  onSkip: () => void;
};

const SMS_OPTIONS: { key: keyof SmsPreferences; label: string; description: string }[] = [
  { key: 'loginConfirmation', label: 'Login confirmation', description: 'Verify your identity when signing in from a new device.' },
  { key: 'dailyReminders', label: 'Daily plan reminders', description: "A nudge when your plan is ready or hasn't been started." },
  { key: 'milestoneNotifications', label: 'Milestone notifications', description: 'Streak milestones, stage goal completions, and momentum wins.' },
];

export default function SaveProgressModal({ onSaved, onSkip }: Props) {
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [prefs, setPrefs] = useState<SmsPreferences>({
    loginConfirmation: true,
    dailyReminders: true,
    milestoneNotifications: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const digits = rawDigits(phone);
  const e164 = `+1${digits}`;
  const isValidPhone = digits.length === 10;
  const isValidOTP = otp.every(d => d !== '');

  function handlePhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
    setPhone(formatPhone(e.target.value));
    setError('');
  }

  function togglePref(key: keyof SmsPreferences) {
    setPrefs(p => ({ ...p, [key]: !p[key] }));
  }

  async function handleSendCode() {
    if (!isValidPhone) { setError('Enter a valid 10-digit US phone number.'); return; }
    setLoading(true);
    setError('');
    try {
      await requestOTP(e164);
      setStep('otp');
      setResendCooldown(60);
      const interval = setInterval(() => {
        setResendCooldown(c => { if (c <= 1) { clearInterval(interval); return 0; } return c - 1; });
      }, 1000);
      setTimeout(() => otpRefs.current[0]?.focus(), 200);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send code.');
    } finally {
      setLoading(false);
    }
  }

  function handleOTPDigit(index: number, value: string) {
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    setError('');
    if (digit && index < 5) otpRefs.current[index + 1]?.focus();
  }

  function handleOTPKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  }

  function handleOTPPaste(e: React.ClipboardEvent) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      otpRefs.current[5]?.focus();
    }
  }

  async function handleVerify() {
    if (!isValidOTP) return;
    setLoading(true);
    setError('');
    try {
      const { token } = await verifyOTP(e164, otp.join('')) as { token: string; user: unknown };
      setToken(token);

      // Persist local state to server
      const localState = loadState();
      await syncState({
        profile: { ...localState.profile, phone: e164, smsPreferences: prefs },
        domainScores: localState.domainScores,
        todaysPlan: localState.todaysPlan,
        streak: localState.streak,
        longestStreak: localState.longestStreak,
        lastActiveDate: localState.lastActiveDate,
        currentGoal: localState.currentGoal,
      });

      // Also save locally
      savePhoneNumber(e164, prefs);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed.');
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  }

  function handleSkip() {
    skipPhoneCollection();
    onSkip();
  }

  return (
    <>
      <div onClick={handleSkip} style={{
        position: 'fixed', inset: 0,
        background: 'rgba(7,8,15,0.82)',
        backdropFilter: 'blur(6px)',
        zIndex: 500,
        animation: 'fadeIn 0.2s ease both',
      }} />

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
        <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--surface3)', margin: '0 auto 24px' }} />

        {/* ── Step: Phone ── */}
        {step === 'phone' && (
          <>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 20 }}>
              <div style={{
                width: 42, height: 42, borderRadius: 12, flexShrink: 0,
                background: 'var(--accent-dim)', border: '1px solid rgba(168,255,62,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--physical)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                </svg>
              </div>
              <div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text1)', lineHeight: 1.2, marginBottom: 4 }}>
                  Save your progress
                </h2>
                <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.5 }}>
                  Add your number to keep your plan across devices and get reminders that keep you on track.
                </p>
              </div>
            </div>

            {/* Phone input */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 10, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text3)', marginBottom: 8 }}>
                Mobile number (US)
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: 'var(--text3)', fontFamily: 'var(--font-mono)', pointerEvents: 'none' }}>+1</span>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={phone}
                  onChange={handlePhoneChange}
                  onKeyDown={e => e.key === 'Enter' && handleSendCode()}
                  placeholder="(555) 000-0000"
                  autoFocus
                  style={{
                    width: '100%',
                    background: 'var(--surface2)',
                    border: `1.5px solid ${error ? 'rgba(255,80,80,0.5)' : isValidPhone ? 'rgba(168,255,62,0.35)' : 'var(--border)'}`,
                    borderRadius: 'var(--radius-sm)',
                    padding: '13px 14px 13px 38px',
                    color: 'var(--text1)', fontSize: 15,
                    fontFamily: 'var(--font-mono)',
                    outline: 'none', letterSpacing: '0.04em',
                    transition: 'border-color var(--transition)',
                  }}
                />
                {isValidPhone && <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--physical)', fontSize: 16 }}>✓</span>}
              </div>
              {error && <p style={{ fontSize: 11, color: 'rgba(255,80,80,0.9)', marginTop: 6, fontFamily: 'var(--font-mono)' }}>{error}</p>}
            </div>

            {/* SMS opt-ins */}
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 10, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text3)', marginBottom: 10 }}>SMS preferences</p>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {SMS_OPTIONS.map(({ key, label, description }, i) => (
                  <button key={key} onClick={() => togglePref(key)} style={{
                    display: 'flex', alignItems: 'flex-start', gap: 12,
                    padding: '12px 0',
                    borderTop: i === 0 ? '1px solid var(--border)' : 'none',
                    borderBottom: '1px solid var(--border)',
                    borderLeft: 'none', borderRight: 'none',
                    background: 'none', cursor: 'pointer', textAlign: 'left', width: '100%',
                  }}>
                    <div style={{
                      width: 20, height: 20, borderRadius: 6, flexShrink: 0, marginTop: 1,
                      background: prefs[key] ? 'var(--physical)' : 'var(--surface2)',
                      border: `1.5px solid ${prefs[key] ? 'var(--physical)' : 'var(--border-hover)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all var(--transition)',
                    }}>
                      {prefs[key] && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--bg)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text1)', lineHeight: 1.3 }}>{label}</div>
                      <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2, lineHeight: 1.45 }}>{description}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <p style={{ fontSize: 10, color: 'var(--text4)', lineHeight: 1.5, marginBottom: 20 }}>
              By continuing, you agree to receive SMS messages per your selections. Msg & data rates may apply. Reply STOP to unsubscribe.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button onClick={handleSendCode} disabled={loading || !isValidPhone} style={{
                width: '100%', padding: 15,
                background: loading || !isValidPhone ? 'rgba(168,255,62,0.4)' : 'var(--physical)',
                border: 'none', borderRadius: 'var(--radius)',
                fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700,
                color: 'var(--bg)', cursor: loading || !isValidPhone ? 'default' : 'pointer',
                transition: 'opacity var(--transition)',
              }}>
                {loading ? 'Sending…' : 'Send verification code →'}
              </button>
              <button onClick={handleSkip} style={{ width: '100%', padding: 12, background: 'none', border: 'none', fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text3)', cursor: 'pointer' }}>
                Not now
              </button>
            </div>
          </>
        )}

        {/* ── Step: OTP ── */}
        {step === 'otp' && (
          <>
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text1)', lineHeight: 1.2, marginBottom: 6 }}>
                Enter your code
              </h2>
              <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.5 }}>
                Sent to <span style={{ color: 'var(--text1)', fontFamily: 'var(--font-mono)' }}>{phone}</span>
              </p>
            </div>

            {/* 6-digit OTP input */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }} onPaste={handleOTPPaste}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={el => { otpRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleOTPDigit(i, e.target.value)}
                  onKeyDown={e => handleOTPKeyDown(i, e)}
                  style={{
                    flex: 1, height: 56,
                    background: 'var(--surface2)',
                    border: `1.5px solid ${digit ? 'rgba(168,255,62,0.35)' : 'var(--border)'}`,
                    borderRadius: 'var(--radius-sm)',
                    textAlign: 'center',
                    fontSize: 22, fontFamily: 'var(--font-mono)', fontWeight: 700,
                    color: 'var(--text1)', outline: 'none',
                    transition: 'border-color var(--transition)',
                    caretColor: 'var(--physical)',
                  }}
                />
              ))}
            </div>

            {error && <p style={{ fontSize: 11, color: 'rgba(255,80,80,0.9)', marginBottom: 12, fontFamily: 'var(--font-mono)' }}>{error}</p>}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button onClick={handleVerify} disabled={loading || !isValidOTP} style={{
                width: '100%', padding: 15,
                background: loading || !isValidOTP ? 'rgba(168,255,62,0.4)' : 'var(--physical)',
                border: 'none', borderRadius: 'var(--radius)',
                fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700,
                color: 'var(--bg)', cursor: loading || !isValidOTP ? 'default' : 'pointer',
              }}>
                {loading ? 'Verifying…' : 'Verify & save →'}
              </button>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button onClick={() => { setStep('phone'); setOtp(['', '', '', '', '', '']); setError(''); }} style={{ background: 'none', border: 'none', fontSize: 13, color: 'var(--text3)', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                  ← Change number
                </button>
                <button onClick={handleSendCode} disabled={resendCooldown > 0 || loading} style={{ background: 'none', border: 'none', fontSize: 13, color: resendCooldown > 0 ? 'var(--text4)' : 'var(--physical)', cursor: resendCooldown > 0 ? 'default' : 'pointer', fontFamily: 'var(--font-body)' }}>
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
                </button>
              </div>
            </div>
          </>
        )}
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
