'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import { loadState } from '@/lib/store';
import type { AppState, DayRecord, Domain, DomainScores, Goal, PatternJournalEntry } from '@/lib/types';

const DOMAIN_CONFIG: Record<Domain, { label: string; color: string; hex: string; default: number }> = {
  physical:  { label: 'Physical',  color: 'var(--physical)',  hex: '#a8ff3e', default: 40 },
  mental:    { label: 'Mental',    color: 'var(--mental)',    hex: '#38d9f5', default: 35 },
  spiritual: { label: 'Spiritual', color: 'var(--spiritual)', hex: '#d4a0ff', default: 25 },
};

const CATEGORY_CONFIG: Record<string, { color: string; icon: string }> = {
  career:        { color: 'var(--mental)',    icon: '⬢' },
  physical:      { color: 'var(--physical)',  icon: '◉' },
  spiritual:     { color: 'var(--spiritual)', icon: '✦' },
  relationships: { color: '#ff8c69',          icon: '⟡' },
  financial:     { color: '#ffd166',          icon: '◇' },
  personal:      { color: '#06d6a0',          icon: '⟳' },
};

const DOMAINS: Domain[] = ['physical', 'mental', 'spiritual'];

function getDayColor(domains: Domain[]): string {
  if (domains.length === 0) return 'transparent';
  if (domains.length === 3) return '#a8ff3e';
  if (domains.includes('physical') && domains.includes('mental')) return '#6affcc';
  if (domains.includes('physical') && domains.includes('spiritual')) return '#c8ff70';
  if (domains.includes('mental') && domains.includes('spiritual')) return '#84a8ff';
  if (domains.includes('physical')) return '#a8ff3e';
  if (domains.includes('mental')) return '#38d9f5';
  return '#d4a0ff';
}

function getDayOpacity(domains: Domain[]): number {
  if (domains.length === 0) return 0;
  if (domains.length === 3) return 1;
  if (domains.length === 2) return 0.75;
  return 0.55;
}

function buildHistoryMap(history: DayRecord[]): Map<string, Domain[]> {
  const map = new Map<string, Domain[]>();
  for (const r of history) map.set(r.date, r.domains);
  return map;
}

function getLast35Days(): string[] {
  const days: string[] = [];
  for (let i = 34; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split('T')[0]);
  }
  return days;
}

function estimateCompletions(scores: DomainScores): Record<Domain, number> {
  return {
    physical:  Math.max(0, Math.floor((scores.physical  - DOMAIN_CONFIG.physical.default)  / 8)),
    mental:    Math.max(0, Math.floor((scores.mental    - DOMAIN_CONFIG.mental.default)    / 8)),
    spiritual: Math.max(0, Math.floor((scores.spiritual - DOMAIN_CONFIG.spiritual.default) / 8)),
  };
}

function estimateMinutes(completions: Record<Domain, number>): number {
  return Math.round(completions.physical * 7 + completions.mental * 15 + completions.spiritual * 6);
}

function getWeekDates(weeksAgo: number): string[] {
  const today = new Date();
  const dow = today.getDay();
  const mondayOffset = dow === 0 ? -6 : 1 - dow;
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() + mondayOffset - weeksAgo * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d.toISOString().split('T')[0];
  });
}

function buildWeeklyInsights(history: DayRecord[]): {
  thisWeekCount: number;
  lastWeekCount: number;
  bestDayOfWeek: string | null;
  allThreeRate: number; // % of active days with all 3 domains
  totalActiveDays: number;
} {
  const historyMap = buildHistoryMap(history);
  const thisWeek = getWeekDates(0);
  const lastWeek = getWeekDates(1);
  const today = new Date().toISOString().split('T')[0];

  const thisWeekCount = thisWeek.filter(d => d <= today && historyMap.has(d)).length;
  const lastWeekCount = lastWeek.filter(d => historyMap.has(d)).length;

  // Best day of week (0=Mon, 6=Sun label)
  const DOW_LABELS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const dowCounts = [0, 0, 0, 0, 0, 0, 0];
  for (const r of history) {
    const d = new Date(r.date + 'T12:00:00');
    const dow = d.getDay(); // 0=Sun
    const idx = dow === 0 ? 6 : dow - 1; // convert to Mon=0
    dowCounts[idx]++;
  }
  const maxDow = dowCounts.indexOf(Math.max(...dowCounts));
  const bestDayOfWeek = history.length >= 7 ? DOW_LABELS[maxDow] : null;

  const allThreeDays = history.filter(r => r.domains.length >= 3).length;
  const allThreeRate = history.length > 0 ? Math.round((allThreeDays / history.length) * 100) : 0;

  return { thisWeekCount, lastWeekCount, bestDayOfWeek, allThreeRate, totalActiveDays: history.length };
}

