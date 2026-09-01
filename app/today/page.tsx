'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import ActionCard from '@/components/ActionCard';
import SaveProgressModal from '@/components/SaveProgressModal';
import { loadState, completedAction, updatePlan, updateProfile } from '@/lib/store';
import { generateDailyPlan, explainPattern, getReplacementSuggestions } from '@/lib/mock-ai';
import type { AppState, Action, Goal, Task } from '@/lib/types';

const TRIGGERS = ['stress', 'boredom', 'fatigue', 'distraction'];
const STREAK_MILESTONES = new Set([1, 3, 7, 14, 21, 30, 60, 90]);

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatDate() {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

function shouldShowSavePrompt(s: AppState): boolean {
  if (s.profile.phone || s.profile.phoneSkipped) return false;
  return (s.todaysPlan?.actions.filter(a => a.completed).length ?? 0) >= 1;
}

// Inline declaration form — the $800 moment triggered by streak consistency
function CommitmentMoment({ streak, drivers, onDeclare }: {
  streak: number;
  drivers: string[];
  onDeclare: (text: string) => void;
}) {
  const [text, setText] = useState('');
  const [saved, setSaved] = useState(false);

  function handleSubmit() {
    const trimmed = text.trim();
    if (!trimmed) return;
    onDeclare(trimmed);
    setSaved(true);
  }

  if (saved) {
    return (
      <div style={{
        background: 'rgba(168,255,62,0.06)',
        border: '1px solid rgba(168,255,62,0.25)',
        borderRadius: 'var(--radius)',
        padding: '20px 22px',
        animation: 'fadeIn 0.4s ease both',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 22, marginBottom: 10 }}>✦</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--physical)', marginBottom: 6 }}>
          That's the one.
        </div>
        <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.6 }}>
          You're not looking back. Come back tomorrow and keep building.
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: 'rgba(212,160,255,0.04)',
      border: '1px solid rgba(212,160,255,0.18)',
      borderRadius: 'var(--radius)',
      padding: '20px 22px',
      animation: 'fadeIn 0.4s ease both',
    }}>
      <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--spiritual)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10 }}>
        {streak} days straight
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--text1)', marginBottom: 6, letterSpacing: '-0.02em', lineHeight: 1.3 }}>
        The pattern is real.<br />What is it for?
      </div>
      <div style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.6, marginBottom: 16 }}>
        You've shown up {streak} days. That's not motivation — that's character. Now give it a direction.
      </div>

      {drivers.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 14 }}>
          {drivers.map(d => (
            <span key={d} style={{
              padding: '3px 9px',
              background: 'rgba(212,160,255,0.07)',
              border: '1px solid rgba(212,160,255,0.15)',
              borderRadius: 20,
              fontSize: 9, fontFamily: 'var(--font-mono)',
              color: 'rgba(212,160,255,0.65)',
            }}>
              {d}
            </span>
          ))}
        </div>
      )}

      <textarea
        autoFocus
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder={`e.g. "Prove I can finish what I start." "Run a marathon." "Earn the promotion."`}
        style={{
          width: '100%', minHeight: 90,
          background: 'var(--surface2)',
          border: '1.5px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
          padding: '12px 14px',
          color: 'var(--text1)',
          fontSize: 14, fontFamily: 'var(--font-display)', fontWeight: 600,
          outline: 'none', resize: 'none', lineHeight: 1.5,
          marginBottom: 12,
          transition: 'border-color var(--transition), box-shadow var(--transition)',
        }}
        onFocus={e => {
          e.target.style.borderColor = 'rgba(212,160,255,0.45)';
          e.target.style.boxShadow = '0 0 0 3px rgba(212,160,255,0.06)';
        }}
        onBlur={e => {
          e.target.style.borderColor = 'var(--border)';
          e.target.style.boxShadow = 'none';
        }}
        onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit(); }}
      />

      <button
        onClick={handleSubmit}
        disabled={!text.trim()}
        style={{
          width: '100%',
          background: text.trim() ? 'var(--spiritual)' : 'var(--surface3)',
          border: 'none', borderRadius: 'var(--radius-sm)',
          padding: '12px 18px', cursor: text.trim() ? 'pointer' : 'not-allowed',
          fontSize: 13, fontFamily: 'var(--font-display)', fontWeight: 700,
          color: text.trim() ? 'var(--bg)' : 'var(--text4)',
          transition: 'all 0.2s',
          letterSpacing: '-0.01em',
        }}
      >
        I'm not looking back →
      </button>
    </div>
  );
}

