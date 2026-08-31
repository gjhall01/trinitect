'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import { loadState, addGoal, toggleMilestone, archiveGoal, addTask, completeTask, deleteTask, reopenTask } from '@/lib/store';
import { getGoalPatternSuggestions } from '@/lib/mock-ai';
import type { Goal, GoalCategory, GoalMilestone, Domain, Task, TaskDifficulty } from '@/lib/types';

const CATEGORY_CONFIG: Record<GoalCategory, { label: string; color: string; bg: string; icon: string }> = {
  career:        { label: 'Career',           color: 'var(--mental)',    bg: 'rgba(56,217,245,0.10)',   icon: '⬢' },
  physical:      { label: 'Physical',         color: 'var(--physical)',  bg: 'rgba(168,255,62,0.10)',   icon: '◉' },
  spiritual:     { label: 'Spiritual',        color: 'var(--spiritual)', bg: 'rgba(212,160,255,0.10)',  icon: '✦' },
  relationships: { label: 'Relationships',    color: '#ff8c69',          bg: 'rgba(255,140,105,0.10)',  icon: '⟡' },
  financial:     { label: 'Financial',        color: '#ffd166',          bg: 'rgba(255,209,102,0.10)',  icon: '◇' },
  personal:      { label: 'Personal Growth',  color: '#06d6a0',          bg: 'rgba(6,214,160,0.10)',    icon: '⟳' },
};

const CATEGORIES = Object.keys(CATEGORY_CONFIG) as GoalCategory[];

const DOMAIN_CONFIG: Record<Domain, { label: string; color: string }> = {
  physical:  { label: 'Physical',  color: 'var(--physical)'  },
  mental:    { label: 'Mental',    color: 'var(--mental)'    },
  spiritual: { label: 'Spiritual', color: 'var(--spiritual)' },
};

function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

function formatTargetDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const DIFFICULTY_CONFIG: Record<TaskDifficulty, { label: string; color: string; bg: string }> = {
  smooth:  { label: 'Smooth',  color: 'var(--physical)',  bg: 'rgba(168,255,62,0.10)'  },
  hard:    { label: 'Hard',    color: '#ffd166',          bg: 'rgba(255,209,102,0.10)' },
  avoided: { label: 'Avoided', color: '#ff8c69',          bg: 'rgba(255,140,105,0.10)' },
};

