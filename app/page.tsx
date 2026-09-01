'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { loadState, updateProfile, updatePlan } from '@/lib/store';
import { generateDailyPlan, generatePracticePreview, DRIVER_THEMES } from '@/lib/mock-ai';
import { requestOTP, verifyOTP as apiVerifyOTP, setToken, getToken } from '@/lib/api-client';
import type { Action } from '@/lib/types';

const DRIVERS: { name: string; desc: string }[] = [
  { name: 'Vitality',    desc: 'Energy & health'     },
  { name: 'Clarity',     desc: 'Focused mind'         },
  { name: 'Mastery',     desc: 'Build expertise'      },
  { name: 'Meaning',     desc: 'Live with purpose'    },
  { name: 'Freedom',     desc: 'Own your time'        },
  { name: 'Connection',  desc: 'Real relationships'   },
  { name: 'Discipline',  desc: 'Show up daily'        },
  { name: 'Creativity',  desc: 'Express & create'     },
  { name: 'Wisdom',      desc: 'Learn & reflect'      },
  { name: 'Impact',      desc: 'Move things forward'  },
  { name: 'Growth',      desc: 'Become more'          },
  { name: 'Peace',       desc: 'Inner calm'           },
];

const DOMAIN_COLOR: Record<string, string> = {
  physical: 'var(--physical)', mental: 'var(--mental)', spiritual: 'var(--spiritual)',
};

type Step = 'drivers' | 'reflection' | 'declaration' | 'account' | 'practice';
type Path = 'declared' | 'exploring';

