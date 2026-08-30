'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getToken } from '@/lib/api-client';
import AccountGateModal from '@/components/AccountGateModal';

const FEATURES_FREE = [
  '2 daily actions (physical + mental)',
  'Domain balance rings',
  '7-day streak tracking',
  '1 active stage goal',
  'Progress saved to your account',
];

const FEATURES_PRO = [
  'All 3 domains — physical, mental, spiritual',
  'AI-personalized daily patterns',
  'SMS daily reminders & milestone alerts',
  'Unlimited stage goals + bucket list',
  'Pattern awareness engine',
  'Full progress analytics',
  'Personal playbook export',
  'Priority support',
];

export default function Pricing() {
  const router = useRouter();
  const [interval, setInterval] = useState<'monthly' | 'annual'>('monthly');
  const [loading, setLoading] = useState(false);
  const [showAuthGate, setShowAuthGate] = useState(false);

  async function doCheckout() {
    setLoading(true);
    setShowAuthGate(false);
    try {
      const token = getToken();
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ interval }),
      });
      const { url, error } = await res.json();
      if (error) throw new Error(error);
      window.location.href = url;
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  }

  function handleUpgrade() {
    const token = getToken();
    if (!token) {
      setShowAuthGate(true);
      return;
    }
    doCheckout();
  }

  const monthlyEquiv = interval === 'annual' ? '$6.58' : '$8.99';
  const billedNote = interval === 'annual' ? 'Billed $79 / year — save $28' : 'Billed monthly, cancel anytime';

  return (
    <>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px' }}>

        {/* Back */}
        <button
          onClick={() => router.back()}
          style={{ position: 'absolute', top: 24, left: 24, background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 13, fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          ← back
        </button>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 40, maxWidth: 480 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--accent-dim)', border: '1px solid rgba(168,255,62,0.2)', borderRadius: 20, padding: '4px 14px', marginBottom: 20 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--physical)', animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--physical)', letterSpacing: '0.08em' }}>TRINITECT PRO</span>
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 42, fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--text1)', lineHeight: 1.05, marginBottom: 12 }}>
            Build a life<br />that compounds.
          </h1>
          <p style={{ fontSize: 15, color: 'var(--text2)', lineHeight: 1.65 }}>
            It's the pattern, not the person. Small, consistent patterns across three domains compound into the version of your life you actually want.
          </p>
        </div>

        {/* Interval toggle */}
        <div style={{ display: 'flex', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 4, marginBottom: 32, gap: 4 }}>
          {(['monthly', 'annual'] as const).map(iv => (
            <button
              key={iv}
              onClick={() => setInterval(iv)}
              style={{
                padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer',
                background: interval === iv ? 'var(--physical)' : 'none',
                color: interval === iv ? 'var(--bg)' : 'var(--text2)',
                fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13,
                transition: 'all var(--transition)',
                position: 'relative',
              }}
            >
              {iv === 'annual' ? 'Annual' : 'Monthly'}
              {iv === 'annual' && (
                <span style={{ position: 'absolute', top: -10, right: -6, background: 'var(--metaphysical)', color: 'var(--bg)', fontSize: 8, fontWeight: 800, padding: '2px 5px', borderRadius: 8, fontFamily: 'var(--font-mono)' }}>
                  SAVE 27%
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, width: '100%', maxWidth: 640, marginBottom: 32 }}>

          {/* Free */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 24 }}>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text3)', marginBottom: 6 }}>Foundation</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 800, color: 'var(--text1)', lineHeight: 1 }}>Free</div>
              <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>Always free, no card needed</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
              {FEATURES_FREE.map(f => (
                <div key={f} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span style={{ color: 'var(--text3)', fontSize: 13, lineHeight: 1.4, marginTop: 1 }}>○</span>
                  <span style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.4 }}>{f}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => router.push('/dashboard')}
              style={{ width: '100%', padding: '12px', background: 'none', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text2)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
            >
              Continue free
            </button>
          </div>

          {/* Pro */}
          <div style={{ background: 'var(--surface)', border: '1px solid rgba(168,255,62,0.35)', borderRadius: 'var(--radius)', padding: 24, position: 'relative', overflow: 'hidden' }}>
            {/* Top glow bar */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, var(--physical), var(--mental))', borderRadius: '14px 14px 0 0' }} />

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--physical)', marginBottom: 6 }}>Architect · Pro</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 800, color: 'var(--text1)', lineHeight: 1 }}>{monthlyEquiv}</span>
                <span style={{ fontSize: 12, color: 'var(--text3)' }}>/mo</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4, fontFamily: 'var(--font-mono)' }}>{billedNote}</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
              {FEATURES_PRO.map(f => (
                <div key={f} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span style={{ color: 'var(--physical)', fontSize: 13, lineHeight: 1.4, marginTop: 1 }}>✓</span>
                  <span style={{ fontSize: 13, color: 'var(--text1)', lineHeight: 1.4 }}>{f}</span>
                </div>
              ))}
            </div>

            <button
              onClick={handleUpgrade}
              disabled={loading}
              style={{
                width: '100%', padding: '14px',
                background: loading ? 'rgba(168,255,62,0.5)' : 'var(--physical)',
                border: 'none', borderRadius: 'var(--radius-sm)',
                fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15,
                color: 'var(--bg)', cursor: loading ? 'default' : 'pointer',
                letterSpacing: '-0.01em', transition: 'opacity var(--transition)',
              }}
            >
              {loading ? 'Redirecting to Stripe…' : `Start Pro${interval === 'annual' ? ' — Best Value' : ''} →`}
            </button>
          </div>
        </div>

        <p style={{ fontSize: 11, color: 'var(--text3)', textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
          Secured by Stripe · Cancel anytime · No hidden fees
        </p>
      </div>

      {showAuthGate && (
        <AccountGateModal
          onAuthed={() => doCheckout()}
          onClose={() => setShowAuthGate(false)}
        />
      )}
    </>
  );
}
