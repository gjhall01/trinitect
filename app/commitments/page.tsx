'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import { loadState, addGoal, toggleMilestone, archiveGoal, restoreGoal, addTask, completeTask, deleteTask, reopenTask } from '@/lib/store';
import { getGoalPatternSuggestions } from '@/lib/mock-ai';
import type { Goal, GoalCategory, GoalMilestone, Domain, Task, TaskDifficulty } from '@/lib/types';

const CATEGORY_CONFIG: Record<GoalCategory, { label: string; color: string; bg: string; icon: string }> = {
  career:        { label: 'Career',          color: 'var(--mental)',    bg: 'rgba(56,217,245,0.10)',  icon: '⬢' },
  physical:      { label: 'Physical',        color: 'var(--physical)',  bg: 'rgba(168,255,62,0.10)',  icon: '◉' },
  spiritual:     { label: 'Spiritual',       color: 'var(--spiritual)', bg: 'rgba(212,160,255,0.10)', icon: '✦' },
  relationships: { label: 'Relationships',   color: '#ff8c69',          bg: 'rgba(255,140,105,0.10)', icon: '⟡' },
  financial:     { label: 'Financial',       color: '#ffd166',          bg: 'rgba(255,209,102,0.10)', icon: '◇' },
  personal:      { label: 'Personal Growth', color: '#06d6a0',          bg: 'rgba(6,214,160,0.10)',   icon: '⟳' },
};

const CATEGORIES = Object.keys(CATEGORY_CONFIG) as GoalCategory[];

const DOMAIN_CONFIG: Record<Domain, { label: string; color: string }> = {
  physical:  { label: 'Physical',  color: 'var(--physical)'  },
  mental:    { label: 'Mental',    color: 'var(--mental)'    },
  spiritual: { label: 'Spiritual', color: 'var(--spiritual)' },
};

const DIFFICULTY_CONFIG: Record<TaskDifficulty, { label: string; color: string; bg: string }> = {
  smooth:  { label: 'Smooth',  color: 'var(--physical)', bg: 'rgba(168,255,62,0.10)'  },
  hard:    { label: 'Hard',    color: '#ffd166',         bg: 'rgba(255,209,102,0.10)' },
  avoided: { label: 'Avoided', color: '#ff8c69',         bg: 'rgba(255,140,105,0.10)' },
};

const DOMAIN_COLORS: Record<string, string> = {
  physical: 'var(--physical)', mental: 'var(--mental)', spiritual: 'var(--spiritual)',
};

function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}
function formatTargetDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ── Moves Section ─────────────────────────────────────────────────────────────