export default function Onboarding() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<Step>('drivers');
  const [path, setPath] = useState<Path>('exploring');

  const [firstName, setFirstName] = useState('');
  const [selectedDrivers, setSelectedDrivers] = useState<string[]>([]);
  const [declaration, setDeclaration] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [practiceActions, setPracticeActions] = useState<Action[]>([]);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [resendCountdown, setResendCountdown] = useState(0);
  const [alreadyAuthed, setAlreadyAuthed] = useState(false);

  useEffect(() => {
    setMounted(true);
    const s = loadState();
    if (s.profile.onboarded) router.replace('/today');
    if (getToken()) setAlreadyAuthed(true);
  }, [router]);

  useEffect(() => {
    if (resendCountdown <= 0) return;
    const t = setTimeout(() => setResendCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCountdown]);

  if (!mounted) return null;

  function formatPhone(raw: string): string {
    const digits = raw.replace(/\D/g, '').slice(0, 10);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  function e164(formatted: string): string {
    const digits = formatted.replace(/\D/g, '');
    return digits.length === 10 ? `+1${digits}` : '';
  }
  async function handleSendCode() {
    const e164Phone = e164(phone);
    if (!e164Phone) { setOtpError('Enter a valid 10-digit US number.'); return; }
    setOtpLoading(true); setOtpError('');
    try {
      await requestOTP(e164Phone);
      setOtpSent(true);
      setResendCountdown(30);
    } catch (err) {
      setOtpError(err instanceof Error ? err.message : 'Failed to send code.');
    } finally {
      setOtpLoading(false);
    }
  }
  async function handleVerifyAndProceed() {
    if (otp.length !== 6) { setOtpError('Enter the 6-digit code.'); return; }
    setOtpLoading(true); setOtpError('');
    try {
      const e164Phone = e164(phone);
      const { token } = await apiVerifyOTP(e164Phone, otp);
      setToken(token as string);
      saveAndProceed(false);
    } catch (err) {
      setOtpError(err instanceof Error ? err.message : 'Incorrect code.');
    } finally {
      setOtpLoading(false);
    }
  }

  function toggleDriver(name: string) {
    setSelectedDrivers(prev =>
      prev.includes(name) ? prev.filter(x => x !== name) : [...prev, name].slice(0, 6)
    );
  }

  const steps: Step[] = path === 'declared'
    ? ['drivers', 'reflection', 'declaration', 'account', 'practice']
    : ['drivers', 'reflection', 'account', 'practice'];
  const stepIdx = steps.indexOf(step);
  const progress = stepIdx <= 0 ? 0 : (stepIdx / (steps.length - 1)) * 100;

  function saveAndProceed(skipAccount: boolean) {
    const existingProfile = loadState().profile;
    // Preserve phone from server state if already authenticated (alreadyAuthed path)
    const resolvedPhone = phone.replace(/\D/g, '').length === 10
      ? `+1${phone.replace(/\D/g, '')}`
      : existingProfile.phone || undefined;
    const profile = {
      name: firstName.trim() || existingProfile.name || 'Friend',
      lastName: lastName.trim() || existingProfile.lastName,
      email: email.trim() || existingProfile.email,
      phone: resolvedPhone,
      phoneSkipped: skipAccount,
      values: selectedDrivers,
      primaryGoal: declaration.trim(),
      energyLevel: 3,
      onboarded: true,
      commitmentDeclaration: declaration.trim() || undefined,
      notLookingBack: path === 'declared' && !!declaration.trim(),
      onboardingPath: path,
      smsPreferences: existingProfile.smsPreferences,
    };
    updateProfile(profile);
    const state = loadState();
    const plan = generateDailyPlan(profile, state.domainScores, state.goals || []);
    updatePlan(plan);
    const actions = generatePracticePreview(selectedDrivers);
    setPracticeActions(actions);
    setStep('practice');
  }

  return (
    <div className="onboard-shell">
      <div className="onboard-card">

        {/* Progress bar — hidden on first step */}
        {step !== 'drivers' && (
          <div style={{ marginBottom: 32 }}>
            <div style={{ height: 2, background: 'var(--surface3)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{
                height: '100%', background: 'var(--physical)', borderRadius: 2,
                width: `${progress}%`, transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)',
              }} />
            </div>
          </div>
        )}

        {/* ── Step: Drivers ── */}
        {step === 'drivers' && (
          <div className="fade-up">
            <h1 className="onboard-heading">What if it's not<br />you — it's the pattern?</h1>
            <p className="onboard-sub">
              Most people change the wrong thing. Trinitect finds the patterns beneath the patterns — and builds ones that actually compound.
            </p>

            <input
              className="text-input"
              placeholder="Your first name"
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              style={{ marginBottom: 24 }}
            />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <p style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                When you drift — what pulls you back?
              </p>
              <span style={{
                fontSize: 10, fontFamily: 'var(--font-mono)',
                color: selectedDrivers.length > 0 ? 'var(--physical)' : 'var(--text4)',
                transition: 'color 0.2s',
              }}>
                {selectedDrivers.length}/6
              </span>
            </div>

            <div className="values-grid" style={{ marginBottom: 32 }}>
              {DRIVERS.map(({ name, desc }) => (
                <button
                  key={name}
                  className={`value-chip ${selectedDrivers.includes(name) ? 'selected' : ''}`}
                  onClick={() => toggleDriver(name)}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '12px 8px' }}
                >
                  <span style={{ fontSize: 13, fontWeight: 600, lineHeight: 1 }}>{name}</span>
                  <span style={{
                    fontSize: 9, fontFamily: 'var(--font-mono)', letterSpacing: '0.04em',
                    opacity: 0.6, lineHeight: 1,
                  }}>{desc}</span>
                </button>
              ))}
            </div>

            <button
              className="primary-btn"
              onClick={() => setStep('reflection')}
              disabled={selectedDrivers.length === 0}
            >
              These pull me back →
            </button>
          </div>
        )}

        {/* ── Step: Reflection ── */}
        {step === 'reflection' && (
          <div className="fade-up">
            <p style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 20 }}>
              {firstName ? `${firstName}, you named what matters.` : 'You named what matters.'}
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 28 }}>
              {selectedDrivers.map(d => (
                <span key={d} style={{
                  padding: '8px 18px',
                  background: 'rgba(168,255,62,0.07)',
                  border: '1px solid rgba(168,255,62,0.22)',
                  borderRadius: 20,
                  fontSize: 14, fontWeight: 600,
                  color: 'var(--physical)',
                  fontFamily: 'var(--font-display)',
                  letterSpacing: '-0.01em',
                }}>
                  {d}
                </span>
              ))}
            </div>

            <h1 className="onboard-heading" style={{ fontSize: 26, marginBottom: 14 }}>
              Most people never<br />name these out loud.
            </h1>
            <p className="onboard-sub" style={{ marginBottom: 32 }}>
              The patterns we build together will serve what you just named — every day, one small proof at a time.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                className="primary-btn"
                onClick={() => { setPath('declared'); setStep('declaration'); }}
              >
                I have something I want to commit to →
              </button>
              <button
                onClick={() => { setPath('exploring'); setStep('account'); }}
                style={{
                  background: 'none', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)', padding: '14px 24px',
                  color: 'var(--text2)', cursor: 'pointer',
                  fontSize: 14, fontFamily: 'var(--font-display)', fontWeight: 600,
                  transition: 'all var(--transition)',
                }}
                onMouseOver={e => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-hover)';
                  (e.currentTarget as HTMLButtonElement).style.color = 'var(--text1)';
                }}
                onMouseOut={e => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)';
                  (e.currentTarget as HTMLButtonElement).style.color = 'var(--text2)';
                }}
              >
                Show me the patterns first
              </button>
              <button
                onClick={() => setStep('drivers')}
                style={{
                  background: 'none', border: 'none',
                  color: 'var(--text4)', cursor: 'pointer',
                  fontSize: 11, fontFamily: 'var(--font-mono)',
                  padding: '6px 0', letterSpacing: '0.06em',
                  textAlign: 'center',
                }}
              >
                ← edit my drivers
              </button>
            </div>
          </div>
        )}

        {/* ── Step: Declaration (Path A) ── */}
        {step === 'declaration' && (
          <div className="fade-up">
            {/* Driver context chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
              {selectedDrivers.map(d => (
                <span key={d} style={{
                  padding: '4px 12px',
                  background: 'rgba(168,255,62,0.06)',
                  border: '1px solid rgba(168,255,62,0.15)',
                  borderRadius: 20,
                  fontSize: 11, fontWeight: 500,
                  color: 'var(--physical)',
                  fontFamily: 'var(--font-mono)',
                  opacity: 0.75,
                }}>
                  {d}
                </span>
              ))}
            </div>

            <h1 className="onboard-heading" style={{ fontSize: 26, marginBottom: 12 }}>
              What would you commit to —<br />before you know how?
            </h1>
            <p className="onboard-sub" style={{ marginBottom: 24 }}>
              Don't think it through. Your gut knows. Type the first thing that comes up.
            </p>

            <textarea
              autoFocus
              value={declaration}
              onChange={e => setDeclaration(e.target.value)}
              placeholder={`e.g. "Run a marathon." "Ask for the promotion." "Prove I'm not broken."`}
              style={{
                width: '100%', minHeight: 130,
                background: 'var(--surface2)',
                border: '1.5px solid var(--border)',
                borderRadius: 'var(--radius)',
                padding: '16px 18px',
                color: 'var(--text1)',
                fontSize: 17, fontFamily: 'var(--font-display)', fontWeight: 600,
                outline: 'none', resize: 'none', lineHeight: 1.5,
                marginBottom: 8,
                transition: 'border-color var(--transition), box-shadow var(--transition)',
              }}
              onFocus={e => {
                e.target.style.borderColor = 'rgba(168,255,62,0.5)';
                e.target.style.boxShadow = '0 0 0 3px rgba(168,255,62,0.07)';
              }}
              onBlur={e => {
                e.target.style.borderColor = 'var(--border)';
                e.target.style.boxShadow = 'none';
              }}
            />
            <p style={{ fontSize: 11, color: 'var(--text4)', fontFamily: 'var(--font-mono)', marginBottom: 28, letterSpacing: '0.06em' }}>
              You don't need the plan yet. Just the yes.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                className="primary-btn"
                onClick={() => setStep('account')}
                disabled={!declaration.trim()}
              >
                I'm not looking back →
              </button>
              <button
                onClick={() => setStep('reflection')}
                style={{
                  background: 'none', border: 'none',
                  color: 'var(--text4)', cursor: 'pointer',
                  fontSize: 11, fontFamily: 'var(--font-mono)',
                  padding: '8px 0', letterSpacing: '0.06em',
                  textAlign: 'center',
                }}
              >
                ← back
              </button>
            </div>
          </div>
        )}

        {/* ── Step: Account ── */}
        {step === 'account' && (
          <div className="fade-up">
            {path === 'declared' && declaration ? (
              <div style={{ background: 'rgba(168,255,62,0.05)', border: '1px solid rgba(168,255,62,0.18)', borderRadius: 'var(--radius)', padding: '14px 18px', marginBottom: 22 }}>
                <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--physical)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6 }}>Your commitment</div>
                <div style={{ fontSize: 15, fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--text1)', lineHeight: 1.4 }}>"{declaration}"</div>
              </div>
            ) : null}

            {alreadyAuthed ? (
              <>
                <h1 className="onboard-heading" style={{ fontSize: 24, marginBottom: 8 }}>You're already in.</h1>
                <p className="onboard-sub" style={{ marginBottom: 24 }}>
                  Your account is linked. Give us a first name and we'll personalize your experience.
                </p>
                <input
                  className="text-input"
                  placeholder="First name"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  autoFocus
                />
                <button
                  className="primary-btn"
                  onClick={() => saveAndProceed(false)}
                >
                  Start your practice →
                </button>
                <button
                  onClick={() => setStep(path === 'declared' ? 'declaration' : 'reflection')}
                  style={{ width: '100%', background: 'none', border: 'none', color: 'var(--text4)', cursor: 'pointer', fontSize: 11, fontFamily: 'var(--font-mono)', padding: '4px 0 8px', letterSpacing: '0.06em', textAlign: 'center' }}
                >
                  ← back
                </button>
              </>
            ) : !otpSent ? (
              <>
                <h1 className="onboard-heading" style={{ fontSize: 24, marginBottom: 8 }}>
                  {path === 'declared' ? "Let's protect it." : 'Save your foundation.'}
                </h1>
                <p className="onboard-sub" style={{ marginBottom: 28 }}>
                  Enter your first name and phone — we'll send a code to verify and create your account.
                </p>

                <input
                  className="text-input"
                  placeholder="First name"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                />
                <input
                  className="text-input"
                  type="tel"
                  placeholder="(555) 000-0000"
                  value={phone}
                  onChange={e => { setPhone(formatPhone(e.target.value)); setOtpError(''); }}
                  style={{ fontSize: 18, letterSpacing: '0.04em' }}
                />

                {otpError && <div style={{ fontSize: 11, color: '#ff8c69', fontFamily: 'var(--font-mono)', marginBottom: 12 }}>{otpError}</div>}

                <button
                  className="primary-btn"
                  disabled={otpLoading || e164(phone).length !== 12}
                  onClick={handleSendCode}
                >
                  {otpLoading ? 'Sending…' : 'Send code →'}
                </button>
                <button
                  onClick={() => saveAndProceed(true)}
                  style={{ width: '100%', background: 'none', border: 'none', color: 'var(--text4)', cursor: 'pointer', fontSize: 11, fontFamily: 'var(--font-mono)', padding: '12px 0', letterSpacing: '0.06em', textAlign: 'center' }}
                >
                  I'll do this later →
                </button>
                <button
                  onClick={() => setStep(path === 'declared' ? 'declaration' : 'reflection')}
                  style={{ width: '100%', background: 'none', border: 'none', color: 'var(--text4)', cursor: 'pointer', fontSize: 11, fontFamily: 'var(--font-mono)', padding: '4px 0 8px', letterSpacing: '0.06em', textAlign: 'center' }}
                >
                  ← back
                </button>
              </>
            ) : (
              <>
                <button onClick={() => { setOtpSent(false); setOtp(''); setOtpError(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text4)', padding: 0, marginBottom: 20, letterSpacing: '0.06em' }}>← Change number</button>
                <h1 className="onboard-heading" style={{ fontSize: 24, marginBottom: 8 }}>Check your phone.</h1>
                <p className="onboard-sub" style={{ marginBottom: 6 }}>We sent a 6-digit code to</p>
                <p style={{ fontSize: 14, color: 'var(--physical)', fontFamily: 'var(--font-mono)', fontWeight: 600, marginBottom: 28 }}>{phone}</p>

                <input
                  className="text-input"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  placeholder="——————"
                  value={otp}
                  onChange={e => { setOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); setOtpError(''); }}
                  style={{ fontSize: 24, letterSpacing: '0.3em', textAlign: 'center', fontFamily: 'var(--font-mono)' }}
                  autoFocus
                />

                {otpError && <div style={{ fontSize: 11, color: '#ff8c69', fontFamily: 'var(--font-mono)', marginBottom: 12 }}>{otpError}</div>}

                <button className="primary-btn" disabled={otpLoading || otp.length !== 6} onClick={handleVerifyAndProceed}>
                  {otpLoading ? 'Verifying…' : 'Verify & start →'}
                </button>
                <div style={{ textAlign: 'center', marginTop: 14 }}>
                  <button
                    onClick={() => { if (resendCountdown > 0) return; setOtp(''); handleSendCode(); }}
                    disabled={resendCountdown > 0}
                    style={{ background: 'none', border: 'none', cursor: resendCountdown > 0 ? 'default' : 'pointer', fontSize: 11, fontFamily: 'var(--font-mono)', color: resendCountdown > 0 ? 'var(--text4)' : 'var(--mental)', letterSpacing: '0.06em' }}
                  >
                    {resendCountdown > 0 ? `Resend in ${resendCountdown}s` : 'Resend code'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Step: Practice Preview ── */}
        {step === 'practice' && (
          <div className="fade-up">
            <p style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 20 }}>
              Your first practice
            </p>
            <h1 className="onboard-heading" style={{ fontSize: 26, marginBottom: 10 }}>
              Three domains.<br />One practice.
            </h1>
            <p className="onboard-sub" style={{ marginBottom: 24 }}>
              Matched to{' '}
              <span style={{ color: 'var(--physical)', fontWeight: 600 }}>
                {selectedDrivers.slice(0, 2).join(' & ')}
              </span>
              {selectedDrivers.length > 2 ? ` and ${selectedDrivers.length - 2} more` : ''}.{' '}
              {practiceActions.reduce((s, a) => s + a.duration, 0)} minutes total.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
              {practiceActions.map(action => {
                const matchedDriver = selectedDrivers.find(d =>
                  (action.themes || []).some(t => (DRIVER_THEMES[d] || []).includes(t))
                );
                return (
                  <div key={action.id} style={{
                    background: 'var(--surface2)',
                    border: '1px solid var(--border)',
                    borderLeft: `3px solid ${DOMAIN_COLOR[action.domain]}`,
                    borderRadius: 'var(--radius-sm)',
                    padding: '14px 16px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                      <span style={{
                        fontSize: 8, fontFamily: 'var(--font-mono)', textTransform: 'uppercase',
                        letterSpacing: '0.1em', color: DOMAIN_COLOR[action.domain],
                        background: `${DOMAIN_COLOR[action.domain]}18`,
                        padding: '2px 7px', borderRadius: 10,
                      }}>
                        {action.domain}
                      </span>
                      {matchedDriver && (
                        <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text4)', letterSpacing: '0.06em' }}>
                          for {matchedDriver}
                        </span>
                      )}
                      <span style={{ marginLeft: 'auto', fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text4)' }}>
                        {action.duration}m
                      </span>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text1)', fontFamily: 'var(--font-display)', marginBottom: 3 }}>
                      {action.title}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', lineHeight: 1.5 }}>
                      {action.description}
                    </div>
                  </div>
                );
              })}
            </div>

            <button className="primary-btn" onClick={() => router.push('/today')}>
              Begin today's practice →
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
