'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import { loadState } from '@/lib/store';
import { getToken } from '@/lib/api-client';
import type { Domain, GoalCategory } from '@/lib/types';

// ── Types ────────────────────────────────────────────────────────────────────

type Post = {
  pk: string;
  sk: string;
  postId: string;
  authorName: string;
  category: GoalCategory | string;
  domain: Domain[];
  fromPattern: string;
  toPattern: string;
  impact: string;
  hearts: number;
  createdAt: string;
  _hearted?: boolean; // local-only tracking
};

// ── Seed editorial stories ───────────────────────────────────────────────────
// Shown when fewer than 10 real posts exist. Real-feeling, category-diverse.

const SEED_POSTS: Omit<Post, 'pk' | 'sk' | 'postId' | '_hearted'>[] = [
  {
    authorName: 'Sarah',
    category: 'career',
    domain: ['mental'],
    fromPattern: 'Checking email first thing every morning — 45 minutes gone before I even had coffee.',
    toPattern: '25-min focus block before I touch email or Slack.',
    impact: 'In six weeks I shipped a feature users had been requesting for months. I had been "too busy" for a year. Turns out I wasn\'t too busy. I was too scattered.',
    hearts: 94,
    createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
  },
  {
    authorName: 'Marcus',
    category: 'physical',
    domain: ['physical'],
    fromPattern: 'Hitting snooze 3 times. Starting every day already behind.',
    toPattern: 'Sleep anchor ritual + cold shower. Consistent sleep and wake time.',
    impact: 'Lost 22 lbs in 4 months — but that wasn\'t even the main thing. My thinking is sharper. I make better decisions before noon than I used to make all day.',
    hearts: 147,
    createdAt: new Date(Date.now() - 11 * 86400000).toISOString(),
  },
  {
    authorName: 'Priya',
    category: 'relationships',
    domain: ['spiritual', 'mental'],
    fromPattern: 'Coming home and immediately getting on my phone. My husband and I were in the same room but not really there.',
    toPattern: 'Connection check-in first — 10 minutes of real conversation before anything else.',
    impact: 'We haven\'t had a real argument in two months. What changed wasn\'t the relationship. It was the pattern of how we entered the evening.',
    hearts: 212,
    createdAt: new Date(Date.now() - 18 * 86400000).toISOString(),
  },
  {
    authorName: 'James',
    category: 'career',
    domain: ['mental', 'spiritual'],
    fromPattern: 'Procrastinating on the hard work and filling the day with low-stakes busy work instead.',
    toPattern: 'Brain dump every morning. Circle the one thing I\'d be proud of finishing. Do that first.',
    impact: 'Got the promotion. But more importantly — I understand now WHY I was avoiding the hard stuff. It wasn\'t laziness. It was the pattern of choosing comfort over discomfort.',
    hearts: 183,
    createdAt: new Date(Date.now() - 25 * 86400000).toISOString(),
  },
  {
    authorName: 'Aisha',
    category: 'spiritual',
    domain: ['spiritual'],
    fromPattern: 'Carrying a falling-out with my closest friend for almost three years. I told myself I\'d moved on.',
    toPattern: 'Forgiveness sweep — 5 minutes every evening identifying what I was holding onto.',
    impact: 'We talked last month for the first time in three years. We both cried. I had been burning energy on resentment every single day without even knowing it.',
    hearts: 321,
    createdAt: new Date(Date.now() - 33 * 86400000).toISOString(),
  },
  {
    authorName: 'Derek',
    category: 'financial',
    domain: ['mental', 'spiritual'],
    fromPattern: 'Making financial decisions when I was stressed, anxious, or trying to feel better.',
    toPattern: 'Brain dump + values check before any decision involving real money. If I can\'t answer "does this align with what I actually want?" I wait 48 hours.',
    impact: 'Avoided a $14,000 investment decision I would have regretted. The pattern wasn\'t the decision itself — it was making decisions as emotional regulation.',
    hearts: 89,
    createdAt: new Date(Date.now() - 40 * 86400000).toISOString(),
  },
];

