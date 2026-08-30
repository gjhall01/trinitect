'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import ActionCard from '@/components/ActionCard';
import { loadState, completedAction, updatePlan } from '@/lib/store';
import { generateDailyPlan, getReplacementSuggestions } from '@/lib/mock-ai';
import type { AppState, Action } from '@/lib/types';

const TRIGGER_OPTIONS = ['stress', 'boredom', 'fatigue', 'distraction'];

function TotalTime({ actions }: { actions: Action[] }) {
  const mins = actions.reduce((sum, a) => sum + a.duration, 0);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return <>{h > 0 ? `${h}h ${m}m` : `${m} min`}</>;
}

export default function PlanPage() {
  const router = useRouter();
  const [state, setState] = useState<AppState | null>(null);
  const [mounted, setMounted] = useState(false);
  const [showReplace, setShowReplace] = useState(false);
  const [selectedTrigger, setSelectedTrigger] = useState<string | null>(null);
  const [replacements, setReplacements] = useState<string[]>([]);

  useEffect(() => {
    const s = loadState();
    if (!s.profile.onboarded) { router.replace('/'); return; }
    const today = new Date().toISOString().split('T')[0];
    if (!s.todaysPlan || s.todaysPlan.date !== today) {
      const plan = generateDailyPlan(s.profile, s.domainScores);
      updatePlan(plan);
      setState({ ...s, todaysPlan: plan });
    } else {
      setState(s);
    }
    setMounted(true);
  }, [router]);

  const handleComplete = useCallback((actionId: string) => {
    completedAction(actionId);
    setState(loadState());
  }, []);

  const handleTrigger = (trigger: string) => {
    setSelectedTrigger(trigger);
    setReplacements(getReplacementSuggestions(trigger));
  };

  const handleRefreshPlan = () => {
    if (!state) return;
    const plan = generateDailyPlan(state.profile, state.domainScores);
    updatePlan(plan);
    setState({ ...state, todaysPlan: plan });
  };

  if (!mounted || !state) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div style={{ width: 32, height: 32, border: '2px solid rgba(168,255,62,0.2)', borderTopColor: '#a8ff3e', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const { todaysPlan, profile } = state;
  const actions = todaysPlan?.actions ?? [];
  const completed = actions.filter(a => a.completed).length;
  const allDone = completed === actions.length && actions.length > 0;
  const pct = actions.length > 0 ? Math.round((completed / actions.length) * 100) : 0;

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <AppLayout activeHref="/plan">
      <div style={{ maxWidth: 720 }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }} className="fade-up">
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text1)', lineHeight: 1.15 }}>
            {allDone ? "Today's done. ✦" : "Today's Plan"}
          </h1>
          <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 5, fontFamily: 'var(--font-mono)' }}>
            {today}
          </p>
        </div>

        {/* Progress summary */}
        <div className="fade-up fade-up-d1" style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '20px 24px',
          marginBottom: 20,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: pct === 100 ? 'var(--physical)' : 'var(--text1)', lineHeight: 1 }}>
                {pct}%
              </div>
              <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text3)', marginTop: 2 }}>
                {completed} of {actions.length} patterns · <TotalTime actions={actions} /> total
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              {actions.map(a => (
                <div key={a.id} style={{
                  width: 10, height: 10, borderRadius: '50%',
                  background: a.completed
                    ? (a.domain === 'physical' ? 'var(--physical)' : a.domain === 'mental' ? 'var(--mental)' : 'var(--spiritual)')
                    : 'var(--surface3)',
                  transition: 'background 0.4s',
                }} />
              ))}
            </div>
          </div>
          <div style={{ background: 'var(--surface3)', borderRadius: 3, height: 5, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 3,
              background: 'linear-gradient(90deg, var(--physical) 0%, var(--mental) 100%)',
              width: `${pct}%`,
              transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
            }} />
          </div>
        </div>

        {/* Completion message */}
        {allDone && (
          <div className="fade-up" style={{
            background: 'rgba(168,255,62,0.06)',
            border: '1px solid rgba(168,255,62,0.25)',
            borderRadius: 'var(--radius)',
            padding: '18px 22px',
            marginBottom: 20,
            display: 'flex', alignItems: 'center', gap: 16,
          }}>
            <div style={{ fontSize: 28 }}>✦</div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: 'var(--physical)', marginBottom: 3 }}>
                All three domains today.
              </div>
              <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.5 }}>
                Physical, mental, spiritual — the full cycle. That's not discipline, that's a pattern. Come back tomorrow and do it again.
              </div>
            </div>
          </div>
        )}

        {/* Action cards */}
        <div className="fade-up fade-up-d2" style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--text4)', marginBottom: 12 }}>
            Patterns for today
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {actions.map((action, i) => (
              <div key={action.id} className={`fade-up fade-up-d${i + 1}`}>
                <ActionCard action={action} onComplete={handleComplete} />
              </div>
            ))}
          </div>
        </div>

        {/* Replacement suggestions */}
        <div className="fade-up fade-up-d3" style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '20px 22px',
          marginBottom: 20,
        }}>
          <button
            onClick={() => setShowReplace(r => !r)}
            style={{
              width: '100%', background: 'none', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: 0, textAlign: 'left',
            }}
          >
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text1)', marginBottom: 2 }}>
                Can't do one of these?
              </div>
              <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text3)' }}>
                Find a pattern that works for how you're feeling right now
              </div>
            </div>
            <span style={{ color: 'var(--text3)', fontFamily: 'var(--font-mono)', fontSize: 10 }}>
              {showReplace ? '▲' : '▼'}
            </span>
          </button>

          {showReplace && (
            <div style={{ marginTop: 18, animation: 'fadeIn 0.2s ease both' }}>
              <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
                What's getting in the way?
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                {TRIGGER_OPTIONS.map(t => (
                  <button
                    key={t}
                    onClick={() => handleTrigger(t)}
                    style={{
                      padding: '7px 14px',
                      background: selectedTrigger === t ? 'rgba(168,255,62,0.1)' : 'var(--surface2)',
                      border: `1px solid ${selectedTrigger === t ? 'rgba(168,255,62,0.4)' : 'var(--border)'}`,
                      borderRadius: 20, cursor: 'pointer',
                      fontSize: 11, fontFamily: 'var(--font-mono)',
                      color: selectedTrigger === t ? 'var(--physical)' : 'var(--text2)',
                      textTransform: 'capitalize',
                      transition: 'all var(--transition)',
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {replacements.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {replacements.map(r => (
                    <div key={r} style={{
                      padding: '10px 14px',
                      background: 'var(--surface2)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border)',
                      display: 'flex', alignItems: 'center', gap: 10,
                    }}>
                      <span style={{ color: 'var(--physical)', fontSize: 12, flexShrink: 0 }}>→</span>
                      <span style={{ fontSize: 12, color: 'var(--text1)' }}>{r}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Refresh plan */}
        <div className="fade-up fade-up-d4" style={{ display: 'flex', justifyContent: 'center' }}>
          <button
            onClick={handleRefreshPlan}
            style={{
              background: 'none',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: '10px 24px',
              fontSize: 12,
              fontFamily: 'var(--font-mono)',
              color: 'var(--text3)',
              cursor: 'pointer',
              transition: 'all var(--transition)',
            }}
            onMouseOver={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-hover)';
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--text2)';
            }}
            onMouseOut={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)';
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--text3)';
            }}
          >
            ↺ generate new patterns
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </AppLayout>
  );
}