// The intelligent next step shown after all 3 patterns are done
function NextStep({ goals, tasks, streak, commitment, drivers, onDeclare, router }: {
  goals: Goal[];
  tasks: Task[];
  streak: number;
  commitment?: string;
  drivers: string[];
  onDeclare: (text: string) => void;
  router: ReturnType<typeof useRouter>;
}) {
  const activeGoals = goals.filter(g => !g.archived);
  const openMoves = tasks.filter(t => !t.completed);

  // Streak ≥ 10 with no declaration → inline commitment moment (highest nudge priority)
  if (!commitment && streak >= 10 && activeGoals.length === 0) {
    return <CommitmentMoment streak={streak} drivers={drivers} onDeclare={onDeclare} />;
  }

  let headline = '';
  let body = '';
  let cta: { label: string; href: string } | null = null;
  let tone: 'commitment' | 'nudge' | 'build' = 'build';

  if (activeGoals.length > 0 && openMoves.length > 0) {
    const move = openMoves[0];
    const forGoal = activeGoals.find(g => g.id === move.goalId);
    headline = 'Your next move';
    body = forGoal ? `Toward "${forGoal.title}"` : 'You have an open move waiting.';
    cta = { label: move.title, href: '/commitments' };
    tone = 'commitment';
  } else if (activeGoals.length > 0) {
    const goal = activeGoals[0];
    headline = 'Keep the momentum going';
    body = `You're building toward "${goal.title}". What's the next move?`;
    cta = { label: 'Add a move →', href: '/commitments' };
    tone = 'commitment';
  } else if (streak >= 7) {
    headline = `${streak} days straight.`;
    body = "That's not motivation — that's character forming. You're ready for something bigger.";
    cta = { label: 'Make a commitment →', href: '/commitments' };
    tone = 'nudge';
  } else if (streak >= 3) {
    headline = 'The pattern is forming.';
    body = `${streak} days and counting. Keep showing up — something is building under the surface.`;
    tone = 'build';
  } else {
    headline = 'Day one done.';
    body = 'Come back tomorrow. The compounding starts with the second day.';
    tone = 'build';
  }

  const colors: Record<typeof tone, string> = {
    commitment: 'var(--physical)',
    nudge: 'var(--mental)',
    build: 'var(--spiritual)',
  };
  const color = colors[tone];

  return (
    <div style={{
      background: `${color}08`,
      border: `1px solid ${color}22`,
      borderRadius: 'var(--radius)',
      padding: '20px 22px',
      animation: 'fadeIn 0.4s ease both',
    }}>
      <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>
        What's next
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700, color: 'var(--text1)', marginBottom: 6, letterSpacing: '-0.02em' }}>
        {headline}
      </div>
      <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6, marginBottom: cta ? 16 : 0 }}>
        {body}
      </div>
      {cta && (
        <button
          onClick={() => router.push(cta!.href)}
          style={{
            background: color, border: 'none', borderRadius: 'var(--radius-sm)',
            padding: '10px 18px', cursor: 'pointer',
            fontSize: 12, fontFamily: 'var(--font-display)', fontWeight: 700,
            color: 'var(--bg)', letterSpacing: '-0.01em',
            maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}
        >
          {cta.label}
        </button>
      )}
    </div>
  );
}