// ── Config ────────────────────────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  career:        { label: 'Career',          color: 'var(--mental)',    bg: 'rgba(56,217,245,0.10)',   icon: '⬢' },
  physical:      { label: 'Physical',        color: 'var(--physical)',  bg: 'rgba(168,255,62,0.10)',   icon: '◉' },
  spiritual:     { label: 'Spiritual',       color: 'var(--spiritual)', bg: 'rgba(212,160,255,0.10)',  icon: '✦' },
  relationships: { label: 'Relationships',   color: '#ff8c69',          bg: 'rgba(255,140,105,0.10)',  icon: '⟡' },
  financial:     { label: 'Financial',       color: '#ffd166',          bg: 'rgba(255,209,102,0.10)',  icon: '◇' },
  personal:      { label: 'Personal Growth', color: '#06d6a0',          bg: 'rgba(6,214,160,0.10)',    icon: '⟳' },
};

const DOMAIN_CONFIG: Record<Domain, { color: string }> = {
  physical:  { color: 'var(--physical)'  },
  mental:    { color: 'var(--mental)'    },
  spiritual: { color: 'var(--spiritual)' },
};

function timeAgo(isoDate: string): string {
  const diff = Math.floor((Date.now() - new Date(isoDate).getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
  return `${Math.floor(diff / 2592000)}mo ago`;
}

// ── Post Card ─────────────────────────────────────────────────────────────────

function PostCard({
  post,
  onHeart,
  seed = false,
}: {
  post: Post;
  onHeart: (post: Post) => void;
  seed?: boolean;
}) {
  const cfg = CATEGORY_CONFIG[post.category] || CATEGORY_CONFIG.personal;

  return (
    <article style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      padding: '20px 22px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Left accent */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
        background: cfg.color, opacity: 0.7,
      }} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Author avatar letter */}
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: cfg.bg, border: `1px solid ${cfg.color}40`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700, color: cfg.color,
            flexShrink: 0,
          }}>
            {post.authorName[0].toUpperCase()}
          </div>
          <div>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text1)' }}>{post.authorName}</span>
            {seed && (
              <span style={{ marginLeft: 6, fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                featured
              </span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            background: cfg.bg, color: cfg.color,
            fontSize: 9, fontFamily: 'var(--font-mono)', fontWeight: 600,
            letterSpacing: '0.08em', textTransform: 'uppercase',
            padding: '2px 8px', borderRadius: 20,
          }}>
            {cfg.icon} {cfg.label}
          </span>
          <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text4)' }}>
            {timeAgo(post.createdAt)}
          </span>
        </div>
      </div>

      {/* Pattern transformation */}
      {(post.fromPattern || post.toPattern) && (
        <div style={{
          background: 'var(--surface2)',
          borderRadius: 'var(--radius-sm)',
          padding: '12px 14px',
          marginBottom: 12,
          display: 'flex', flexDirection: 'column', gap: 8,
        }}>
          {post.fromPattern && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text4)', flexShrink: 0, marginTop: 1 }}>old</span>
              <span style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.5, fontStyle: 'italic' }}>{post.fromPattern}</span>
            </div>
          )}
          {post.fromPattern && post.toPattern && (
            <div style={{ height: 1, background: 'var(--border)' }} />
          )}
          {post.toPattern && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: cfg.color, flexShrink: 0, marginTop: 1 }}>new</span>
              <span style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.5 }}>{post.toPattern}</span>
            </div>
          )}
        </div>
      )}

      {/* Impact — the main story */}
      <p style={{
        fontSize: 13, color: 'var(--text1)', lineHeight: 1.7,
        marginBottom: 14,
      }}>
        {post.impact}
      </p>

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {post.domain.map(d => (
            <span key={d} style={{
              fontSize: 9, fontFamily: 'var(--font-mono)', fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: '0.07em',
              padding: '2px 8px', borderRadius: 20,
              background: `${DOMAIN_CONFIG[d].color}15`,
              color: DOMAIN_CONFIG[d].color,
            }}>
              {d}
            </span>
          ))}
        </div>
        <button
          onClick={() => !seed && onHeart(post)}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            background: 'none', border: 'none',
            cursor: seed ? 'default' : 'pointer',
            padding: '4px 8px', borderRadius: 20,
            color: post._hearted ? '#ff8c69' : 'var(--text3)',
            fontSize: 12, fontFamily: 'var(--font-mono)',
            transition: 'all 0.2s',
          }}
        >
          <span style={{ fontSize: 14 }}>{post._hearted ? '♥' : '♡'}</span>
          {post.hearts}
        </button>
      </div>
    </article>
  );
}

