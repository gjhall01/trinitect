'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import { loadState } from '@/lib/store';
import { getAllPatterns } from '@/lib/mock-ai';
import type { Domain, DomainScores } from '@/lib/types';

const DOMAIN_CONFIG: Record<Domain, { label: string; color: string; bg: string; description: string }> = {
  physical: {
    label: 'Physical', color: 'var(--physical)', bg: 'rgba(168,255,62,0.08)',
    description: 'Body and energy patterns — the foundation everything else runs on.',
  },
  mental: {
    label: 'Mental', color: 'var(--mental)', bg: 'rgba(56,217,245,0.08)',
    description: 'Focus, clarity, and cognitive patterns — how you process and decide.',
  },
  spiritual: {
    label: 'Spiritual', color: 'var(--spiritual)', bg: 'rgba(212,160,255,0.08)',
    description: 'Purpose, alignment, and values patterns — what gives your effort meaning.',
  },
};

type PatternEntry = {
  title: string;
  duration: number;
  description: string;
  benefit: string;
  reflection?: string;
};

function PatternCard({ pattern, domain, expanded, onToggle, count = 0 }: {
  pattern: PatternEntry;
  domain: Domain;
  expanded: boolean;
  onToggle: () => void;
  count?: number;
}) {
  const cfg = DOMAIN_CONFIG[domain];
  const isHabit = count >= 21;

  return (
    <div style={{
      background: 'var(--surface2)',
      border: `1px solid ${expanded ? cfg.color + '40' : isHabit ? cfg.color + '30' : 'var(--border)'}`,
      borderRadius: 'var(--radius)',
      overflow: 'hidden',
      transition: 'border-color var(--transition)',
    }}>
      <button
        onClick={onToggle}
        style={{
          width: '100%', background: 'none', border: 'none', cursor: 'pointer',
          padding: '14px 16px',
          display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left',
        }}
      >
        <div style={{
          width: 3, height: 40, flexShrink: 0, borderRadius: 2,
          background: cfg.color, opacity: count > 0 ? 1 : 0.7,
        }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text1)', lineHeight: 1.3 }}>
            {pattern.title}
          </div>
          <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text3)', marginTop: 3 }}>
            {pattern.duration} min · {pattern.description.slice(0, 60)}{pattern.description.length > 60 ? '…' : ''}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {count > 0 && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 3,
              padding: '3px 8px', borderRadius: 20,
              background: isHabit ? `${cfg.color}20` : 'var(--surface)',
              border: `1px solid ${isHabit ? cfg.color + '40' : 'var(--border)'}`,
            }}>
              <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: isHabit ? cfg.color : 'var(--text3)', fontWeight: isHabit ? 700 : 400 }}>
                {count}×{isHabit && ' ✦'}
              </span>
            </div>
          )}
          <span style={{ color: expanded ? cfg.color : 'var(--text3)', fontSize: 11, fontFamily: 'var(--font-mono)', transition: 'color var(--transition)', letterSpacing: '0.04em' }}>
            {expanded ? '▲' : '▼'}
          </span>
        </div>
      </button>

      {expanded && (
        <div style={{
          padding: '0 16px 18px 35px',
          animation: 'fadeIn 0.2s ease both',
        }}>
          {pattern.reflection && (
            <div style={{
              padding: '14px 16px',
              background: 'var(--surface)',
              borderRadius: 'var(--radius-sm)',
              borderLeft: `2px solid ${cfg.color}60`,
              marginBottom: 10,
            }}>
              <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: cfg.color, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
                Reflect
              </div>
              <p style={{ fontSize: 12, color: 'var(--text1)', fontStyle: 'italic', lineHeight: 1.65 }}>
                {pattern.reflection}
              </p>
            </div>
          )}
          <div style={{
            padding: '10px 12px',
            background: 'var(--surface)',
            borderRadius: 'var(--radius-sm)',
          }}>
            <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
              What it builds
            </div>
            <p style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-mono)', lineHeight: 1.5 }}>
              {pattern.benefit}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function DomainScore({ domain, score }: { domain: Domain; score: number }) {
  const cfg = DOMAIN_CONFIG[domain];
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      padding: '18px 20px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: cfg.color, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>
            {cfg.label}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text3)', lineHeight: 1.5 }}>
            {cfg.description}
          </div>
        </div>
        <div style={{
          fontFamily: 'var(--font-display)', fontSize: 34, fontWeight: 800,
          color: cfg.color, lineHeight: 1, minWidth: 52, textAlign: 'right',
        }}>
          {score}
        </div>
      </div>
      <div style={{ background: 'var(--surface3)', borderRadius: 3, height: 4, overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 3, background: cfg.color,
          width: `${score}%`, transition: 'width 1s cubic-bezier(0.4,0,0.2,1)',
        }} />
      </div>
    </div>
  );
}