function TasksSection({ goal, tasks, onAdd, onComplete, onDelete, onReopen }: {
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

  const openTasks = tasks.filter(t => !t.completed);
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

  const DOMAIN_COLORS: Record<string, string> = {
    physical: 'var(--physical)', mental: 'var(--mental)', spiritual: 'var(--spiritual)',
  };

  return (
    <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Tasks · {openTasks.length} open
        </span>
        <button
          onClick={() => setShowInput(s => !s)}
          style={{
            background: 'none', border: `1px solid ${cfg.color}44`, borderRadius: 12,
            padding: '2px 9px', cursor: 'pointer',
            fontSize: 9, fontFamily: 'var(--font-mono)', color: cfg.color,
            letterSpacing: '0.06em',
          }}
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
            placeholder="What's the next action?"
            style={{
              flex: 1, background: 'var(--surface2)', border: '1.5px solid var(--border)',
              borderRadius: 8, padding: '8px 12px', color: 'var(--text1)', fontSize: 12,
              fontFamily: 'var(--font-body)', outline: 'none',
            }}
            onFocus={e => e.target.style.borderColor = `${cfg.color}66`}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />
          <button
            onClick={handleAdd}
            disabled={!input.trim()}
            style={{
              background: cfg.color, border: 'none', borderRadius: 8,
              padding: '0 14px', cursor: 'pointer',
              color: 'var(--bg)', fontWeight: 700, fontSize: 16,
              opacity: input.trim() ? 1 : 0.4,
            }}
          >
            ↵
          </button>
        </div>
      )}

      {/* Open tasks */}
      {openTasks.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: recentDone.length ? 10 : 0 }}>
          {openTasks.map(t => (
            <div key={t.id}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '6px 8px',
                background: pendingComplete === t.id ? 'var(--surface2)' : 'transparent',
                borderRadius: 8, transition: 'background 0.15s',
              }}>
                <button
                  onClick={() => setPendingComplete(pendingComplete === t.id ? null : t.id)}
                  style={{
                    width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                    border: `1.5px solid ${cfg.color}66`, background: 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  {pendingComplete === t.id && (
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: cfg.color }} />
                  )}
                </button>
                <span style={{ flex: 1, fontSize: 12, color: 'var(--text2)', lineHeight: 1.4 }}>{t.title}</span>
                <button
                  onClick={() => onDelete(t.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text4)', fontSize: 14, padding: '0 2px', lineHeight: 1 }}
                >
                  ×
                </button>
              </div>

              {/* Difficulty picker */}
              {pendingComplete === t.id && (
                <div style={{ marginTop: 6, marginBottom: 4, padding: '10px 8px', background: 'var(--surface2)', borderRadius: 8, animation: 'fadeIn 0.15s ease both' }}>
                  <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
                    How did this go?
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {(Object.keys(DIFFICULTY_CONFIG) as TaskDifficulty[]).map(d => {
                      const dc = DIFFICULTY_CONFIG[d];
                      return (
                        <button
                          key={d}
                          onClick={() => handleDifficulty(t.id, d)}
                          style={{
                            flex: 1, padding: '7px 4px',
                            background: dc.bg, border: `1px solid ${dc.color}55`,
                            borderRadius: 8, cursor: 'pointer',
                            fontSize: 10, fontFamily: 'var(--font-mono)', color: dc.color,
                            fontWeight: 600, letterSpacing: '0.04em',
                            transition: 'all 0.15s',
                          }}
                        >
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

      {/* Pattern recommendations (shown after hard/avoided completion) */}
      {suggestions.length > 0 && (
        <div style={{ marginBottom: 10, animation: 'fadeIn 0.25s ease both' }}>
          <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: cfg.color, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
            {patternContext === 'avoided' ? 'Patterns that break avoidance' : 'Patterns to move through resistance'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {suggestions.map(({ pattern, matchedThemes, explanation }) => (
              <div key={pattern.title} style={{
                padding: '10px 12px',
                background: 'var(--surface2)',
                border: `1px solid ${DOMAIN_COLORS[pattern.domain]}22`,
                borderLeft: `2px solid ${DOMAIN_COLORS[pattern.domain]}`,
                borderRadius: 8,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                  <span style={{
                    fontSize: 8, fontFamily: 'var(--font-mono)', textTransform: 'uppercase',
                    letterSpacing: '0.08em', color: DOMAIN_COLORS[pattern.domain],
                    background: `${DOMAIN_COLORS[pattern.domain]}15`,
                    padding: '1px 6px', borderRadius: 10,
                  }}>
                    {pattern.domain}
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text1)' }}>{pattern.title}</span>
                  <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text4)', marginLeft: 'auto' }}>{pattern.duration}m</span>
                </div>
                <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>
                  {explanation} · {matchedThemes.slice(0, 2).join(', ')}
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => setPatternTaskId(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text4)', padding: '6px 0 0', letterSpacing: '0.06em' }}
          >
            dismiss ×
          </button>
        </div>
      )}

      {/* Recently completed tasks */}
      {recentDone.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {recentDone.map(t => {
            const dc = t.difficulty ? DIFFICULTY_CONFIG[t.difficulty] : null;
            return (
              <div key={t.id} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '5px 8px', opacity: 0.5,
              }}>
                <div style={{
                  width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                  background: cfg.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="var(--bg)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <span style={{ flex: 1, fontSize: 11, color: 'var(--text3)', textDecoration: 'line-through', lineHeight: 1.4 }}>{t.title}</span>
                {dc && (
                  <span style={{ fontSize: 8, fontFamily: 'var(--font-mono)', color: dc.color, background: dc.bg, padding: '1px 6px', borderRadius: 10 }}>
                    {dc.label}
                  </span>
                )}
                <button
                  onClick={() => onReopen(t.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text4)', padding: '0 2px' }}
                >
                  ↩
                </button>
              </div>
            );
          })}
        </div>
      )}

      {openTasks.length === 0 && recentDone.length === 0 && !showInput && (
        <div style={{ fontSize: 11, color: 'var(--text4)', fontStyle: 'italic', padding: '4px 0' }}>
          No tasks yet. What's the first step?
        </div>
      )}
    </div>
  );
}

function GoalCard({ goal, tasks, onMilestone, onArchive, onAddTask, onCompleteTask, onDeleteTask, onReopenTask }: {
  goal: Goal;
  tasks: Task[];
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
    <div style={{
      background: 'var(--surface)',
      border: `1px solid ${cfg.color}22`,
      borderRadius: 'var(--radius)',
      padding: 22,
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Top accent bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: cfg.color, opacity: 0.7,
      }} />

      {/* Category + days */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: cfg.bg, color: cfg.color,
          fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 600,
          letterSpacing: '0.08em', textTransform: 'uppercase',
          padding: '3px 10px', borderRadius: 20,
        }}>
          <span>{cfg.icon}</span> {cfg.label}
        </span>
        <span style={{
          fontSize: 10, fontFamily: 'var(--font-mono)',
          color: days < 14 ? '#ff8c69' : days < 30 ? '#ffd166' : 'var(--text3)',
        }}>
          {days < 0 ? `${Math.abs(days)}d overdue` : `${days}d left`}
        </span>
      </div>

      {/* Title + outcome */}
      <div>
        <div style={{
          fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700,
          color: 'var(--text1)', lineHeight: 1.3, marginBottom: 6,
        }}>
          {goal.title}
        </div>
        {goal.outcome && (
          <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.6 }}>
            {goal.outcome}
          </div>
        )}
      </div>

      {/* Linked domains */}
      {goal.linkedDomains.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {goal.linkedDomains.map(d => (
            <span key={d} style={{
              fontSize: 9, fontFamily: 'var(--font-mono)', fontWeight: 600,
              letterSpacing: '0.08em', textTransform: 'uppercase',
              padding: '2px 8px', borderRadius: 20,
              background: `${DOMAIN_CONFIG[d].color}15`,
              color: DOMAIN_CONFIG[d].color,
            }}>
              {d}
            </span>
          ))}
        </div>
      )}

      {/* Milestones */}
      {total > 0 && (
        <div>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 8,
          }}>
            <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Milestones
            </span>
            <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: pct === 100 ? cfg.color : 'var(--text3)' }}>
              {completed}/{total}
            </span>
          </div>
          <div style={{ background: 'var(--surface3)', borderRadius: 3, height: 3, marginBottom: 10, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 3,
              background: cfg.color,
              width: `${pct}%`,
              transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)',
            }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {goal.milestones.map(m => (
              <button
                key={m.id}
                onClick={() => onMilestone(goal.id, m.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: '4px 0', textAlign: 'left',
                }}
              >
                <div style={{
                  width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                  border: `1.5px solid ${m.completed ? cfg.color : 'var(--border-hover)'}`,
                  background: m.completed ? cfg.color : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s',
                }}>
                  {m.completed && (
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="var(--bg)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
                <span style={{
                  fontSize: 12, color: m.completed ? 'var(--text3)' : 'var(--text2)',
                  textDecoration: m.completed ? 'line-through' : 'none',
                  lineHeight: 1.4,
                }}>
                  {m.text}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tasks section */}
      <TasksSection
        goal={goal}
        tasks={tasks}
        onAdd={title => onAddTask(goal.id, title)}
        onComplete={onCompleteTask}
        onDelete={onDeleteTask}
        onReopen={onReopenTask}
      />

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 4 }}>
        <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text4)' }}>
          By {formatTargetDate(goal.targetDate)}
        </span>
        <button
          onClick={() => onArchive(goal.id)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text4)',
            padding: '2px 0',
          }}
        >
          archive
        </button>
      </div>
    </div>
  );
}

type ModalStep = 'category' | 'details' | 'milestones';

function AddGoalModal({ onClose, onSave }: {
  onClose: () => void;
  onSave: (goal: Omit<Goal, 'id' | 'createdAt'>) => void;
}) {
  const [step, setStep] = useState<ModalStep>('category');
  const [category, setCategory] = useState<GoalCategory | null>(null);
  const [title, setTitle] = useState('');
  const [outcome, setOutcome] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [linkedDomains, setLinkedDomains] = useState<Domain[]>([]);
  const [milestones, setMilestones] = useState<GoalMilestone[]>([]);
  const [milestoneInput, setMilestoneInput] = useState('');

  const minDate = new Date().toISOString().split('T')[0];

  function toggleDomain(d: Domain) {
    setLinkedDomains(prev =>
      prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]
    );
  }

  function addMilestone() {
    const text = milestoneInput.trim();
    if (!text) return;
    setMilestones(prev => [...prev, { id: Math.random().toString(36).slice(2), text, completed: false }]);
    setMilestoneInput('');
  }

  function removeMilestone(id: string) {
    setMilestones(prev => prev.filter(m => m.id !== id));
  }

  function handleSave() {
    if (!category || !title.trim() || !targetDate) return;
    onSave({ category, title: title.trim(), outcome: outcome.trim(), targetDate, linkedDomains, milestones, archived: false });
  }

  const cfg = category ? CATEGORY_CONFIG[category] : null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 400,
      background: 'rgba(7,8,15,0.85)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    }} onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 560,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '20px 20px 0 0',
          padding: '28px 28px 40px',
          animation: 'slideUp 0.3s cubic-bezier(0.4,0,0.2,1) both',
          maxHeight: '92vh',
          overflowY: 'auto',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, color: 'var(--text1)', letterSpacing: '-0.03em' }}>
            {step === 'category' ? 'What area of life?' : step === 'details' ? 'Define the goal' : 'Add milestones'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: 20, lineHeight: 1 }}>×</button>
        </div>

        {/* Step indicator */}
        <div style={{ display: 'flex', gap: 5, marginBottom: 28 }}>
          {(['category', 'details', 'milestones'] as ModalStep[]).map((s, i) => {
            const si = ({ category: 0, details: 1, milestones: 2 } as const)[step];
            return (
              <div key={s} style={{
                flex: 1, height: 2, borderRadius: 2,
                background: i <= si ? (cfg?.color || 'var(--physical)') : 'var(--surface3)',
                transition: 'background 0.3s',
              }} />
            );
          })}
        </div>

        {/* Step: Category */}
        {step === 'category' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {CATEGORIES.map(cat => {
                const c = CATEGORY_CONFIG[cat];
                const selected = category === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '14px 16px',
                      background: selected ? c.bg : 'var(--surface2)',
                      border: `1.5px solid ${selected ? c.color : 'var(--border)'}`,
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer', textAlign: 'left',
                      transition: 'all var(--transition)',
                    }}
                  >
                    <span style={{ fontSize: 16, color: c.color }}>{c.icon}</span>
                    <span style={{ fontSize: 13, fontWeight: 500, color: selected ? c.color : 'var(--text2)' }}>
                      {c.label}
                    </span>
                  </button>
                );
              })}
            </div>
            <button
              className="primary-btn"
              disabled={!category}
              onClick={() => setStep('details')}
            >
              Continue →
            </button>
          </div>
        )}

        {/* Step: Details */}
        {step === 'details' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <label style={{ display: 'block', fontSize: 10, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text3)', marginBottom: 8 }}>
                What's the goal?
              </label>
              <input
                className="text-input"
                style={{ marginBottom: 0 }}
                placeholder="e.g. Ready to ask for a promotion by October"
                value={title}
                onChange={e => setTitle(e.target.value)}
                autoFocus
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 10, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text3)', marginBottom: 8 }}>
                What does success look like?
              </label>
              <textarea
                style={{
                  width: '100%', background: 'var(--surface2)',
                  border: '1.5px solid var(--border)', borderRadius: 'var(--radius)',
                  padding: '14px 18px', color: 'var(--text1)', fontSize: 13,
                  fontFamily: 'var(--font-body)', outline: 'none', resize: 'none',
                  lineHeight: 1.6, minHeight: 90,
                  transition: 'border-color var(--transition)',
                }}
                onFocus={e => e.target.style.borderColor = 'rgba(168,255,62,0.4)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
                placeholder="Describe the specific outcome — what will be different in your life?"
                value={outcome}
                onChange={e => setOutcome(e.target.value)}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 10, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text3)', marginBottom: 8 }}>
                Target date
              </label>
              <input
                type="date"
                className="text-input"
                style={{ marginBottom: 0, colorScheme: 'dark' }}
                min={minDate}
                value={targetDate}
                onChange={e => setTargetDate(e.target.value)}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 10, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text3)', marginBottom: 10 }}>
                Which daily patterns will build toward this?
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                {(['physical', 'mental', 'spiritual'] as Domain[]).map(d => {
                  const dc = DOMAIN_CONFIG[d];
                  const sel = linkedDomains.includes(d);
                  return (
                    <button
                      key={d}
                      onClick={() => toggleDomain(d)}
                      style={{
                        flex: 1, padding: '10px 8px',
                        background: sel ? `${dc.color}15` : 'var(--surface2)',
                        border: `1.5px solid ${sel ? dc.color : 'var(--border)'}`,
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                        fontSize: 12, fontWeight: 500,
                        color: sel ? dc.color : 'var(--text2)',
                        transition: 'all var(--transition)',
                        textTransform: 'capitalize',
                      }}
                    >
                      {d}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setStep('category')}
                style={{ flex: 1, padding: 14, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text2)', cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14 }}
              >
                ← Back
              </button>
              <button
                className="primary-btn"
                style={{ flex: 2 }}
                disabled={!title.trim() || !targetDate}
                onClick={() => setStep('milestones')}
              >
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* Step: Milestones */}
        {step === 'milestones' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>
              Break this goal into smaller wins. Each milestone makes progress visible and the goal feel real. Optional — you can add more later.
            </p>

            <div style={{ display: 'flex', gap: 8 }}>
              <input
                className="text-input"
                style={{ marginBottom: 0, flex: 1 }}
                placeholder="e.g. Complete performance self-review"
                value={milestoneInput}
                onChange={e => setMilestoneInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addMilestone(); } }}
              />
              <button
                onClick={addMilestone}
                disabled={!milestoneInput.trim()}
                style={{
                  padding: '0 18px', background: cfg?.color || 'var(--physical)',
                  border: 'none', borderRadius: 'var(--radius)',
                  color: 'var(--bg)', fontWeight: 700, cursor: 'pointer',
                  fontSize: 18, lineHeight: 1, opacity: milestoneInput.trim() ? 1 : 0.4,
                }}
              >
                +
              </button>
            </div>

            {milestones.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {milestones.map((m, i) => (
                  <div key={m.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 14px',
                    background: 'var(--surface2)', borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)',
                  }}>
                    <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text4)', minWidth: 16 }}>{i + 1}</span>
                    <span style={{ flex: 1, fontSize: 13, color: 'var(--text1)' }}>{m.text}</span>
                    <button
                      onClick={() => removeMilestone(m.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text4)', fontSize: 16, lineHeight: 1, padding: '2px 4px' }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setStep('details')}
                style={{ flex: 1, padding: 14, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text2)', cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14 }}
              >
                ← Back
              </button>
              <button
                className="primary-btn"
                style={{ flex: 2 }}
                onClick={handleSave}
              >
                {milestones.length > 0 ? `Save goal + ${milestones.length} milestone${milestones.length > 1 ? 's' : ''}` : 'Save goal →'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function GoalsPage() {
  const router = useRouter();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [mounted, setMounted] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const refreshState = useCallback(() => {
    const s = loadState();
    setGoals((s.goals || []).filter(g => !g.archived));
    setTasks(s.tasks || []);
  }, []);

  useEffect(() => {
    const s = loadState();
    if (!s.profile.onboarded) { router.replace('/'); return; }
    setGoals((s.goals || []).filter(g => !g.archived));
    setTasks(s.tasks || []);
    setMounted(true);
  }, [router]);

  const handleSave = useCallback((goalData: Omit<Goal, 'id' | 'createdAt'>) => {
    addGoal(goalData);
    refreshState();
    setShowModal(false);
  }, [refreshState]);

  const handleMilestone = useCallback((goalId: string, milestoneId: string) => {
    toggleMilestone(goalId, milestoneId);
    refreshState();
  }, [refreshState]);

  const handleArchive = useCallback((goalId: string) => {
    archiveGoal(goalId);
    refreshState();
  }, [refreshState]);

  const handleAddTask = useCallback((goalId: string, title: string) => {
    addTask(goalId, title);
    refreshState();
  }, [refreshState]);

  const handleCompleteTask = useCallback((taskId: string, difficulty: TaskDifficulty) => {
    completeTask(taskId, difficulty);
    refreshState();
  }, [refreshState]);

  const handleDeleteTask = useCallback((taskId: string) => {
    deleteTask(taskId);
    refreshState();
  }, [refreshState]);

  const handleReopenTask = useCallback((taskId: string) => {
    reopenTask(taskId);
    refreshState();
  }, [refreshState]);

  if (!mounted) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div style={{ width: 32, height: 32, border: '2px solid rgba(168,255,62,0.2)', borderTopColor: '#a8ff3e', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <AppLayout activeHref="/goals">
      <div style={{ maxWidth: 900 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 36 }} className="fade-up">
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text1)', lineHeight: 1.15 }}>
              Your Goals
            </h1>
            <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 5, fontFamily: 'var(--font-mono)' }}>
              {goals.length === 0
                ? 'What do you want your life to look like 90 days from now?'
                : `${goals.length} active goal${goals.length > 1 ? 's' : ''} · patterns compounding daily`}
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'var(--physical)', color: 'var(--bg)',
              border: 'none', borderRadius: 'var(--radius)',
              padding: '10px 18px',
              fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14,
              cursor: 'pointer', whiteSpace: 'nowrap',
              transition: 'opacity var(--transition)',
            }}
          >
            + Add Goal
          </button>
        </div>

        {/* Empty state */}
        {goals.length === 0 && (
          <div className="fade-up fade-up-d1" style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: '60px 40px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 48, marginBottom: 20, opacity: 0.5 }}>◎</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--text1)', marginBottom: 10, letterSpacing: '-0.02em' }}>
              Don't hold back on this one.
            </h2>
            <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.7, maxWidth: 420, margin: '0 auto 32px' }}>
              Your patterns are already compounding. Goals give that momentum a direction. Set something ambitious — the patterns will build toward it automatically.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, maxWidth: 480, margin: '0 auto 32px' }}>
              {[
                { example: '"Be ready to ask for a promotion by October"', cat: 'career' },
                { example: '"Lose 30lbs by my birthday in November"', cat: 'physical' },
                { example: '"Deepen my daily spiritual practice"', cat: 'spiritual' },
              ].map(({ example, cat }) => {
                const cfg = CATEGORY_CONFIG[cat as GoalCategory];
                return (
                  <div key={cat} style={{
                    background: 'var(--surface2)', borderRadius: 10,
                    padding: '14px 12px', textAlign: 'left',
                    border: `1px solid ${cfg.color}22`,
                  }}>
                    <div style={{ fontSize: 16, color: cfg.color, marginBottom: 8 }}>{cfg.icon}</div>
                    <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: cfg.color, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{cfg.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--text2)', lineHeight: 1.5, fontStyle: 'italic' }}>{example}</div>
                  </div>
                );
              })}
            </div>
            <button onClick={() => setShowModal(true)} className="primary-btn" style={{ maxWidth: 240, margin: '0 auto' }}>
              Set your first goal →
            </button>
          </div>
        )}

        {/* Goal cards */}
        {goals.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {goals.map((goal, i) => (
              <div key={goal.id} className={`fade-up fade-up-d${Math.min(i + 1, 5)}`}>
                <GoalCard
                  goal={goal}
                  tasks={tasks.filter(t => t.goalId === goal.id)}
                  onMilestone={handleMilestone}
                  onArchive={handleArchive}
                  onAddTask={handleAddTask}
                  onCompleteTask={handleCompleteTask}
                  onDeleteTask={handleDeleteTask}
                  onReopenTask={handleReopenTask}
                />
              </div>
            ))}
          </div>
        )}

        {/* Compounding note */}
        {goals.length > 0 && (
          <div className="fade-up" style={{
            marginTop: 28,
            padding: '16px 20px',
            background: 'var(--accent-dim)',
            border: '1px solid rgba(168,255,62,0.12)',
            borderRadius: 'var(--radius)',
            display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <span style={{ fontSize: 18, color: 'var(--physical)' }}>⟳</span>
            <p style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.6 }}>
              Every pattern you complete today is compounding toward all of these goals simultaneously. The patterns don't know which goal they're serving — they just build the person who achieves them.
            </p>
          </div>
        )}
      </div>

      {showModal && (
        <AddGoalModal
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(60px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </AppLayout>
  );
}