function CalendarHeatmap({ historyMap }: { historyMap: Map<string, Domain[]> }) {
  const days = getLast35Days();
  const today = new Date().toISOString().split('T')[0];
  const DOW = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  // Align first day to Monday
  const firstDate = new Date(days[0]);
  const startDow = firstDate.getDay(); // 0=Sun, 1=Mon...
  const offset = startDow === 0 ? 6 : startDow - 1;

  // Pad days to start from Monday
  const paddedDays: (string | null)[] = [...Array(offset).fill(null), ...days];

  // Group into weeks of 7
  const weeks: (string | null)[][] = [];
  for (let i = 0; i < paddedDays.length; i += 7) {
    weeks.push(paddedDays.slice(i, i + 7));
  }

  return (
    <div>
      {/* DOW headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3, marginBottom: 3 }}>
        {DOW.map((d, i) => (
          <div key={i} style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text4)', textAlign: 'center' }}>
            {d}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {weeks.map((week, wi) => (
          <div key={wi} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>
            {week.map((date, di) => {
              if (!date) return <div key={di} />;
              const domains = historyMap.get(date) || [];
              const isToday = date === today;
              const isFuture = date > today;
              const color = getDayColor(domains);
              const opacity = getDayOpacity(domains);
              const hasDomains = domains.length > 0;

              return (
                <div
                  key={date}
                  title={`${date}${hasDomains ? ' · ' + domains.join(', ') : ''}`}
                  style={{
                    aspectRatio: '1',
                    borderRadius: 3,
                    background: hasDomains ? color : 'var(--surface2)',
                    opacity: isFuture ? 0.2 : hasDomains ? opacity : 0.6,
                    border: isToday ? '1.5px solid rgba(255,255,255,0.4)' : '1px solid transparent',
                    transition: 'opacity 0.3s',
                    cursor: hasDomains ? 'default' : undefined,
                    boxShadow: hasDomains && domains.length === 3 ? `0 0 6px ${color}60` : 'none',
                  }}
                />
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap' }}>
        {DOMAINS.map(d => (
          <div key={d} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: DOMAIN_CONFIG[d].hex }} />
            <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text3)', textTransform: 'capitalize' }}>{d}</span>
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 8, height: 8, borderRadius: 2, background: '#a8ff3e', boxShadow: '0 0 4px #a8ff3e80' }} />
          <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text3)' }}>All 3</span>
        </div>
      </div>
    </div>
  );
}

const DOMAIN_INSIGHTS: Record<Domain, Record<string, string>> = {
  physical: {
    baseline: 'Your body is at rest. The first session breaks the baseline.',
    awakening: 'Energy is becoming more reliable. Your body is responding.',
    building: 'Physical capacity is compounding. You feel the difference in how you move through the day.',
    compound: 'Your physical baseline has shifted. This is your new normal.',
    automatic: 'Physical patterns are fully automatic. Your body runs on them.',
  },
  mental: {
    baseline: 'Focus and clarity are inconsistent. Patterns here change everything downstream.',
    awakening: 'Mental patterns are forming. Decision-making is getting cleaner.',
    building: 'Cognitive clarity is compounding. Your thoughts are sharper, decisions faster.',
    compound: 'Mental focus is automatic. You do your best thinking here.',
    automatic: 'Mental performance is locked in. You operate at a different level.',
  },
  spiritual: {
    baseline: 'This domain anchors everything else. Start here and watch the others lift.',
    awakening: 'Purpose is becoming visible. Values are getting clearer.',
    building: 'Spiritual clarity is compounding. Your "why" is getting stronger.',
    compound: "You're operating from deep alignment. The motivation sustains itself.",
    automatic: 'Purpose and values drive everything. This is integrated identity.',
  },
};

function getDomainInsight(domain: Domain, score: number): string {
  const ins = DOMAIN_INSIGHTS[domain];
  if (score <= 35) return ins.baseline;
  if (score <= 50) return ins.awakening;
  if (score <= 65) return ins.building;
  if (score <= 80) return ins.compound;
  return ins.automatic;
}

function getNextMilestone(score: number): { threshold: number; sessionsNeeded: number } | null {
  const thresholds = [50, 65, 80, 100];
  for (const t of thresholds) {
    if (score < t) {
      return { threshold: t, sessionsNeeded: Math.ceil((t - score) / 8) };
    }
  }
  return null;
}

function DomainBar({ domain, score, completions }: { domain: Domain; score: number; completions: number }) {
  const cfg = DOMAIN_CONFIG[domain];
  const velocity = completions > 0 ? '+' + completions + ' sessions' : 'not yet started';
  const trend = score > cfg.default ? '↑' : '→';

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      padding: '18px 20px',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: cfg.color, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>
            {cfg.label}
          </div>
          <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text3)' }}>
            {velocity}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 34, fontWeight: 800, color: cfg.color, lineHeight: 1 }}>
            {score}
          </span>
          <span style={{ fontSize: 14, color: completions > 0 ? cfg.color : 'var(--text4)', fontFamily: 'var(--font-mono)' }}>
            {trend}
          </span>
        </div>
      </div>

      <div style={{ background: 'var(--surface3)', borderRadius: 3, height: 6, overflow: 'hidden', marginBottom: 6 }}>
        <div style={{
          height: '100%', borderRadius: 3, background: cfg.color,
          width: `${score}%`,
          transition: 'width 1.2s cubic-bezier(0.4,0,0.2,1)',
          boxShadow: score > 50 ? `0 0 8px ${cfg.hex}60` : 'none',
        }} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text4)' }}>baseline {cfg.default}</span>
        <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text4)' }}>100</span>
      </div>
      {completions > 0 && (
        <p style={{ fontSize: 10, color: 'var(--text3)', lineHeight: 1.5, fontStyle: 'italic', marginTop: 2 }}>
          {getDomainInsight(domain, score)}
        </p>
      )}
      {(() => {
        const next = getNextMilestone(score);
        if (!next || score >= 100) return null;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 6 }}>
            <div style={{ flex: 1, background: 'var(--surface3)', borderRadius: 2, height: 2, overflow: 'hidden' }}>
              <div style={{
                height: '100%', background: cfg.color, opacity: 0.4,
                width: `${((score - (next.threshold - (next.sessionsNeeded * 8))) / (next.sessionsNeeded * 8)) * 100}%`,
                transition: 'width 1s ease',
              }} />
            </div>
            <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text4)', whiteSpace: 'nowrap' }}>
              {next.sessionsNeeded}× to {next.threshold}
            </span>
          </div>
        );
      })()}
    </div>
  );
}

function GoalMomentum({ goal, scores }: { goal: Goal; scores: DomainScores }) {
  const catCfg = CATEGORY_CONFIG[goal.category] || { color: 'var(--text2)', icon: '◎' };
  const days = Math.ceil((new Date(goal.targetDate).getTime() - Date.now()) / 86400000);
  const linkedDomains = goal.linkedDomains.length > 0 ? goal.linkedDomains : DOMAINS;
  const avgScore = Math.round(linkedDomains.reduce((sum, d) => sum + scores[d], 0) / linkedDomains.length);

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      padding: '18px 20px',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
            <span style={{ color: catCfg.color, fontSize: 13 }}>{catCfg.icon}</span>
            <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: catCfg.color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {goal.category}
            </span>
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text1)', fontFamily: 'var(--font-display)', lineHeight: 1.3 }}>
            {goal.title}
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 16 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, color: avgScore > 50 ? 'var(--physical)' : 'var(--text2)', lineHeight: 1 }}>
            {avgScore}
          </div>
          <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text4)', marginTop: 2 }}>
            avg momentum
          </div>
        </div>
      </div>

      {/* Domain contributors */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
        {linkedDomains.map(d => {
          const dcfg = DOMAIN_CONFIG[d];
          return (
            <div key={d} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: dcfg.color, textTransform: 'capitalize', minWidth: 60 }}>
                {d}
              </span>
              <div style={{ flex: 1, background: 'var(--surface2)', borderRadius: 2, height: 4, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 2, background: dcfg.color,
                  width: `${scores[d]}%`, transition: 'width 1s ease',
                  opacity: 0.8,
                }} />
              </div>
              <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: dcfg.color, minWidth: 24, textAlign: 'right' }}>
                {scores[d]}
              </span>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTop: '1px solid var(--border)' }}>
        <span style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>
          {days > 0 ? `${days} days to target` : `${Math.abs(days)}d past target`}
        </span>
        <span style={{ fontSize: 11, color: avgScore > 60 ? 'var(--physical)' : avgScore > 40 ? 'var(--mental)' : 'var(--text3)', fontFamily: 'var(--font-mono)' }}>
          {avgScore > 60 ? 'accelerating ↑' : avgScore > 40 ? 'building →' : 'early stage ·'}
        </span>
      </div>
    </div>
  );
}

