'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { requestOTP, verifyOTP, setToken, clearToken } from '@/lib/api-client';
import { hydrateFromServer } from '@/lib/store';

type Step = 'phone' | 'code';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendCountdown, setResendCountdown] = useState(0);
  const codeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (resendCountdown <= 0) return;
    const t = setTimeout(() => setResendCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCountdown]);

  useEffect(() => {
    if (step === 'code') codeRef.current?.focus();
  }, [step]);

  function formatPhone(raw: string): string {
    const digits = raw.replace(/\D/g, '').slice(0, 10);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  function e164(formatted: string): string {
    const digits = formatted.replace(/\D/g, '');
    return digits.length === 10 ? `+1${digits}` : '';
  }

  async function handleSendCode() {
    const e164Phone = e164(phone);
    if (!e164Phone) { setError('Enter a valid 10-digit US phone number.'); return; }
    setError('');
    setLoading(true);
    try {
      await requestOTP(e164Phone);
      setStep('code');
      setResendCountdown(30);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send code. Try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify() {
    if (code.length !== 6) { setError('Enter the 6-digit code.'); return; }
    setError('');
    setLoading(true);
    try {
      const e164Phone = e164(phone);
      const { token } = await verifyOTP(e164Phone, code);
      setToken(token as string);
      await hydrateFromServer();
      const next = searchParams.get('next') || '/today';
      router.replace(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Incorrect code. Try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (resendCountdown > 0) return;
    setCode('');
    setError('');
    setLoading(true);
    try {
      await requestOTP(e164(phone));
      setResendCountdown(30);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not resend. Try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      padding: '36px 32px',
    }}>
      {step === 'phone' && (
        <>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text1)', marginBottom: 8 }}>
            Welcome back.
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text3)', fontFamily: 'var(--font-mono)', marginBottom: 28, lineHeight: 1.6 }}>
            Enter your phone number and we'll send a verification code.
          </p>

          <label style={{ display: 'block', fontSize: 10, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text3)', marginBottom: 8 }}>
            Phone number
          </label>
          <input
            className="text-input"
            style={{ marginBottom: error ? 8 : 20, fontSize: 18, letterSpacing: '0.04em' }}
            type="tel"
            placeholder="(555) 000-0000"
            value={phone}
            onChange={e => { setPhone(formatPhone(e.target.value)); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && handleSendCode()}
            autoFocus
          />

          {error && <div style={{ fontSize: 11, color: '#ff8c69', fontFamily: 'var(--font-mono)', marginBottom: 16 }}>{error}</div>}

          <button className="primary-btn" disabled={loading || e164(phone).length !== 12} onClick={handleSendCode}>
            {loading ? 'Sending…' : 'Send code →'}
          </button>

          <div style={{ marginTop: 20, textAlign: 'center' }}>
            <button
              onClick={() => router.push('/')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text4)', letterSpacing: '0.06em' }}
            >
              New here? Create an account →
            </button>
          </div>

          <div style={{
            marginTop: 24,
            padding: '14px 16px',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
          }}>
            <div>
              <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text2)', fontWeight: 500, letterSpacing: '0.04em' }}>
                Can't get in?
              </div>
              <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text4)', marginTop: 2 }}>
                Clear your data and start over
              </div>
            </div>
            <button
              onClick={() => {
                clearToken();
                localStorage.clear();
                fetch('/api/auth/logout', { method: 'POST' }).finally(() => router.replace('/'));
              }}
              style={{
                background: 'none',
                border: '1px solid var(--border)',
                borderRadius: 7,
                padding: '6px 14px',
                fontSize: 11, fontFamily: 'var(--font-mono)',
                color: 'var(--text3)',
                cursor: 'pointer',
                letterSpacing: '0.04em',
                flexShrink: 0,
                transition: 'all var(--transition)',
              }}
              onMouseOver={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--text3)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text1)'; }}
              onMouseOut={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text3)'; }}
            >
              Reset →
            </button>
          </div>
        </>
      )}

      {step === 'code' && (
        <>
          <button
            onClick={() => { setStep('phone'); setCode(''); setError(''); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text4)', padding: 0, marginBottom: 20, letterSpacing: '0.06em' }}
          >
            ← Change number
          </button>

          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text1)', marginBottom: 8 }}>
            Check your phone.
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text3)', fontFamily: 'var(--font-mono)', marginBottom: 6, lineHeight: 1.6 }}>
            We sent a 6-digit code to
          </p>
          <p style={{ fontSize: 14, color: 'var(--physical)', fontFamily: 'var(--font-mono)', fontWeight: 600, marginBottom: 28 }}>
            {phone}
          </p>

          <label style={{ display: 'block', fontSize: 10, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text3)', marginBottom: 8 }}>
            Verification code
          </label>
          <input
            ref={codeRef}
            className="text-input"
            style={{ marginBottom: error ? 8 : 20, fontSize: 24, letterSpacing: '0.3em', textAlign: 'center', fontFamily: 'var(--font-mono)' }}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            placeholder="——————"
            value={code}
            onChange={e => { setCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && handleVerify()}
          />

          {error && <div style={{ fontSize: 11, color: '#ff8c69', fontFamily: 'var(--font-mono)', marginBottom: 16 }}>{error}</div>}

          <button className="primary-btn" disabled={loading || code.length !== 6} onClick={handleVerify}>
            {loading ? 'Verifying…' : 'Verify →'}
          </button>

          <div style={{ marginTop: 16, textAlign: 'center' }}>
            <button
              onClick={handleResend}
              disabled={resendCountdown > 0}
              style={{ background: 'none', border: 'none', cursor: resendCountdown > 0 ? 'default' : 'pointer', fontSize: 11, fontFamily: 'var(--font-mono)', color: resendCountdown > 0 ? 'var(--text4)' : 'var(--mental)', letterSpacing: '0.06em' }}
            >
              {resendCountdown > 0 ? `Resend in ${resendCountdown}s` : 'Resend code'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 20px',
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{
            width: 44, height: 44,
            background: 'linear-gradient(135deg, var(--physical) 0%, var(--mental) 100%)',
            borderRadius: 12,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 22, color: 'var(--bg)',
            margin: '0 auto 16px',
          }}>T</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 600, color: 'var(--text3)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Trinitect</div>
        </div>

        <Suspense fallback={
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '36px 32px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
            <div style={{ width: 24, height: 24, border: '2px solid rgba(168,255,62,0.2)', borderTopColor: '#a8ff3e', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          </div>
        }>
          <LoginForm />
        </Suspense>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