// ── Log a Win Modal ───────────────────────────────────────────────────────────

type FormState = {
  fromPattern: string;
  toPattern: string;
  impact: string;
  category: string;
  domain: Domain[];
  authorName: string;
};

function LogWinModal({ profile, onClose, onPosted }: {
  profile: { name: string };
  onClose: () => void;
  onPosted: (post: Post) => void;
}) {
  const [form, setForm] = useState<FormState>({
    fromPattern: '',
    toPattern: '',
    impact: '',
    category: '',
    domain: [],
    authorName: profile.name || '',
  });
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const CATEGORIES = Object.keys(CATEGORY_CONFIG) as (keyof typeof CATEGORY_CONFIG)[];
  const DOMAINS: Domain[] = ['physical', 'mental', 'spiritual'];

  function toggleDomain(d: Domain) {
    setForm(f => ({
      ...f,
      domain: f.domain.includes(d) ? f.domain.filter(x => x !== d) : [...f.domain, d],
    }));
  }

  async function handleSubmit() {
    if (form.impact.trim().length < 10) return;
    setLoading(true);
    setError('');
    try {
      const token = getToken();
      const res = await fetch('/api/community', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(form),
      });
      const data = await res.json() as { post?: Post; error?: string };
      if (data.error) { setError(data.error); setLoading(false); return; }
      if (data.post) onPosted(data.post);
    } catch {
      setError('Connection error — try again.');
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 400,
        background: 'rgba(7,8,15,0.85)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 580,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '20px 20px 0 0',
          padding: '28px 28px 44px',
          animation: 'slideUp 0.3s cubic-bezier(0.4,0,0.2,1) both',
          maxHeight: '92vh', overflowY: 'auto',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, color: 'var(--text1)', letterSpacing: '-0.03em' }}>
            {step === 1 ? 'What changed?' : 'The details'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: 22, lineHeight: 1 }}>×</button>
        </div>
        <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 24, lineHeight: 1.5 }}>
          {step === 1
            ? "Your story might be the reason someone else commits."
            : 'Give it context — what was the old pattern, what replaced it?'}
        </p>

        {/* Progress */}
        <div style={{ display: 'flex', gap: 5, marginBottom: 24 }}>
          {[1, 2].map(s => (
            <div key={s} style={{
              flex: 1, height: 2, borderRadius: 2,
              background: s <= step ? 'var(--physical)' : 'var(--surface3)',
              transition: 'background 0.3s',
            }} />
          ))}
        </div>

        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Impact — the most important field */}
            <div>
              <label style={{ display: 'block', fontSize: 10, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text3)', marginBottom: 8 }}>
                What changed in your life? *
              </label>
              <textarea
                autoFocus
                value={form.impact}
                onChange={e => setForm(f => ({ ...f, impact: e.target.value }))}
                placeholder="Be specific. Not 'I feel better' — what actually shifted? What are you doing or not doing now?"
                style={{
                  width: '100%', background: 'var(--surface2)',
                  border: '1.5px solid var(--border)', borderRadius: 'var(--radius)',
                  padding: '14px 16px', color: 'var(--text1)', fontSize: 13,
                  fontFamily: 'var(--font-body)', outline: 'none', resize: 'none',
                  lineHeight: 1.65, minHeight: 110,
                  transition: 'border-color var(--transition)',
                }}
                onFocus={e => e.target.style.borderColor = 'rgba(168,255,62,0.4)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </div>

            {/* Category */}
            <div>
              <label style={{ display: 'block', fontSize: 10, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text3)', marginBottom: 10 }}>
                Area of life
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                {CATEGORIES.map(cat => {
                  const c = CATEGORY_CONFIG[cat];
                  const sel = form.category === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => setForm(f => ({ ...f, category: f.category === cat ? '' : cat }))}
                      style={{
                        padding: '9px 8px',
                        background: sel ? c.bg : 'var(--surface2)',
                        border: `1.5px solid ${sel ? c.color : 'var(--border)'}`,
                        borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 6,
                        transition: 'all var(--transition)',
                      }}
                    >
                      <span style={{ fontSize: 12, color: c.color }}>{c.icon}</span>
                      <span style={{ fontSize: 11, fontWeight: 500, color: sel ? c.color : 'var(--text2)', textAlign: 'left' }}>{c.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              className="primary-btn"
              disabled={form.impact.trim().length < 10}
              onClick={() => setStep(2)}
            >
              Continue →
            </button>
          </div>
        )}

        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label style={{ display: 'block', fontSize: 10, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text3)', marginBottom: 8 }}>
                What were you doing before? (optional)
              </label>
              <input
                className="text-input"
                style={{ marginBottom: 0 }}
                placeholder="The old pattern — what habit or behavior you replaced"
                value={form.fromPattern}
                onChange={e => setForm(f => ({ ...f, fromPattern: e.target.value }))}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 10, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text3)', marginBottom: 8 }}>
                What pattern did you add? (optional)
              </label>
              <input
                className="text-input"
                style={{ marginBottom: 0 }}
                placeholder="e.g. 25-min focus block, cold exposure, evening reflection"
                value={form.toPattern}
                onChange={e => setForm(f => ({ ...f, toPattern: e.target.value }))}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 10, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text3)', marginBottom: 10 }}>
                Domains involved
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                {DOMAINS.map(d => {
                  const dc = DOMAIN_CONFIG[d];
                  const sel = form.domain.includes(d);
                  return (
                    <button
                      key={d}
                      onClick={() => toggleDomain(d)}
                      style={{
                        flex: 1, padding: '10px 6px',
                        background: sel ? `${dc.color}15` : 'var(--surface2)',
                        border: `1.5px solid ${sel ? dc.color : 'var(--border)'}`,
                        borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                        fontSize: 11, fontWeight: 500, textTransform: 'capitalize',
                        color: sel ? dc.color : 'var(--text2)',
                        transition: 'all var(--transition)',
                      }}
                    >
                      {d}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 10, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text3)', marginBottom: 8 }}>
                Show as
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  className="text-input"
                  style={{ marginBottom: 0, flex: 1 }}
                  placeholder="First name (or leave blank for anonymous)"
                  value={form.authorName}
                  onChange={e => setForm(f => ({ ...f, authorName: e.target.value }))}
                  maxLength={30}
                />
              </div>
            </div>

            {error && (
              <p style={{ fontSize: 12, color: '#ff8c69', fontFamily: 'var(--font-mono)' }}>{error}</p>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setStep(1)}
                style={{ flex: 1, padding: 14, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text2)', cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14 }}
              >
                ← Back
              </button>
              <button
                className="primary-btn"
                style={{ flex: 2, opacity: loading ? 0.6 : 1 }}
                disabled={loading}
                onClick={handleSubmit}
              >
                {loading ? 'Sharing…' : 'Share your win →'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

// Maps each driver to the domains it's most associated with (for "For You" filtering)
const DRIVER_DOMAINS: Record<string, Domain[]> = {
  Vitality:    ['physical'],
  Clarity:     ['mental'],
  Mastery:     ['mental'],
  Meaning:     ['spiritual'],
  Freedom:     ['mental'],
  Connection:  ['spiritual'],
  Discipline:  ['physical', 'mental'],
  Creativity:  ['mental', 'spiritual'],
  Wisdom:      ['mental', 'spiritual'],
  Impact:      ['mental', 'spiritual'],
  Growth:      ['physical', 'mental'],
  Peace:       ['spiritual'],
};

const CATEGORY_FILTERS = ['for-you', 'all', ...Object.keys(CATEGORY_CONFIG)] as const;

type UserProfile = { name: string; drivers: string[]; commitment?: string };

export default function CommunityPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({ name: '', drivers: [] });
  const [realPosts, setRealPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('for-you');
  const [heartedIds, setHeartedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const s = loadState();
    if (!s.profile.onboarded) { router.replace('/'); return; }
    setProfile({
      name: s.profile.name,
      drivers: s.profile.values || [],
      commitment: s.profile.commitmentDeclaration,
    });

    // Load hearted posts from localStorage
    try {
      const saved = localStorage.getItem('trinitect_hearted');
      if (saved) setHeartedIds(new Set(JSON.parse(saved)));
    } catch { /* ignore */ }

    setMounted(true);

    // Fetch real community posts
    fetch('/api/community')
      .then(r => r.json())
      .then((data: { posts?: Post[] }) => {
        if (data.posts) setRealPosts(data.posts);
      })
      .catch(() => { /* network error, fallback to seeds */ })
      .finally(() => setLoadingPosts(false));
  }, [router]);

  const handleHeart = useCallback(async (post: Post) => {
    const key = post.postId;
    const alreadyHearted = heartedIds.has(key);
    const delta = alreadyHearted ? -1 : 1;

    // Optimistic update
    setRealPosts(prev => prev.map(p =>
      p.postId === key ? { ...p, hearts: p.hearts + delta, _hearted: !alreadyHearted } : p
    ));
    const next = new Set(heartedIds);
    if (alreadyHearted) next.delete(key); else next.add(key);
    setHeartedIds(next);
    localStorage.setItem('trinitect_hearted', JSON.stringify([...next]));

    // API call (fire and forget)
    fetch('/api/community/heart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pk: post.pk, sk: post.sk, delta }),
    }).catch(() => { /* no-op — optimistic stays */ });
  }, [heartedIds]);

  const handlePosted = useCallback((post: Post) => {
    setRealPosts(prev => [post, ...prev]);
    setShowModal(false);
  }, []);

  if (!mounted) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div style={{ width: 32, height: 32, border: '2px solid rgba(168,255,62,0.2)', borderTopColor: '#a8ff3e', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Annotate real posts with hearted state
  const annotatedPosts: Post[] = realPosts.map(p => ({
    ...p,
    _hearted: heartedIds.has(p.postId),
  }));

  // Derive the set of domains that match the user's drivers
  const userDomains = new Set<Domain>(
    profile.drivers.flatMap(d => DRIVER_DOMAINS[d] || [])
  );

  function matchesForYou(post: { domain: Domain[]; category: string }): boolean {
    if (userDomains.size === 0) return true;
    return post.domain.some(d => userDomains.has(d));
  }

  // Filter
  const filtered = categoryFilter === 'all'
    ? annotatedPosts
    : categoryFilter === 'for-you'
      ? annotatedPosts.filter(matchesForYou)
      : annotatedPosts.filter(p => p.category === categoryFilter);

  // Seed stories: show as editorial if fewer than 10 real posts
  const showSeeds = realPosts.length < 10;
  const filteredSeeds = categoryFilter === 'all'
    ? SEED_POSTS
    : categoryFilter === 'for-you'
      ? SEED_POSTS.filter(matchesForYou)
      : SEED_POSTS.filter(p => p.category === categoryFilter);

  const totalCount = realPosts.length + SEED_POSTS.length;

  return (
    <AppLayout activeHref="/community">
      <div style={{ maxWidth: 720 }}>

        {/* Header */}
        <div className="fade-up" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
            <div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text1)', lineHeight: 1.15 }}>
                Community
              </h1>
              <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 5, fontFamily: 'var(--font-mono)' }}>
                Real stories of patterns changing real lives.
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
                flexShrink: 0, marginLeft: 16,
              }}
            >
              + Share a win
            </button>
          </div>

          {/* User's drivers — show what's filtering their "For You" feed */}
          {profile.drivers.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 14 }}>
              <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text4)', textTransform: 'uppercase', letterSpacing: '0.1em', lineHeight: '24px', flexShrink: 0 }}>
                Your drivers
              </span>
              {profile.drivers.map(d => (
                <span key={d} style={{
                  padding: '3px 10px',
                  background: 'rgba(168,255,62,0.06)',
                  border: '1px solid rgba(168,255,62,0.15)',
                  borderRadius: 20,
                  fontSize: 10, fontWeight: 500,
                  color: 'rgba(168,255,62,0.7)',
                  fontFamily: 'var(--font-mono)',
                }}>
                  {d}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Filter bar */}
        <div className="fade-up fade-up-d1" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 24 }}>
          {CATEGORY_FILTERS.map(cat => {
            const isForYou = cat === 'for-you';
            const isAll = cat === 'all';
            const cfg = (!isForYou && !isAll) ? CATEGORY_CONFIG[cat] : null;
            const selected = categoryFilter === cat;
            return (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                style={{
                  padding: '6px 14px',
                  background: selected
                    ? (cfg ? cfg.bg : 'rgba(168,255,62,0.1)')
                    : 'var(--surface)',
                  border: `1px solid ${selected
                    ? (cfg ? cfg.color + '60' : 'rgba(168,255,62,0.4)')
                    : 'var(--border)'}`,
                  borderRadius: 20, cursor: 'pointer',
                  fontSize: 11, fontFamily: 'var(--font-mono)',
                  color: selected ? (cfg ? cfg.color : 'var(--physical)') : 'var(--text3)',
                  transition: 'all var(--transition)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                {isForYou ? 'For You' : isAll ? 'All' : cfg?.label}
              </button>
            );
          })}
        </div>

        {/* Feed */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {loadingPosts && (
            <div style={{ padding: '40px 0', textAlign: 'center' }}>
              <div style={{ width: 24, height: 24, border: '2px solid rgba(168,255,62,0.15)', borderTopColor: '#a8ff3e', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
              <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text4)' }}>loading stories…</span>
            </div>
          )}

          {!loadingPosts && filtered.length === 0 && !showSeeds && (
            <div style={{ padding: '40px 24px', textAlign: 'center', background: 'var(--surface)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 32, marginBottom: 16, opacity: 0.4 }}>⟡</div>
              <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>
                No stories in this category yet. Yours could be the first.
              </p>
            </div>
          )}

          {/* Real posts */}
          {filtered.map((post, i) => (
            <div key={post.postId} className={`fade-up fade-up-d${Math.min(i + 1, 5)}`}>
              <PostCard post={post} onHeart={handleHeart} />
            </div>
          ))}

          {/* Seed editorial stories */}
          {showSeeds && filteredSeeds.length > 0 && (
            <>
              {filtered.length > 0 && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '4px 0', margin: '4px 0',
                }}>
                  <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                  <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text4)', textTransform: 'uppercase', letterSpacing: '0.12em', whiteSpace: 'nowrap' }}>
                    Featured stories
                  </span>
                  <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                </div>
              )}
              {filteredSeeds.map((seed, i) => (
                <div key={i} className="fade-up">
                  <PostCard
                    post={{
                      ...seed,
                      pk: 'SEED',
                      sk: `seed-${i}`,
                      postId: `seed-${i}`,
                      _hearted: false,
                    }}
                    onHeart={() => {}}
                    seed
                  />
                </div>
              ))}
            </>
          )}
        </div>

        {/* CTA banner at bottom */}
        <div className="fade-up" style={{
          marginTop: 28,
          padding: '20px 22px',
          background: 'var(--accent-dim)',
          border: '1px solid rgba(168,255,62,0.15)',
          borderRadius: 'var(--radius)',
          display: 'flex', alignItems: 'center', gap: 16,
        }}>
          <div style={{ flex: 1 }}>
            {profile.commitment ? (
              <>
                <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--physical)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
                  Your commitment
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text1)', marginBottom: 4, fontFamily: 'var(--font-display)', lineHeight: 1.3 }}>
                  "{profile.commitment}"
                </div>
                <div style={{ fontSize: 11, color: 'var(--text3)', lineHeight: 1.5 }}>
                  When the pattern clicks, come back and share it. Your story might be what makes someone else commit.
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text1)', marginBottom: 4 }}>
                  Have a pattern that changed something for you?
                </div>
                <div style={{ fontSize: 11, color: 'var(--text3)', lineHeight: 1.5 }}>
                  Your story doesn't need to be dramatic. Small shifts matter — and someone else might be waiting to hear exactly yours.
                </div>
              </>
            )}
          </div>
          <button
            onClick={() => setShowModal(true)}
            style={{
              background: 'var(--physical)', color: 'var(--bg)',
              border: 'none', borderRadius: 'var(--radius-sm)',
              padding: '10px 16px', flexShrink: 0,
              fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13,
              cursor: 'pointer',
            }}
          >
            Share yours →
          </button>
        </div>

      </div>

      {showModal && (
        <LogWinModal
          profile={profile}
          onClose={() => setShowModal(false)}
          onPosted={handlePosted}
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
