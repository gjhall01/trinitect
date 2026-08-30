'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { loadState, updateProfile, updatePlan } from '@/lib/store';
import { generateDailyPlan } from '@/lib/mock-ai';

const VALUES = [
  'Vitality', 'Clarity', 'Mastery', 'Meaning', 'Freedom', 'Connection',
  'Discipline', 'Creativity', 'Wisdom', 'Impact', 'Growth', 'Peace',
];

const QUICK_GOALS = [
  'Build consistent daily energy', 'Deepen focus and mental clarity',
  'Align daily actions with values', 'Develop physical resilience',
];

type Step = 'values' | 'goal' | 'energy';

export default function Onboarding() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<Step>('values');
  const [name, setName] = useState('');
  const [selectedValues, setSelectedValues] = useState<string[]>([]);
  const [goal, setGoal] = useState('');
  const [energy, setEnergy] = useState(0);

  useEffect(() => {
    setMounted(true);
    const s = loadState();
    if (s.profile.onboarded) router.replace('/dashboard');
  }, [router]);

  if (!mounted) return null;

  const stepIndex = ({ values: 0, goal: 1, energy: 2 } as const)[step];

  function toggleValue(v: string) {
    setSelectedValues(prev =>
      prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v].slice(0, 6)
    );
  }

  function handleFinish() {
    const state = loadState();
    const profile = {
      name: name.trim(),
      values: selectedValues,
      primaryGoal: goal || QUICK_GOALS[0],
      energyLevel: energy,
      onboarded: true,
    };
    updateProfile(profile);
    const plan = generateDailyPlan(profile, state.domainScores);
    updatePlan(plan);
    router.push('/dashboard');
  }

  return (
    <div className="onboard-shell">
      <div className="onboard-card">

        {/* Step dots */}
        <div className="onboard-step-indicator">
          {(['values', 'goal', 'energy'] as Step[]).map((s, i) => (
            <div
              key={s}
              className={`step-dot ${i === stepIndex ? 'active' : i < stepIndex ? 'done' : ''}`}
            />
          ))}
        </div>

        {/* Step: Values */}
        {step === 'values' && (
          <div className="fade-up">
            <h1 className="onboard-heading">Build a life<br />that compounds.</h1>
            <p className="onboard-sub">
              Trinitect helps you replace low-leverage patterns with small, consistent actions across three domains — physical, mental, and spiritual — that generate real momentum over time.
            </p>

            <input
              className="text-input"
              placeholder="Your first name (optional)"
              value={name}
              onChange={e => setName(e.target.value)}
              style={{ marginBottom: 24 }}
            />

            <p style={{ fontSize: 12, color: 'var(--text3)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
              What matters most to you? Pick up to 6.
            </p>
            <div className="values-grid">
              {VALUES.map(v => (
                <button
                  key={v}
                  className={`value-chip ${selectedValues.includes(v) ? 'selected' : ''}`}
                  onClick={() => toggleValue(v)}
                >
                  {v}
                </button>
              ))}
            </div>

            <button
              className="primary-btn"
              onClick={() => setStep('goal')}
              disabled={selectedValues.length === 0}
            >
              Continue →
            </button>
          </div>
        )}

        {/* Step: Goal */}
        {step === 'goal' && (
          <div className="fade-up">
            <h1 className="onboard-heading">What's your<br />primary focus?</h1>
            <p className="onboard-sub">
              Your plan adapts to this. You can always refine it later — pick what resonates most right now.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
              {QUICK_GOALS.map(g => (
                <button
                  key={g}
                  onClick={() => setGoal(g)}
                  style={{
                    background: goal === g ? 'var(--accent-dim)' : 'var(--surface2)',
                    border: `1.5px solid ${goal === g ? 'rgba(168,255,62,0.4)' : 'var(--border)'}`,
                    borderRadius: 'var(--radius-sm)',
                    padding: '12px 16px',
                    color: goal === g ? 'var(--physical)' : 'var(--text2)',
                    fontSize: 14,
                    fontWeight: 500,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all var(--transition)',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  {g}
                </button>
              ))}
            </div>

            <p style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-mono)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Or describe your own
            </p>
            <input
              className="text-input"
              placeholder="e.g. Build morning discipline and protect deep work time"
              value={QUICK_GOALS.includes(goal) ? '' : goal}
              onChange={e => setGoal(e.target.value)}
            />

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setStep('values')}
                style={{ flex: 1, padding: 15, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text2)', cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14 }}
              >
                ← Back
              </button>
              <button
                className="primary-btn"
                style={{ flex: 2 }}
                onClick={() => setStep('energy')}
              >
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* Step: Energy */}
        {step === 'energy' && (
          <div className="fade-up">
            <h1 className="onboard-heading">How's your<br />energy today?</h1>
            <p className="onboard-sub">
              Your first plan is calibrated to where you are right now, not where you want to be. Low-friction start, compounding from there.
            </p>

            <div className="energy-scale">
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  className={`energy-btn ${energy === n ? 'selected' : ''}`}
                  onClick={() => setEnergy(n)}
                >
                  {n}
                </button>
              ))}
            </div>
            <div className="energy-labels">
              <span>depleted</span>
              <span>optimal</span>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setStep('goal')}
                style={{ flex: 1, padding: 15, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text2)', cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14 }}
              >
                ← Back
              </button>
              <button
                className="primary-btn"
                style={{ flex: 2 }}
                onClick={handleFinish}
                disabled={energy === 0}
              >
                Build my plan →
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