export default function ProgressPage() {
  const router = useRouter();
  const [state, setState] = useState<AppState | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const s = loadState();
    if (!s.profile.onboarded) { router.replace('/'); return; }
    setState(s);
    setMounted(true);
  }, [router]);

  if (!mounted || !state) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div style={{ width: 32, height: 32, border: '2px solid rgba(168,255,62,0.2)', borderTopColor: '#a8ff3e', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const { domainScores, streak, longestStreak, history = [], goals = [], journal = [], patternCounts = {} } = state;
  const historyMap = buildHistoryMap(history);
  const completions = estimateCompletions(domainScores);
  const totalPatterns = completions.physical + completions.mental + completions.spiritual;
  const totalMins = estimateMinutes(completions);
  const activeGoals = goals.filter(g => !g.archived);
  const goalsWithDomains = activeGoals.filter(g => g.linkedDomains.length > 0);

  const activeDays = history.length;
  const weeklyInsights = buildWeeklyInsights(history);

  return (
    <AppLayout activeHref="/progress">
      <div style={{ maxWidth: 900 }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }} className="fade-up">
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text1)', lineHeight: 1.15 }}>
            Compounding Tracker
          </h1>
          <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 5, fontFamily: 'var(--font-mono)' }}>
            {activeDays === 0 && streak === 0
              ? 'Complete your first practice to start tracking momentum.'
              : 'Your patterns are working. Here\'s the proof.'}
          </p>
        </div>

        {/* Top stats */}
        <div className="fade-up fade-up-d1" style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 24,
        }}>
          {[
            { label: 'Days active',      value: activeDays || streak || '—',  color: 'var(--physical)'  },
            { label: 'Patterns done',    value: totalPatterns || '—',         color: 'var(--mental)'    },
            { label: 'Minutes invested', value: totalMins > 0 ? `${totalMins}m` : '—', color: 'var(--spiritual)' },
            { label: 'Best streak',      value: (longestStreak || streak) > 0 ? `${longestStreak || streak}d` : '—', color: 'var(--physical)' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius)', padding: '16px 18px',
            }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, color: value === '—' ? 'var(--text4)' : color, lineHeight: 1, marginBottom: 4 }}>
                {value}
              </div>
              <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                {label}
              </div>
            </div>
          ))}
        </div>

        {/* Weekly Insights */}
        {activeDays >= 3 && (
          <div className="fade-up fade-up-d1" style={{ marginBottom: 20 }}>
            <div style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: '20px 22px',
            }}>
              <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text4)', marginBottom: 14 }}>
                This week
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>

                {/* This week vs last */}
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, lineHeight: 1, marginBottom: 4 }}>
                    <span style={{ color: weeklyInsights.thisWeekCount >= weeklyInsights.lastWeekCount ? 'var(--physical)' : '#ff8c69' }}>
                      {weeklyInsights.thisWeekCount}
                    </span>
                    <span style={{ fontSize: 14, color: 'var(--text4)', fontFamily: 'var(--font-mono)', marginLeft: 4 }}>/7</span>
                  </div>
                  <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text3)' }}>
                    days this week
                    {weeklyInsights.lastWeekCount > 0 && (
                      <span style={{ marginLeft: 5, color: weeklyInsights.thisWeekCount >= weeklyInsights.lastWeekCount ? 'var(--physical)' : 'var(--text4)' }}>
                        {weeklyInsights.thisWeekCount >= weeklyInsights.lastWeekCount ? '↑' : '↓'} vs {weeklyInsights.lastWeekCount} last
                      </span>
                    )}
                  </div>
                </div>

                {/* All-3 rate */}
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: weeklyInsights.allThreeRate >= 50 ? 'var(--mental)' : 'var(--text2)', lineHeight: 1, marginBottom: 4 }}>
                    {weeklyInsights.allThreeRate}%
                  </div>
                  <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text3)' }}>
                    full 3-domain days
                  </div>
                </div>

                {/* Best day of week */}
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, color: 'var(--spiritual)', lineHeight: 1, marginBottom: 4 }}>
                    {weeklyInsights.bestDayOfWeek ?? '—'}
                  </div>
                  <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text3)' }}>
                    {weeklyInsights.bestDayOfWeek ? 'your most consistent day' : 'build more history'}
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* Activity calendar */}
        <div className="panel fade-up fade-up-d2" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div className="panel-title" style={{ marginBottom: 0 }}>Activity — Last 35 Days</div>
            <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text3)' }}>
              {streak} day streak · today {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </div>
          </div>
          <CalendarHeatmap historyMap={historyMap} />
          {activeDays === 0 && (
            <div style={{
              marginTop: 16, padding: '12px 16px',
              background: 'var(--surface2)', borderRadius: 'var(--radius-sm)',
              borderLeft: '2px solid rgba(168,255,62,0.3)',
            }}>
              <p style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-mono)', lineHeight: 1.6 }}>
                Complete today's patterns to start filling your tracker. Each day you build becomes permanent evidence that you're changing.
              </p>
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>

          {/* Domain momentum */}
          <div className="fade-up fade-up-d3">
            <div className="panel-title">Domain Momentum</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {DOMAINS.map(d => (
                <DomainBar key={d} domain={d} score={domainScores[d]} completions={completions[d]} />
              ))}
            </div>
          </div>

          {/* Compounding insight */}
          <div className="fade-up fade-up-d3">
            <div className="panel-title">The Compound Effect</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

              {/* Streak visualization */}
              <div style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                padding: '20px',
                textAlign: 'center',
              }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 72, fontWeight: 800, color: 'var(--physical)', lineHeight: 1, marginBottom: 4 }}>
                  {streak}
                </div>
                <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  consecutive days
                </div>
                {streak > 0 && (
                  <div style={{ marginTop: 14, display: 'flex', justifyContent: 'center', gap: 3 }}>
                    {Array.from({ length: Math.min(streak, 14) }).map((_, i) => (
                      <div key={i} style={{
                        width: 8, height: 8, borderRadius: '50%',
                        background: 'var(--physical)',
                        opacity: 0.3 + (i / Math.min(streak, 14)) * 0.7,
                      }} />
                    ))}
                    {streak > 14 && <span style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'var(--font-mono)', marginLeft: 4 }}>+{streak - 14}</span>}
                  </div>
                )}
              </div>

              <div style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                padding: '16px 18px',
              }}>
                <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
                  Domain Balance
                </div>
                {DOMAINS.map(d => {
                  const cfg = DOMAIN_CONFIG[d];
                  const share = totalPatterns > 0 ? Math.round((completions[d] / totalPatterns) * 100) : 33;
                  return (
                    <div key={d} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: cfg.color, minWidth: 60, textTransform: 'capitalize' }}>{d}</span>
                      <div style={{ flex: 1, background: 'var(--surface2)', borderRadius: 2, height: 4, overflow: 'hidden' }}>
                        <div style={{ height: '100%', borderRadius: 2, background: cfg.color, width: `${share}%`, transition: 'width 1s ease' }} />
                      </div>
                      <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text3)', minWidth: 28, textAlign: 'right' }}>{completions[d]}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Pattern → Commitment connections */}
        {activeGoals.length > 0 && (
          <div className="fade-up fade-up-d4">
            <div className="panel-title">Pattern → Commitment Momentum</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
              {activeGoals.map(goal => (
                <GoalMomentum key={goal.id} goal={goal} scores={domainScores} />
              ))}
            </div>
          </div>
        )}

        {activeGoals.length === 0 && (
          <div className="fade-up fade-up-d4" style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: '24px',
            display: 'flex', alignItems: 'center', gap: 16,
          }}>
            <span style={{ fontSize: 24, color: 'var(--text4)' }}>◎</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text2)', marginBottom: 3 }}>
                No commitments yet — your patterns are compounding without a destination.
              </div>
              <button
                onClick={() => router.push('/commitments')}
                style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--physical)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                Name a commitment to see how your patterns are driving it →
              </button>
            </div>
          </div>
        )}

        {/* Pattern Journal */}
        {journal.length > 0 && (
          <div className="fade-up fade-up-d4" style={{ marginTop: 20 }}>
            <div className="panel-title">Pattern Journal</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[...journal].reverse().slice(0, 7).map((entry, i) => {
                const color = entry.domain === 'physical' ? 'var(--physical)' : entry.domain === 'mental' ? 'var(--mental)' : 'var(--spiritual)';
                return (
                  <div key={i} style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    padding: '16px 18px',
                    borderLeft: `3px solid ${color}`,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{entry.domain}</span>
                      <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text4)', marginLeft: 'auto' }}>{entry.date}</span>
                    </div>
                    <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text4)', marginBottom: 6 }}>
                      {entry.actionTitle}
                    </div>
                    <p style={{ fontSize: 11, color: 'var(--text3)', fontStyle: 'italic', lineHeight: 1.5, marginBottom: 6 }}>
                      {entry.question}
                    </p>
                    <p style={{ fontSize: 13, color: 'var(--text1)', lineHeight: 1.65 }}>
                      {entry.response}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Built Habits */}
        {Object.keys(patternCounts).length > 0 && (
          <div className="fade-up" style={{ marginTop: 20 }}>
            <div className="panel-title">Built Habits</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 10 }}>
              {Object.entries(patternCounts)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 6)
                .map(([title, count]) => {
                  const pct = Math.min(100, Math.round((count / 21) * 100));
                  const isHabit = count >= 21;
                  const color = isHabit ? 'var(--physical)' : count >= 7 ? 'var(--mental)' : 'var(--spiritual)';
                  return (
                    <div key={title} style={{
                      background: 'var(--surface)',
                      border: `1px solid ${isHabit ? 'rgba(168,255,62,0.25)' : 'var(--border)'}`,
                      borderRadius: 'var(--radius)',
                      padding: '16px 18px',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text1)', lineHeight: 1.3, flex: 1, paddingRight: 8 }}>
                          {title}
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color, lineHeight: 1 }}>
                            {count}×
                          </div>
                          {isHabit && (
                            <div style={{ fontSize: 8, fontFamily: 'var(--font-mono)', color: 'var(--physical)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 2 }}>
                              habit
                            </div>
                          )}
                        </div>
                      </div>
                      <div style={{ background: 'var(--surface3)', borderRadius: 2, height: 3, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', borderRadius: 2, background: color,
                          width: `${pct}%`, transition: 'width 1s ease',
                          boxShadow: isHabit ? `0 0 6px ${color}60` : 'none',
                        }} />
                      </div>
                      <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text4)', marginTop: 5 }}>
                        {isHabit ? 'Automatic — this is part of you now' : `${21 - count} more to make it automatic`}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Bottom insight */}
        <div className="fade-up" style={{
          marginTop: 24,
          padding: '16px 20px',
          background: 'var(--accent-dim)',
          border: '1px solid rgba(168,255,62,0.12)',
          borderRadius: 'var(--radius)',
          fontSize: 12, color: 'var(--text2)', lineHeight: 1.7, fontStyle: 'italic',
        }}>
          The score isn't the point. The trajectory is. A score moving from 40 to 68 means your physical patterns are becoming automatic — and automatic is when compounding really starts.
        </div>

      </div>
    </AppLayout>
  );
}