function MovesSection({ goal, tasks, onAdd, onComplete, onDelete, onReopen }: {
  goal: Goal;
  tasks: Task[];
  onAdd: (title: string) => void;
  onComplete: (id: string, difficulty: TaskDifficulty) => void;
  onDelete: (id: string) => void;
  onReopen: (id: string) => void;
}) {
  const cfg = CATEGORY_CONFIG[goal.category];
  const [input, setInput] = useState('');
  const [showInput, setShowInput] = useState(false);
  const [pendingComplete, setPendingComplete] = useState<string | null>(null);
  const [patternTaskId, setPatternTaskId] = useState<string | null>(null);
  const [patternContext, setPatternContext] = useState<'hard' | 'avoided'>('hard');

  const openMoves = tasks.filter(t => !t.completed);
  const recentDone = tasks.filter(t => t.completed).slice(-3);

  function handleAdd() {
    const title = input.trim();
    if (!title) return;
    onAdd(title);
    setInput('');
    setShowInput(false);
  }

  function handleDifficulty(taskId: string, difficulty: TaskDifficulty) {
    onComplete(taskId, difficulty);
    setPendingComplete(null);
    if (difficulty === 'hard' || difficulty === 'avoided') {
      setPatternTaskId(taskId);
      setPatternContext(difficulty);
    } else {
      setPatternTaskId(null);
    }
  }

  const suggestions = patternTaskId ? getGoalPatternSuggestions(goal.category, patternContext) : [];

  return (
    <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Moves · {openMoves.length} open
        </span>
        <button
          onClick={() => setShowInput(s => !s)}
          style={{ background: 'none', border: `1px solid ${cfg.color}44`, borderRadius: 12, padding: '2px 9px', cursor: 'pointer', fontSize: 9, fontFamily: 'var(--font-mono)', color: cfg.color, letterSpacing: '0.06em' }}
        >
          + add
        </button>
      </div>

      {showInput && (
        <div style={{ display: 'flex', gap: 7, marginBottom: 10 }}>
          <input
            autoFocus
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') { setShowInput(false); setInput(''); } }}
            placeholder="What's your next move?"
            style={{ flex: 1, background: 'var(--surface2)', border: '1.5px solid var(--border)', borderRadius: 8, padding: '8px 12px', color: 'var(--text1)', fontSize: 12, fontFamily: 'var(--font-body)', outline: 'none' }}
            onFocus={e => e.target.style.borderColor = `${cfg.color}66`}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />
          <button onClick={handleAdd} disabled={!input.trim()} style={{ background: cfg.color, border: 'none', borderRadius: 8, padding: '0 14px', cursor: 'pointer', color: 'var(--bg)', fontWeight: 700, fontSize: 16, opacity: input.trim() ? 1 : 0.4 }}>↵</button>
        </div>
      )}

      {openMoves.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: recentDone.length ? 10 : 0 }}>
          {openMoves.map(t => (
            <div key={t.id}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', background: pendingComplete === t.id ? 'var(--surface2)' : 'transparent', borderRadius: 8, transition: 'background 0.15s' }}>
                <button
                  onClick={() => setPendingComplete(pendingComplete === t.id ? null : t.id)}
                  style={{ width: 16, height: 16, borderRadius: 4, flexShrink: 0, border: `1.5px solid ${cfg.color}66`, background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                >
                  {pendingComplete === t.id && <div style={{ width: 8, height: 8, borderRadius: 2, background: cfg.color }} />}
                </button>
                <span style={{ flex: 1, fontSize: 12, color: 'var(--text2)', lineHeight: 1.4 }}>{t.title}</span>
                <button onClick={() => onDelete(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text4)', fontSize: 14, padding: '0 2px', lineHeight: 1 }}>×</button>
              </div>

              {pendingComplete === t.id && (
                <div style={{ marginTop: 6, marginBottom: 4, padding: '10px 8px', background: 'var(--surface2)', borderRadius: 8, animation: 'fadeIn 0.15s ease both' }}>
                  <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>How did this go?</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {(Object.keys(DIFFICULTY_CONFIG) as TaskDifficulty[]).map(d => {
                      const dc = DIFFICULTY_CONFIG[d];
                      return (
                        <button key={d} onClick={() => handleDifficulty(t.id, d)} style={{ flex: 1, padding: '7px 4px', background: dc.bg, border: `1px solid ${dc.color}55`, borderRadius: 8, cursor: 'pointer', fontSize: 10, fontFamily: 'var(--font-mono)', color: dc.color, fontWeight: 600, letterSpacing: '0.04em', transition: 'all 0.15s' }}>
                          {dc.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pattern recommendations after hard/avoided */}
      {suggestions.length > 0 && (
        <div style={{ marginBottom: 10, animation: 'fadeIn 0.25s ease both' }}>
          <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: cfg.color, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
            {patternContext === 'avoided' ? 'Patterns that break avoidance' : 'Patterns to move through resistance'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {suggestions.map(({ pattern, matchedThemes, explanation }) => (
              <div key={pattern.title} style={{ padding: '10px 12px', background: 'var(--surface2)', border: `1px solid ${DOMAIN_COLORS[pattern.domain]}22`, borderLeft: `2px solid ${DOMAIN_COLORS[pattern.domain]}`, borderRadius: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                  <span style={{ fontSize: 8, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', color: DOMAIN_COLORS[pattern.domain], background: `${DOMAIN_COLORS[pattern.domain]}15`, padding: '1px 6px', borderRadius: 10 }}>{pattern.domain}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text1)' }}>{pattern.title}</span>
                  <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text4)', marginLeft: 'auto' }}>{pattern.duration}m</span>
                </div>
                <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>{explanation} · {matchedThemes.slice(0, 2).join(', ')}</div>
              </div>
            ))}
          </div>
          <button onClick={() => setPatternTaskId(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text4)', padding: '6px 0 0', letterSpacing: '0.06em' }}>dismiss ×</button>
        </div>
      )}

      {/* Done moves */}
      {recentDone.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {recentDone.map(t => {
            const dc = t.difficulty ? DIFFICULTY_CONFIG[t.difficulty] : null;
            return (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px', opacity: 0.5 }}>
                <div style={{ width: 16, height: 16, borderRadius: 4, flexShrink: 0, background: cfg.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="var(--bg)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                </div>
                <span style={{ flex: 1, fontSize: 11, color: 'var(--text3)', textDecoration: 'line-through', lineHeight: 1.4 }}>{t.title}</span>
                {dc && <span style={{ fontSize: 8, fontFamily: 'var(--font-mono)', color: dc.color, background: dc.bg, padding: '1px 6px', borderRadius: 10 }}>{dc.label}</span>}
                <button onClick={() => onReopen(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text4)', padding: '0 2px' }}>↩</button>
              </div>
            );
          })}
        </div>
      )}

      {openMoves.length === 0 && recentDone.length === 0 && !showInput && (
        <div style={{ fontSize: 11, color: 'var(--text4)', fontStyle: 'italic', padding: '4px 0' }}>
          No moves yet. What's the first step?
        </div>
      )}
    </div>
  );
}

// ── Commitment Card ───────────────────────────────────────────────────────────

function CommitmentCard({ goal, tasks, onMilestone, onArchive, onAddTask, onCompleteTask, onDeleteTask, onReopenTask }: {
  goal: Goal; tasks: Task[];
  onMilestone: (goalId: string, milestoneId: string) => void;
  onArchive: (goalId: string) => void;
  onAddTask: (goalId: string, title: string) => void;
  onCompleteTask: (taskId: string, difficulty: TaskDifficulty) => void;
  onDeleteTask: (taskId: string) => void;
  onReopenTask: (taskId: string) => void;
}) {
  const cfg = CATEGORY_CONFIG[goal.category];
  const days = daysUntil(goal.targetDate);
  const completed = goal.milestones.filter(m => m.completed).length;
  const total = goal.milestones.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div style={{ background: 'var(--surface)', border: `1px solid ${cfg.color}22`, borderRadius: 'var(--radius)', padding: 22, display: 'flex', flexDirection: 'column', gap: 16, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: cfg.color, opacity: 0.7 }} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: cfg.bg, color: cfg.color, fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '3px 10px', borderRadius: 20 }}>
          <span>{cfg.icon}</span> {cfg.label}
        </span>
        <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: days < 14 ? '#ff8c69' : days < 30 ? '#ffd166' : 'var(--text3)' }}>
          {days < 0 ? `${Math.abs(days)}d overdue` : `${days}d left`}
        </span>
      </div>

      <div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--text1)', lineHeight: 1.3, marginBottom: 6 }}>{goal.title}</div>
        {goal.outcome && <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.6 }}>{goal.outcome}</div>}
      </div>

      {goal.linkedDomains.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {goal.linkedDomains.map(d => (
            <span key={d} style={{ fontSize: 9, fontFamily: 'var(--font-mono)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '2px 8px', borderRadius: 20, background: `${DOMAIN_CONFIG[d].color}15`, color: DOMAIN_CONFIG[d].color }}>{d}</span>
          ))}
        </div>
      )}

      {total > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Markers</span>
            <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: pct === 100 ? cfg.color : 'var(--text3)' }}>{completed}/{total}</span>
          </div>
          <div style={{ background: 'var(--surface3)', borderRadius: 3, height: 3, marginBottom: 10, overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 3, background: cfg.color, width: `${pct}%`, transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {goal.milestones.map(m => (
              <button key={m.id} onClick={() => onMilestone(goal.id, m.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', textAlign: 'left' }}>
                <div style={{ width: 16, height: 16, borderRadius: 4, flexShrink: 0, border: `1.5px solid ${m.completed ? cfg.color : 'var(--border-hover)'}`, background: m.completed ? cfg.color : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
                  {m.completed && <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="var(--bg)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
                </div>
                <span style={{ fontSize: 12, color: m.completed ? 'var(--text3)' : 'var(--text2)', textDecoration: m.completed ? 'line-through' : 'none', lineHeight: 1.4 }}>{m.text}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <MovesSection
        goal={goal} tasks={tasks}
        onAdd={title => onAddTask(goal.id, title)}
        onComplete={onCompleteTask}
        onDelete={onDeleteTask}
        onReopen={onReopenTask}
      />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 4 }}>
        <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text4)' }}>By {formatTargetDate(goal.targetDate)}</span>
        <button onClick={() => onArchive(goal.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text4)', padding: '2px 0' }}>archive</button>
      </div>
    </div>
  );
}

// ── Add Commitment Modal ──────────────────────────────────────────────────────

type ModalStep = 'category' | 'details' | 'markers';

function AddCommitmentModal({ onClose, onSave, initialTitle = '' }: {
  onClose: () => void;
  onSave: (goal: Omit<Goal, 'id' | 'createdAt'>) => void;
  initialTitle?: string;
}) {
  const [step, setStep] = useState<ModalStep>(initialTitle ? 'details' : 'category');
  const [category, setCategory] = useState<GoalCategory | null>(null);
  const [title, setTitle] = useState(initialTitle);
  const [outcome, setOutcome] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [linkedDomains, setLinkedDomains] = useState<Domain[]>([]);
  const [milestones, setMilestones] = useState<GoalMilestone[]>([]);
  const [milestoneInput, setMilestoneInput] = useState('');

  const minDate = new Date().toISOString().split('T')[0];
  const cfg = category ? CATEGORY_CONFIG[category] : null;

  function toggleDomain(d: Domain) {
    setLinkedDomains(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);
  }
  function addMarker() {
    const text = milestoneInput.trim();
    if (!text) return;
    setMilestones(prev => [...prev, { id: Math.random().toString(36).slice(2), text, completed: false }]);
    setMilestoneInput('');
  }
  function handleSave() {
    if (!category || !title.trim() || !targetDate) return;
    onSave({ category, title: title.trim(), outcome: outcome.trim(), targetDate, linkedDomains, milestones, archived: false });
  }

  const stepLabels: ModalStep[] = initialTitle
    ? ['details', 'category', 'markers']
    : ['category', 'details', 'markers'];



  const stepIdx = stepLabels.indexOf(step);

  const stepTitle: Record<ModalStep, string> = {
    category: 'What area of life?',
    details:  'Name your commitment',
    markers:  'Add markers',
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 400, background: 'rgba(7,8,15,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 560, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '20px 20px 0 0', padding: '28px 28px 40px', animation: 'slideUp 0.3s cubic-bezier(0.4,0,0.2,1) both', maxHeight: '92vh', overflowY: 'auto' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, color: 'var(--text1)', letterSpacing: '-0.03em' }}>
            {stepTitle[step]}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: 20, lineHeight: 1 }}>×</button>
        </div>

        <div style={{ display: 'flex', gap: 5, marginBottom: 28 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{ flex: 1, height: 2, borderRadius: 2, background: i <= stepIdx ? (cfg?.color || 'var(--physical)') : 'var(--surface3)', transition: 'background 0.3s' }} />
          ))}
        </div>

        {/* Details — shown first when coming from declaration */}
        {step === 'details' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {initialTitle && !category && (
              <div style={{ padding: '10px 14px', background: 'rgba(168,255,62,0.05)', border: '1px solid rgba(168,255,62,0.15)', borderRadius: 'var(--radius-sm)', fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>
                From your declaration — edit freely.
              </div>
            )}
            <div>
              <label style={{ display: 'block', fontSize: 10, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text3)', marginBottom: 8 }}>What are you committing to?</label>
              <input className="text-input" style={{ marginBottom: 0 }} placeholder="e.g. Run a marathon by November" value={title} onChange={e => setTitle(e.target.value)} autoFocus={!initialTitle} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 10, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text3)', marginBottom: 8 }}>When will you know you've done it?</label>
              <textarea style={{ width: '100%', background: 'var(--surface2)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius)', padding: '14px 18px', color: 'var(--text1)', fontSize: 13, fontFamily: 'var(--font-body)', outline: 'none', resize: 'none', lineHeight: 1.6, minHeight: 90, transition: 'border-color var(--transition)' }} onFocus={e => e.target.style.borderColor = 'rgba(168,255,62,0.4)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} placeholder="Describe what completing this looks like in your life" value={outcome} onChange={e => setOutcome(e.target.value)} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 10, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text3)', marginBottom: 8 }}>Target date</label>
              <input type="date" className="text-input" style={{ marginBottom: 0, colorScheme: 'dark' }} min={minDate} value={targetDate} onChange={e => setTargetDate(e.target.value)} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 10, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text3)', marginBottom: 10 }}>Which daily patterns will build toward this?</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {(['physical', 'mental', 'spiritual'] as Domain[]).map(d => {
                  const dc = DOMAIN_CONFIG[d];
                  const sel = linkedDomains.includes(d);
                  return <button key={d} onClick={() => toggleDomain(d)} style={{ flex: 1, padding: '10px 8px', background: sel ? `${dc.color}15` : 'var(--surface2)', border: `1.5px solid ${sel ? dc.color : 'var(--border)'}`, borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: 12, fontWeight: 500, color: sel ? dc.color : 'var(--text2)', transition: 'all var(--transition)', textTransform: 'capitalize' }}>{d}</button>;
                })}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              {!initialTitle && (
                <button onClick={() => setStep('category')} style={{ flex: 1, padding: 14, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text2)', cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14 }}>← Back</button>
              )}
              <button className="primary-btn" style={{ flex: 2 }} disabled={!title.trim() || !targetDate} onClick={() => setStep(initialTitle ? 'category' : 'markers')}>Continue →</button>
            </div>
          </div>
        )}

        {/* Category */}
        {step === 'category' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {CATEGORIES.map(cat => {
                const c = CATEGORY_CONFIG[cat];
                const selected = category === cat;
                return (
                  <button key={cat} onClick={() => setCategory(cat)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', background: selected ? c.bg : 'var(--surface2)', border: `1.5px solid ${selected ? c.color : 'var(--border)'}`, borderRadius: 'var(--radius-sm)', cursor: 'pointer', textAlign: 'left', transition: 'all var(--transition)' }}>
                    <span style={{ fontSize: 16, color: c.color }}>{c.icon}</span>
                    <span style={{ fontSize: 13, fontWeight: 500, color: selected ? c.color : 'var(--text2)' }}>{c.label}</span>
                  </button>
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              {initialTitle && (
                <button onClick={() => setStep('details')} style={{ flex: 1, padding: 14, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text2)', cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14 }}>← Back</button>
              )}
              <button className="primary-btn" style={{ flex: 2 }} disabled={!category} onClick={() => setStep(initialTitle ? 'markers' : 'details')}>Continue →</button>
            </div>
          </div>
        )}

        {/* Markers */}
        {step === 'markers' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>
              Markers are proof points. Each one shows the commitment is real and gives you something to cross off. Optional — add more anytime.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <input className="text-input" style={{ marginBottom: 0, flex: 1 }} placeholder="e.g. Run my first 10k" value={milestoneInput} onChange={e => setMilestoneInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addMarker(); } }} autoFocus />
              <button onClick={addMarker} disabled={!milestoneInput.trim()} style={{ padding: '0 18px', background: cfg?.color || 'var(--physical)', border: 'none', borderRadius: 'var(--radius)', color: 'var(--bg)', fontWeight: 700, cursor: 'pointer', fontSize: 18, lineHeight: 1, opacity: milestoneInput.trim() ? 1 : 0.4 }}>+</button>
            </div>
            {milestones.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {milestones.map((m, i) => (
                  <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--surface2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                    <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text4)', minWidth: 16 }}>{i + 1}</span>
                    <span style={{ flex: 1, fontSize: 13, color: 'var(--text1)' }}>{m.text}</span>
                    <button onClick={() => setMilestones(prev => prev.filter(x => x.id !== m.id))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text4)', fontSize: 16, lineHeight: 1, padding: '2px 4px' }}>×</button>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setStep('category')} style={{ flex: 1, padding: 14, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text2)', cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14 }}>← Back</button>
              <button className="primary-btn" style={{ flex: 2 }} disabled={!category || !title.trim() || !targetDate} onClick={handleSave}>
                {milestones.length > 0 ? `Lock in + ${milestones.length} marker${milestones.length > 1 ? 's' : ''}` : 'Lock in the commitment →'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CommitmentsPage() {
  const router = useRouter();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [archivedGoals, setArchivedGoals] = useState<Goal[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [mounted, setMounted] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalInitialTitle, setModalInitialTitle] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [declaration, setDeclaration] = useState('');

  const refresh = useCallback(() => {
    const s = loadState();
    setGoals((s.goals || []).filter(g => !g.archived));
    setArchivedGoals((s.goals || []).filter(g => g.archived));
    setTasks(s.tasks || []);
  }, []);

  useEffect(() => {
    const s = loadState();
    if (!s.profile.onboarded) { router.replace('/'); return; }
    setGoals((s.goals || []).filter(g => !g.archived));
    setArchivedGoals((s.goals || []).filter(g => g.archived));
    setTasks(s.tasks || []);
    setDeclaration(s.profile.commitmentDeclaration || '');
    setMounted(true);
  }, [router]);

  const handleSave = useCallback((goalData: Omit<Goal, 'id' | 'createdAt'>) => {
    addGoal(goalData); refresh(); setShowModal(false); setModalInitialTitle('');
  }, [refresh]);

  function openModal(initialTitle = '') {
    setModalInitialTitle(initialTitle);
    setShowModal(true);
  }

  if (!mounted) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div style={{ width: 32, height: 32, border: '2px solid rgba(168,255,62,0.2)', borderTopColor: '#a8ff3e', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <AppLayout activeHref="/commitments">
      <div style={{ maxWidth: 900 }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: declaration && goals.length > 0 ? 16 : 36 }} className="fade-up">
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text1)', lineHeight: 1.15 }}>
              Your Commitments
            </h1>
            <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 5, fontFamily: 'var(--font-mono)' }}>
              {goals.length === 0
                ? 'What are you moving toward?'
                : `${goals.length} active · patterns building toward all of them`}
            </p>
          </div>
          <button onClick={() => openModal()} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--physical)', color: 'var(--bg)', border: 'none', borderRadius: 'var(--radius)', padding: '10px 18px', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            + Make a Commitment
          </button>
        </div>

        {/* Declaration quote — shown when goals exist */}
        {declaration && goals.length > 0 && (
          <div className="fade-up fade-up-d1" style={{ background: 'rgba(168,255,62,0.04)', border: '1px solid rgba(168,255,62,0.12)', borderRadius: 'var(--radius)', padding: '14px 20px', marginBottom: 28, display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontSize: 16, color: 'var(--physical)', flexShrink: 0 }}>✦</span>
            <div>
              <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--physical)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Your declaration</div>
              <div style={{ fontSize: 13, color: 'var(--text1)', fontFamily: 'var(--font-display)', fontWeight: 600, lineHeight: 1.4 }}>"{declaration}"</div>
            </div>
          </div>
        )}

        {/* Empty state */}
        {goals.length === 0 && (
          <div className="fade-up fade-up-d1" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '48px 40px', textAlign: 'center' }}>

            {/* Declaration-aware empty state */}
            {declaration ? (
              <>
                <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--physical)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Your declaration</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'var(--text1)', marginBottom: 10, letterSpacing: '-0.02em', lineHeight: 1.3 }}>
                  "{declaration}"
                </div>
                <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.7, maxWidth: 400, margin: '0 auto 28px' }}>
                  You made the declaration. Now formalize it — give it a target date, markers to cross off, and a direction for your patterns.
                </p>
                <button onClick={() => openModal(declaration)} className="primary-btn" style={{ maxWidth: 280, margin: '0 auto 16px' }}>
                  Formalize this commitment →
                </button>
                <div>
                  <button onClick={() => openModal()} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text4)', letterSpacing: '0.06em' }}>
                    or start a different commitment
                  </button>
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 48, marginBottom: 20, opacity: 0.5 }}>⟁</div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--text1)', marginBottom: 10, letterSpacing: '-0.02em' }}>
                  Don't hold back on this one.
                </h2>
                <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.7, maxWidth: 420, margin: '0 auto 32px' }}>
                  Your patterns are already compounding. A commitment gives that momentum a direction — and proves to yourself that you mean it.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, maxWidth: 480, margin: '0 auto 32px' }}>
                  {[
                    { example: '"Prove I can do hard things"', cat: 'personal' },
                    { example: '"Run my first marathon"',      cat: 'physical' },
                    { example: '"Ask for the promotion"',      cat: 'career'   },
                  ].map(({ example, cat }) => {
                    const c = CATEGORY_CONFIG[cat as GoalCategory];
                    return (
                      <div key={cat} style={{ background: 'var(--surface2)', borderRadius: 10, padding: '14px 12px', textAlign: 'left', border: `1px solid ${c.color}22` }}>
                        <div style={{ fontSize: 16, color: c.color, marginBottom: 8 }}>{c.icon}</div>
                        <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: c.color, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{c.label}</div>
                        <div style={{ fontSize: 11, color: 'var(--text2)', lineHeight: 1.5, fontStyle: 'italic' }}>{example}</div>
                      </div>
                    );
                  })}
                </div>
                <button onClick={() => openModal()} className="primary-btn" style={{ maxWidth: 260, margin: '0 auto' }}>
                  Make your first commitment →
                </button>
              </>
            )}
          </div>
        )}

        {/* Commitment cards */}
        {goals.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {goals.map((goal, i) => (
              <div key={goal.id} className={`fade-up fade-up-d${Math.min(i + 1, 5)}`}>
                <CommitmentCard
                  goal={goal}
                  tasks={tasks.filter(t => t.goalId === goal.id)}
                  onMilestone={(gId, mId) => { toggleMilestone(gId, mId); refresh(); }}
                  onArchive={(gId) => { archiveGoal(gId); refresh(); }}
                  onAddTask={(gId, title) => { addTask(gId, title); refresh(); }}
                  onCompleteTask={(tId, diff) => { completeTask(tId, diff); refresh(); }}
                  onDeleteTask={(tId) => { deleteTask(tId); refresh(); }}
                  onReopenTask={(tId) => { reopenTask(tId); refresh(); }}
                />
              </div>
            ))}
          </div>
        )}

        {goals.length > 0 && (
          <div className="fade-up" style={{ marginTop: 28, padding: '16px 20px', background: 'var(--accent-dim)', border: '1px solid rgba(168,255,62,0.12)', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontSize: 18, color: 'var(--physical)' }}>⟳</span>
            <p style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.6 }}>
              Every pattern you complete today is compounding toward all of these commitments simultaneously. The patterns build the person. The person achieves the commitment.
            </p>
          </div>
        )}

        {/* Archived section */}
        {archivedGoals.length > 0 && (
          <div style={{ marginTop: 32 }}>
            <button
              onClick={() => setShowArchived(s => !s)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text4)', letterSpacing: '0.06em', padding: '4px 0', marginBottom: showArchived ? 16 : 0 }}
            >
              <span style={{ fontSize: 9 }}>{showArchived ? '▼' : '▶'}</span>
              {archivedGoals.length} archived commitment{archivedGoals.length > 1 ? 's' : ''}
            </button>
            {showArchived && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {archivedGoals.map(goal => {
                  const cfg = CATEGORY_CONFIG[goal.category];
                  return (
                    <div key={goal.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', opacity: 0.6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ color: cfg.color, fontSize: 12 }}>{cfg.icon}</span>
                        <span style={{ fontSize: 13, color: 'var(--text2)', fontFamily: 'var(--font-display)', fontWeight: 500 }}>{goal.title}</span>
                      </div>
                      <button
                        onClick={() => { restoreGoal(goal.id); refresh(); }}
                        style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '3px 10px', cursor: 'pointer', fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text3)', letterSpacing: '0.06em' }}
                      >
                        restore
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>

      {showModal && (
        <AddCommitmentModal
          onClose={() => { setShowModal(false); setModalInitialTitle(''); }}
          onSave={handleSave}
          initialTitle={modalInitialTitle}
        />
      )}

      <style>{`
        @keyframes slideUp { from { transform: translateY(60px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </AppLayout>
  );
}