export default function PatternsPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [scores, setScores] = useState<DomainScores>({ physical: 0, mental: 0, spiritual: 0 });
  const [streak, setStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [patternCounts, setPatternCounts] = useState<Record<string, number>>({});
  const [expandedPattern, setExpandedPattern] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Domain>('physical');

  const allPatterns = getAllPatterns();

  useEffect(() => {
    const s = loadState();
    if (!s.profile.onboarded) { router.replace('/'); return; }
    setScores(s.domainScores);
    setStreak(s.streak);
    setLongestStreak(s.longestStreak);
    setPatternCounts(s.patternCounts || {});
    setMounted(true);
  }, [router]);

  if (!mounted) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div style={{ width: 32, height: 32, border: '2px solid rgba(168,255,62,0.2)', borderTopColor: '#a8ff3e', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const domains: Domain[] = ['physical', 'mental', 'spiritual'];
  const totalScore = Math.round(Object.values(scores).reduce((a, b) => a + b, 0) / 3);

  return (
    <AppLayout activeHref="/patterns">
      <div style={{ maxWidth: 900 }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }} className="fade-up">
          <button onClick={() => router.push('/today')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text4)', padding: 0, marginBottom: 12, letterSpacing: '0.06em' }}>← Back to Today</button>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text1)', lineHeight: 1.15 }}>
            Your Patterns
          </h1>
          <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 5, fontFamily: 'var(--font-mono)' }}>
            Examine the WHY behind each pattern — and track how they're compounding.
          </p>
        </div>

        {/* Consistency stats */}
        <div className="fade-up fade-up-d1" style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 24,
        }}>
          {[
            { label: 'Overall Score', value: totalScore, color: 'var(--physical)' },
            { label: 'Current Streak', value: `${streak}d`, color: 'var(--mental)' },
            { label: 'Personal Best', value: `${longestStreak || streak}d`, color: 'var(--spiritual)' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius)', padding: '18px 20px',
            }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 800, color, lineHeight: 1, marginBottom: 4 }}>
                {value}
              </div>
              <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                {label}
              </div>
            </div>
          ))}
        </div>

        {/* Domain health */}
        <div className="fade-up fade-up-d2" style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 36 }}>
          <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--text4)', marginBottom: 4 }}>
            Domain Health
          </div>
          {domains.map(d => (
            <DomainScore key={d} domain={d} score={scores[d]} />
          ))}
        </div>

        {/* Pattern library */}
        <div className="fade-up fade-up-d3">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--text4)' }}>
              Pattern Library
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {domains.map(d => {
                const cfg = DOMAIN_CONFIG[d];
                return (
                  <button
                    key={d}
                    onClick={() => setActiveTab(d)}
                    style={{
                      padding: '6px 14px',
                      background: activeTab === d ? cfg.bg : 'var(--surface)',
                      border: `1px solid ${activeTab === d ? cfg.color + '60' : 'var(--border)'}`,
                      borderRadius: 20,
                      cursor: 'pointer',
                      fontSize: 11, fontFamily: 'var(--font-mono)',
                      color: activeTab === d ? cfg.color : 'var(--text3)',
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

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {allPatterns[activeTab].map(pattern => {
              const key = `${activeTab}-${pattern.title}`;
              return (
                <PatternCard
                  key={key}
                  pattern={pattern}
                  domain={activeTab}
                  expanded={expandedPattern === key}
                  onToggle={() => setExpandedPattern(expandedPattern === key ? null : key)}
                  count={patternCounts[pattern.title] || 0}
                />
              );
            })}
          </div>

          <div style={{
            marginTop: 20, padding: '14px 18px',
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            fontSize: 11, color: 'var(--text3)', lineHeight: 1.65, fontStyle: 'italic',
          }}>
            These patterns were selected because they compound — each one makes the next easier. The goal isn't to do all of them; it's to build the identity of someone who does them naturally.
          </div>
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
