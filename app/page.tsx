'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { loadState, updateProfile, updatePlan } from '@/lib/store';
import { generateDailyPlan, generatePracticePreview, DRIVER_THEMES } from '@/lib/mock-ai';
import type { Action } from '@/lib/types';

const DRIVERS = [
  'Vitality', 'Clarity', 'Mastery', 'Meaning', 'Freedom', 'Connection',
  'Discipline', 'Creativity', 'Wisdom', 'Impact', 'Growth', 'Peace',
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

  useEffect(() => {
    setMounted(true);
    const s = loadState();
    if (s.profile.onboarded) router.replace('/today');
  }, [router]);

  if (!mounted) return null;

  function toggleDriver(d: string) {
    setSelectedDrivers(prev =>
      prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d].slice(0, 6)
    );
  }

  const steps: Step[] = path === 'declared'
    ? ['drivers', 'reflection', 'declaration', 'account', 'practice']
    : ['drivers', 'reflection', 'account', 'practice'];
  const stepIdx = steps.indexOf(step);
  const progress = stepIdx <= 0 ? 0 : (stepIdx / (steps.length - 1)) * 100;

  function handleAccount() {
    const profile = {
      name: firstName.trim() || 'Friend',
      lastName: lastName.trim(),
      email: email.trim(),
      phone: phone.replace(/\D/g, '').length === 10
        ? `+1${phone.replace(/\D/g, '')}`
        : phone.trim() || undefined,
      values: selectedDrivers,
      primaryGoal: declaration.trim(),
      energyLevel: 3,
      onboarded: true,
      commitmentDeclaration: declaration.trim() || undefined,
      notLookingBack: path === 'declared' && !!declaration.trim(),
      onboardingPath: path,
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

            <p style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 14 }}>
              When you drift — what pulls you back? Pick up to 6.
            </p>
            <div className="values-grid">
              {DRIVERS.map(d => (
                <button
                  key={d}
                  className={`value-chip ${selectedDrivers.includes(d) ? 'selected' : ''}`}
                  onClick={() => toggleDriver(d)}
                >
                  {d}
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
            </div>
          </div>
        )}

        {/* ── Step: Declaration (Path A) ── */}
        {step === 'declaration' && (
          <div className="fade-up">
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
                transition: 'border-color var(--transition)',
              }}
              onFocus={e => e.target.style.borderColor = 'rgba(168,255,62,0.4)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
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
              <>
                <div style={{
                  background: 'rgba(168,255,62,0.05)',
                  border: '1px solid rgba(168,255,62,0.18)',
                  borderRadius: 'var(--radius)',
                  padding: '16px 20px',
                  marginBottom: 24,
                }}>
                  <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--physical)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>
                    Your commitment
                  </div>
                  <div style={{ fontSize: 16, fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--text1)', lineHeight: 1.4 }}>
                    "{declaration}"
                  </div>
                </div>
                <h1 className="onboard-heading" style={{ fontSize: 24, marginBottom: 8 }}>Let's protect it.</h1>
                <p className="onboard-sub" style={{ marginBottom: 28 }}>
                  Create your free account. Your commitment and drivers are yours to keep.
                </p>
              </>
            ) : (
              <>
                <h1 className="onboard-heading" style={{ fontSize: 24, marginBottom: 8 }}>Save your foundation.</h1>
                <p className="onboard-sub" style={{ marginBottom: 28 }}>
                  Create your free account. Your drivers and progress will be waiting every time you return.
                </p>
              </>
            )}

            <div style={{ display: 'flex', gap: 10, marginBottom: 0 }}>
              <input
                className="text-input"
                style={{ marginBottom: 12, flex: 1 }}
                placeholder="First name"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
              />
              <input
                className="text-input"
                style={{ marginBottom: 12, flex: 1 }}
                placeholder="Last name"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
              />
            </div>
            <input
              className="text-input"
              placeholder="Email address"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
            <input
              className="text-input"
              placeholder="Phone number (optional — for reminders)"
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
            />

            <button
              className="primary-btn"
              onClick={handleAccount}
              disabled={!email.trim()}
            >
              Create my account →
            </button>
            <button
              onClick={handleAccount}
              style={{
                width: '100%', background: 'none', border: 'none',
                color: 'var(--text4)', cursor: 'pointer',
                fontSize: 11, fontFamily: 'var(--font-mono)',
                padding: '12px 0', letterSpacing: '0.06em',
                textAlign: 'center',
              }}
            >
              I'll do this later →
            </button>
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
              Built around{' '}
              {selectedDrivers.slice(0, 2).join(' and ')}.{' '}
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