export default function TodayPage() {
  const router = useRouter();
  const [state, setState] = useState<AppState | null>(null);
  const [mounted, setMounted] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showSavedToast, setShowSavedToast] = useState(false);
  const [showUpgradeToast, setShowUpgradeToast] = useState(false);
  const [showReplace, setShowReplace] = useState(false);
  const [selectedTrigger, setSelectedTrigger] = useState<string | null>(null);
  const [replacements, setReplacements] = useState<string[]>([]);
  const [milestoneStreak, setMilestoneStreak] = useState<number | null>(null);

  useEffect(() => {
    const s = loadState();
    if (!s.profile.onboarded) { router.replace('/'); return; }
    const today = new Date().toISOString().split('T')[0];
    if (!s.todaysPlan || s.todaysPlan.date !== today) {
      const plan = generateDailyPlan(s.profile, s.domainScores, s.goals || []);
      updatePlan(plan);
      setState({ ...s, todaysPlan: plan });
    } else {
      setState(s);
    }
    setMounted(true);

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('upgraded') === '1') {
        setShowUpgradeToast(true);
        setTimeout(() => setShowUpgradeToast(false), 5000);
        window.history.replaceState({}, '', '/today');
      }
    }
  }, [router]);

  const handleComplete = useCallback((actionId: string) => {
    const before = loadState();
    completedAction(actionId);
    const updated = loadState();
    setState(updated);
    if (shouldShowSavePrompt(updated)) {
      setTimeout(() => setShowSaveModal(true), 700);
    }
    // Check for streak milestone (only fires on the final pattern completing all 3)
    const allDoneNow = updated.todaysPlan?.actions.every(a => a.completed);
    const wasDoneAlready = before.todaysPlan?.actions.every(a => a.completed);
    if (allDoneNow && !wasDoneAlready && STREAK_MILESTONES.has(updated.streak)) {
      setTimeout(() => {
        setMilestoneStreak(updated.streak);
        setTimeout(() => setMilestoneStreak(null), 5000);
      }, 500);
    }
  }, []);

  const handleSaved = useCallback(() => {
    setShowSaveModal(false);
    setState(loadState());
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 3000);
  }, []);

  const handleSkip = useCallback(() => {
    setShowSaveModal(false);
    setState(loadState());
  }, []);

  if (!mounted || !state) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div style={{ width: 32, height: 32, border: '2px solid rgba(168,255,62,0.2)', borderTopColor: '#a8ff3e', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const handleDeclare = useCallback((text: string) => {
    const s = loadState();
    updateProfile({ ...s.profile, commitmentDeclaration: text, notLookingBack: true });
    setState(loadState());
  }, []);

  const { profile, todaysPlan, streak, goals = [], tasks = [] } = state;
  const actions: Action[] = todaysPlan?.actions ?? [];
  const completedCount = actions.filter(a => a.completed).length;
  const allDone = completedCount === actions.length && actions.length > 0;
  const pct = actions.length > 0 ? Math.round((completedCount / actions.length) * 100) : 0;
  const totalMin = actions.reduce((s, a) => s + a.duration, 0);

  return (
    <AppLayout activeHref="/today">
      <div style={{ maxWidth: 680 }}>

        {/* Toasts */}
        {milestoneStreak && (
          <div style={{
            position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)',
            background: 'linear-gradient(135deg, var(--surface) 0%, rgba(168,255,62,0.04) 100%)',
            border: '1px solid rgba(168,255,62,0.5)',
            borderRadius: 40, padding: '14px 28px',
            display: 'flex', alignItems: 'center', gap: 14,
            zIndex: 600, animation: 'toastIn 0.4s cubic-bezier(0.34,1.56,0.64,1) both',
            boxShadow: '0 12px 48px rgba(168,255,62,0.2)',
            whiteSpace: 'nowrap',
          }}>
            <span style={{ fontSize: 22, lineHeight: 1 }}>✦</span>
            <div>
              <div style={{ fontSize: 15, color: 'var(--physical)', fontWeight: 800, fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>
                {milestoneStreak} day streak.
              </div>
              <div style={{ fontSize: 11, color: 'var(--text2)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                {milestoneStreak === 1 ? 'The first is the hardest.' :
                 milestoneStreak === 3 ? 'Three in a row. Keep going.' :
                 milestoneStreak === 7 ? 'One week. This is becoming real.' :
                 milestoneStreak === 14 ? 'Two weeks straight. You\'re building something.' :
                 milestoneStreak === 21 ? '21 days. You\'ve crossed the threshold.' :
                 milestoneStreak === 30 ? 'A full month. This is who you are now.' :
                 `${milestoneStreak} consecutive days. Compounding.`}
              </div>
            </div>
          </div>
        )}
        {showUpgradeToast && (
          <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', background: 'var(--surface)', border: '1px solid rgba(168,255,62,0.4)', borderRadius: 40, padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 12, zIndex: 600, animation: 'toastIn 0.3s ease both', boxShadow: '0 8px 40px rgba(168,255,62,0.15)', whiteSpace: 'nowrap' }}>
            <span style={{ fontSize: 18 }}>✦</span>
            <div>
              <div style={{ fontSize: 13, color: 'var(--physical)', fontWeight: 700, fontFamily: 'var(--font-display)' }}>Welcome to Trinitect Pro</div>
              <div style={{ fontSize: 11, color: 'var(--text2)', fontFamily: 'var(--font-mono)', marginTop: 1 }}>All 3 domains + personalized patterns unlocked</div>
            </div>
          </div>
        )}
        {showSavedToast && (
          <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', background: 'var(--surface)', border: '1px solid rgba(168,255,62,0.3)', borderRadius: 40, padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 10, zIndex: 600, animation: 'toastIn 0.3s ease both', boxShadow: '0 8px 32px rgba(0,0,0,0.4)', whiteSpace: 'nowrap' }}>
            <span style={{ color: 'var(--physical)', fontSize: 15 }}>✓</span>
            <span style={{ fontSize: 13, color: 'var(--text1)', fontWeight: 500 }}>Progress saved</span>
          </div>
        )}

        {/* Header */}
        <div className="fade-up" style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <h1 className="page-greeting">
              {greeting()}{profile.name ? `, ${profile.name}.` : '.'}
            </h1>
            {streak === 0 && (
              <div style={{
                fontSize: 9, fontFamily: 'var(--font-mono)', textTransform: 'uppercase',
                letterSpacing: '0.1em', padding: '4px 10px', borderRadius: 20,
                background: 'rgba(168,255,62,0.08)', border: '1px solid rgba(168,255,62,0.2)',
                color: 'var(--physical)', flexShrink: 0, marginTop: 6, marginLeft: 12,
              }}>
                Day 1
              </div>
            )}
            {streak > 0 && (
              <div style={{
                fontSize: 9, fontFamily: 'var(--font-mono)', textTransform: 'uppercase',
                letterSpacing: '0.1em', padding: '4px 10px', borderRadius: 20,
                background: 'var(--surface2)', border: '1px solid var(--border)',
                color: 'var(--text3)', flexShrink: 0, marginTop: 6, marginLeft: 12,
              }}>
                {streak}d streak
              </div>
            )}
          </div>
          <p className="page-date">{formatDate()}</p>
        </div>

        {/* Progress bar */}
        <div className="fade-up fade-up-d1" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '18px 22px', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, color: allDone ? 'var(--physical)' : 'var(--text1)', lineHeight: 1 }}>
                {pct}%
              </div>
              <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text3)', marginTop: 2 }}>
                {completedCount} of {actions.length} · {totalMin} min total
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
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
          <div style={{ background: 'var(--surface3)', borderRadius: 3, height: 4, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 3,
              background: 'linear-gradient(90deg, var(--physical) 0%, var(--mental) 100%)',
              width: `${pct}%`, transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
            }} />
          </div>
        </div>

        {/* All-done banner */}
        {allDone && (
          <div className="fade-up" style={{ background: 'rgba(168,255,62,0.05)', border: '1px solid rgba(168,255,62,0.2)', borderRadius: 'var(--radius)', padding: '16px 20px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ fontSize: 26 }}>✦</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: 'var(--physical)', marginBottom: 2 }}>
                All three domains today.
              </div>
              <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.5 }}>
                Physical, mental, spiritual — the full cycle. That's not discipline, that's a pattern forming.
              </div>
            </div>
            <button
              onClick={() => router.push('/progress')}
              style={{
                background: 'none', border: '1px solid rgba(168,255,62,0.25)',
                borderRadius: 'var(--radius-sm)', padding: '7px 12px', cursor: 'pointer',
                fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--physical)',
                letterSpacing: '0.06em', whiteSpace: 'nowrap', flexShrink: 0,
              }}
            >
              View momentum →
            </button>
          </div>
        )}

        {/* Pattern cards */}
        <div className="fade-up fade-up-d2" style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--text4)', marginBottom: 12 }}>
            Today's practice
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {actions.map((action, i) => {
              const badge = explainPattern(action, goals);
              return (
                <div key={action.id} className={`fade-up fade-up-d${i + 1}`}>
                  <ActionCard action={action} onComplete={handleComplete} goalBadge={badge ?? undefined} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Intelligent next step (post-completion) */}
        {allDone && (
          <div className="fade-up fade-up-d3" style={{ marginBottom: 16 }}>
            <NextStep
              goals={goals}
              tasks={tasks}
              streak={streak}
              commitment={profile.commitmentDeclaration}
              drivers={profile.values || []}
              onDeclare={handleDeclare}
              router={router}
            />
          </div>
        )}

        {/* Momentum link — persistent, subtle */}
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <button
            onClick={() => router.push('/progress')}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text4)',
              letterSpacing: '0.06em', padding: '4px 0',
              transition: 'color var(--transition)',
            }}
            onMouseOver={e => (e.currentTarget.style.color = 'var(--text2)')}
            onMouseOut={e => (e.currentTarget.style.color = 'var(--text4)')}
          >
            View your momentum →
          </button>
        </div>

        {/* Can't do one of these? */}
        <div className="fade-up fade-up-d3" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '18px 22px', marginBottom: 20 }}>
          <button
            onClick={() => setShowReplace(r => !r)}
            style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 0, textAlign: 'left' }}
          >
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text1)', marginBottom: 2 }}>Can't do one of these?</div>
              <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text3)' }}>Find a pattern that fits how you're feeling right now</div>
            </div>
            <span style={{ color: 'var(--text3)', fontFamily: 'var(--font-mono)', fontSize: 10 }}>{showReplace ? '▲' : '▼'}</span>
          </button>

          {showReplace && (
            <div style={{ marginTop: 18, animation: 'fadeIn 0.2s ease both' }}>
              <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
                What's in the way?
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                {TRIGGERS.map(t => (
                  <button key={t} onClick={() => { setSelectedTrigger(t); setReplacements(getReplacementSuggestions(t)); }}
                    style={{ padding: '7px 14px', background: selectedTrigger === t ? 'rgba(168,255,62,0.1)' : 'var(--surface2)', border: `1px solid ${selectedTrigger === t ? 'rgba(168,255,62,0.4)' : 'var(--border)'}`, borderRadius: 20, cursor: 'pointer', fontSize: 11, fontFamily: 'var(--font-mono)', color: selectedTrigger === t ? 'var(--physical)' : 'var(--text2)', textTransform: 'capitalize', transition: 'all var(--transition)' }}>
                    {t}
                  </button>
                ))}
              </div>
              {replacements.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {replacements.map(r => (
                    <div key={r} style={{ padding: '10px 14px', background: 'var(--surface2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ color: 'var(--physical)', fontSize: 12, flexShrink: 0 }}>→</span>
                      <span style={{ fontSize: 12, color: 'var(--text1)' }}>{r}</span>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={() => router.push('/patterns')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--mental)', padding: 0 }}>
                  Browse all patterns →
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

      {showSaveModal && (
        <SaveProgressModal onSaved={handleSaved} onSkip={handleSkip} />
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes toastIn { from { opacity: 0; transform: translate(-50%, 10px); } to { opacity: 1; transform: translate(-50%, 0); } }
      `}</style>
    </AppLayout>
  );
}
