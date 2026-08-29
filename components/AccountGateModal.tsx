'use client';

import { useRef, useState } from 'react';
import type { SmsPreferences } from '@/lib/types';
import { savePhoneNumber } from '@/lib/store';
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
  onAuthed: () => void;
  onClose: () => void;
};

const SMS_OPTIONS: { key: keyof SmsPreferences; label: string; description: string }[] = [
  { key: 'loginConfirmation', label: 'Login confirmation', description: 'Verify your identity when signing in from a new device.' },
  { key: 'dailyReminders', label: 'Daily plan reminders', description: "A nudge when your plan is ready or hasn't been started." },
  { key: 'milestoneNotifications', label: 'Milestone notifications', description: 'Streak milestones, stage goal completions, and momentum wins.' },
];

export default function AccountGateModal({ onAuthed, onClose }: Props) {
  const [step, setStep] = useState<Step>('phone');
  const [name, setName] = useState('');
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
      const iv = setInterval(() => {
        setResendCooldown(c => { if (c <= 1) { clearInterval(iv); return 0; } return c - 1; });
      }, 1000);
      setTimeout(() => otpRefs.current[0]?.focus(), 200);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send code. Please try again.');
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

      const localState = loadState();
      await syncState({
        profile: {
          ...localState.profile,
          ...(name.trim() ? { name: name.trim() } : {}),
          phone: e164,
          smsPreferences: prefs,
        },
        domainScores: localState.domainScores,
        todaysPlan: localState.todaysPlan,
        streak: localState.streak,
        longestStreak: localState.longestStreak,
        lastActiveDate: localState.lastActiveDate,
        currentGoal: localState.currentGoal,
      });

      savePhoneNumber(e164, prefs);
      onAuthed();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed. Please try again.');
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(7,8,15,0.88)',
          backdropFilter: 'blur(8px)',
          zIndex: 500,
          animation: 'gFadeIn 0.22s ease both',
        }}
      />

      {/* Sheet */}
      <div style={{
        position: 'fixed',
        bottom: 0, left: 0, right: 0,
        zIndex: 501,
        background: 'var(--surface)',
        borderTop: '2px solid rgba(168,255,62,0.18)',
        borderRadius: '22px 22px 0 0',
        padding: '28px 24px 44px',
        maxWidth: 520,
        margin: '0 auto',
        animation: 'gSlideUp 0.34s cubic-bezier(0.22,1,0.36,1) both',
      }}>

        {/* Drag handle */}
        <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--surface3)', margin: '0 auto 24px' }} />

        {/* Close */}
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position: 'absolute', top: 22, right: 20,
            background: 'var(--surface2)', border: '1px solid var(--border)',
            borderRadius: 8, width: 30, height: 30,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text3)', cursor: 'pointer', fontSize: 14,
          }}
        >
          ✕
        </button>

        {/* ── Step: Phone ── */}
        {step === 'phone' && (
          <>
            {/* Header */}
            <div style={{ marginBottom: 22 }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'var(--accent-dim)', border: '1px solid rgba(168,255,62,0.18)',
                borderRadius: 20, padding: '3px 10px', marginBottom: 12,
              }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--physical)', animation: 'pulse 2s infinite' }} />
                <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--physical)', letterSpacing: '0.1em' }}>TRINITECT PRO</span>
              </div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text1)', lineHeight: 1.15, marginBottom: 6 }}>
                Create your account
              </h2>
              <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.55 }}>
                Your subscription links to your account. Enter your number to continue — takes 30 seconds.
              </p>
            </div>

            {/* Name (optional) */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 10, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text2)', marginBottom: 6 }}>
                First name (optional)
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="What should we call you?"
                style={{
                  width: '100%',
                  background: 'var(--surface2)',
                  border: '1.5px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '12px 14px',
                  color: 'var(--text1)', fontSize: 14,
                  fontFamily: 'var(--font-body)', outline: 'none',
                  transition: 'border-color var(--transition)',
                }}
                onFocus={e => (e.target.style.borderColor = 'rgba(168,255,62,0.25)')}
                onBlur={e => (e.target.style.borderColor = 'var(--border)')}
              />
            </div>

            {/* Phone */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 10, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text2)', marginBottom: 6 }}>
                Mobile number (US)
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                  fontSize: 14, color: 'var(--text2)', fontFamily: 'var(--font-mono)', pointerEvents: 'none',
                }}>+1</span>
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
                    fontFamily: 'var(--font-mono)', outline: 'none',
                    letterSpacing: '0.04em',
                    transition: 'border-color var(--transition)',
                  }}
                />
                {isValidPhone && (
                  <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--physical)', fontSize: 16 }}>✓</span>
                )}
              </div>
              {error && (
                <p style={{ fontSize: 11, color: 'rgba(255,80,80,0.9)', marginTop: 6, fontFamily: 'var(--font-mono)' }}>{error}</p>
              )}
            </div>

            {/* SMS opt-ins */}
            <div style={{ marginBottom: 14 }}>
              <p style={{ fontSize: 10, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text2)', marginBottom: 10 }}>
                SMS preferences
              </p>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {SMS_OPTIONS.map(({ key, label, description }, i) => (
                  <button
                    key={key}
                    onClick={() => togglePref(key)}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: 12,
                      padding: '10px 0',
                      borderTop: i === 0 ? '1px solid var(--border)' : 'none',
                      borderBottom: '1px solid var(--border)',
                      borderLeft: 'none', borderRight: 'none',
                      background: 'none', cursor: 'pointer', textAlign: 'left', width: '100%',
                    }}
                  >
                    <div style={{
                      width: 18, height: 18, borderRadius: 5, flexShrink: 0, marginTop: 2,
                      background: prefs[key] ? 'var(--physical)' : 'var(--surface2)',
                      border: `1.5px solid ${prefs[key] ? 'var(--physical)' : 'var(--border-hover)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all var(--transition)',
                    }}>
                      {prefs[key] && (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--bg)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      )}
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text1)', lineHeight: 1.3 }}>{label}</div>
                      <div style={{ fontSize: 10, color: 'var(--text2)', marginTop: 2, lineHeight: 1.45 }}>{description}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <p style={{ fontSize: 10, color: 'var(--text3)', lineHeight: 1.5, marginBottom: 16 }}>
              By continuing you agree to receive SMS messages per your selections above. Msg & data rates may apply. Reply STOP to unsubscribe.
            </p>

            <button
              onClick={handleSendCode}
              disabled={loading || !isValidPhone}
              style={{
                width: '100%', padding: 15,
                background: loading || !isValidPhone ? 'rgba(168,255,62,0.72)' : 'var(--physical)',
                border: 'none', borderRadius: 'var(--radius)',
                fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 800,
                color: 'var(--bg)', cursor: loading || !isValidPhone ? 'default' : 'pointer',
                letterSpacing: '-0.01em',
                transition: 'opacity var(--transition)',
              }}
            >
              {loading ? 'Sending code…' : 'Continue to checkout →'}
            </button>
          </>
        )}

        {/* ── Step: OTP ── */}
        {step === 'otp' && (
          <>
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text1)', lineHeight: 1.2, marginBottom: 6 }}>
                Verify your number
              </h2>
              <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.5 }}>
                We sent a 6-digit code to{' '}
                <span style={{ color: 'var(--text1)', fontFamily: 'var(--font-mono)' }}>{phone}</span>
              </p>
            </div>

            {/* OTP inputs */}
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
                    flex: 1, height: 58,
                    background: 'var(--surface2)',
                    border: `1.5px solid ${digit ? 'rgba(168,255,62,0.72)' : 'var(--border)'}`,
                    borderRadius: 'var(--radius-sm)',
                    textAlign: 'center',
                    fontSize: 24, fontFamily: 'var(--font-mono)', fontWeight: 700,
                    color: 'var(--text1)', outline: 'none',
                    transition: 'border-color var(--transition)',
                    caretColor: 'var(--physical)',
                  }}
                />
              ))}
            </div>

            {error && (
              <p style={{ fontSize: 11, color: 'rgba(255,80,80,0.9)', marginBottom: 12, fontFamily: 'var(--font-mono)' }}>{error}</p>
            )}

            <button
              onClick={handleVerify}
              disabled={loading || !isValidOTP}
              style={{
                width: '100%', padding: 15, marginBottom: 14,
                background: loading || !isValidOTP ? 'rgba(168,255,62,0.72)' : 'var(--physical)',
                border: 'none', borderRadius: 'var(--radius)',
                fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 800,
                color: 'var(--bg)', cursor: loading || !isValidOTP ? 'default' : 'pointer',
                letterSpacing: '-0.01em',
              }}
            >
              {loading ? 'Verifying…' : 'Verify & go to checkout →'}
            </button>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                onClick={() => { setStep('phone'); setOtp(['', '', '', '', '', '']); setError(''); }}
                style={{ background: 'none', border: 'none', fontSize: 13, color: 'var(--text3)', cursor: 'pointer', fontFamily: 'var(--font-body)' }}
              >
                ← Change number
              </button>
              <button
                onClick={handleSendCode}
                disabled={resendCooldown > 0 || loading}
                style={{
                  background: 'none', border: 'none', fontSize: 13,
                  color: resendCooldown > 0 ? 'var(--text4)' : 'var(--physical)',
                  cursor: resendCooldown > 0 ? 'default' : 'pointer',
                  fontFamily: 'var(--font-body)',
                }}
              >
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
              </button>
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes gSlideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes gFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </>
  );
}
