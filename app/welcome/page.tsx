'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Welcome() {
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>('[data-reveal]');
    const obs = new IntersectionObserver(
      (entries) => entries.forEach(e => {
        if (e.isIntersecting) {
          (e.target as HTMLElement).classList.add('revealed');
          obs.unobserve(e.target);
        }
      }),
      { threshold: 0.08 }
    );
    els.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  return (
    <>
      <style>{`
        [data-reveal] {
          opacity: 0;
          transform: translateY(28px);
          transition: opacity 0.7s cubic-bezier(0.4,0,0.2,1), transform 0.7s cubic-bezier(0.4,0,0.2,1);
        }
        [data-reveal].revealed { opacity: 1; transform: none; }
        [data-reveal-delay="1"] { transition-delay: 0.1s; }
        [data-reveal-delay="2"] { transition-delay: 0.2s; }
        [data-reveal-delay="3"] { transition-delay: 0.35s; }
        [data-reveal-delay="4"] { transition-delay: 0.5s; }

        .lp-nav { position: fixed; top: 0; left: 0; right: 0; z-index: 100; display: flex; align-items: center; justify-content: space-between; padding: 20px 48px; background: rgba(7,8,15,0.85); backdrop-filter: blur(12px); border-bottom: 1px solid rgba(255,255,255,0.04); }
        .lp-logo { display: flex; align-items: center; gap: 10px; text-decoration: none; }
        .lp-logo-mark { width: 36px; height: 36px; background: linear-gradient(135deg, var(--physical) 0%, var(--mental) 100%); border-radius: 9px; display: flex; align-items: center; justify-content: center; font-family: var(--font-display); font-weight: 900; font-size: 18px; color: var(--bg); }
        .lp-wordmark { font-family: var(--font-display); font-size: 13px; font-weight: 700; color: var(--text2); letter-spacing: 0.12em; text-transform: uppercase; }
        .lp-signin { font-family: var(--font-mono); font-size: 11px; color: var(--text3); text-decoration: none; letter-spacing: 0.08em; transition: color 0.2s; }
        .lp-signin:hover { color: var(--text1); }

        .hero { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 120px 24px 80px; position: relative; overflow: hidden; }
        .hero-glow { position: absolute; border-radius: 50%; filter: blur(120px); pointer-events: none; }
        .hero-glow-1 { width: 500px; height: 500px; background: rgba(168,255,62,0.06); top: -100px; left: -150px; }
        .hero-glow-2 { width: 400px; height: 400px; background: rgba(56,217,245,0.05); top: 20%; right: -100px; }
        .hero-glow-3 { width: 350px; height: 350px; background: rgba(212,160,255,0.04); bottom: 0; left: 30%; }
        .hero-eyebrow { display: flex; align-items: center; gap: 16px; margin-bottom: 32px; }
        .eyebrow-dot { width: 6px; height: 6px; border-radius: 50%; }
        .eyebrow-text { font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--text3); }
        .hero h1 { font-family: var(--font-display); font-size: clamp(42px, 7vw, 78px); font-weight: 800; line-height: 1.08; letter-spacing: -0.03em; color: var(--text1); max-width: 900px; margin-bottom: 28px; }
        .hero h1 em { font-style: normal; background: linear-gradient(90deg, var(--physical), var(--mental)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .hero-sub { font-family: var(--font-body); font-size: 18px; color: var(--text2); max-width: 520px; line-height: 1.7; margin-bottom: 48px; }
        .hero-cta { display: inline-flex; align-items: center; gap: 8px; background: var(--physical); color: var(--bg); font-family: var(--font-display); font-size: 15px; font-weight: 700; padding: 16px 36px; border-radius: 40px; text-decoration: none; letter-spacing: 0.01em; transition: all 0.22s cubic-bezier(0.4,0,0.2,1); box-shadow: 0 0 0 0 rgba(168,255,62,0.4); }
        .hero-cta:hover { transform: translateY(-2px); box-shadow: 0 0 40px rgba(168,255,62,0.25); }
        .hero-scroll { position: absolute; bottom: 40px; left: 50%; transform: translateX(-50%); display: flex; flex-direction: column; align-items: center; gap: 8px; }
        .scroll-line { width: 1px; height: 40px; background: linear-gradient(to bottom, transparent, var(--border-hover)); animation: scrollPulse 2s ease infinite; }
        @keyframes scrollPulse { 0%,100% { opacity: 0.3; } 50% { opacity: 1; } }

        .section { padding: 100px 24px; }
        .section-inner { max-width: 1080px; margin: 0 auto; }
        .section-label { font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--text4); margin-bottom: 20px; }
        .section-h2 { font-family: var(--font-display); font-size: clamp(32px, 5vw, 54px); font-weight: 800; line-height: 1.1; letter-spacing: -0.03em; color: var(--text1); }
        .section-sub { font-size: 17px; color: var(--text2); line-height: 1.75; max-width: 620px; margin-top: 20px; }

        .truth-section { background: var(--surface); border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); }
        .truth-inner { max-width: 1080px; margin: 0 auto; display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: center; }
        .truth-quote { font-family: var(--font-display); font-size: clamp(24px, 3.5vw, 40px); font-weight: 700; line-height: 1.2; letter-spacing: -0.02em; color: var(--text1); }
        .truth-quote span { color: var(--physical); }
        .truth-blocks { display: flex; flex-direction: column; gap: 20px; }
        .truth-block { padding: 18px 20px; border-radius: var(--radius-sm); border-left: 2px solid; }
        .truth-block-label { font-family: var(--font-mono); font-size: 9px; letter-spacing: 0.16em; text-transform: uppercase; margin-bottom: 6px; }
        .truth-block p { font-size: 13px; color: var(--text2); line-height: 1.6; }

        .pillars-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2px; margin-top: 64px; }
        .pillar { padding: 40px 32px; background: var(--surface); position: relative; overflow: hidden; }
        .pillar::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; }
        .pillar-physical::before { background: var(--physical); }
        .pillar-mental::before { background: var(--mental); }
        .pillar-spiritual::before { background: var(--spiritual); }
        .pillar-glow { position: absolute; top: -40px; right: -40px; width: 200px; height: 200px; border-radius: 50%; filter: blur(80px); opacity: 0.08; pointer-events: none; }
        .pillar-name { font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; margin-bottom: 16px; }
        .pillar h3 { font-family: var(--font-display); font-size: 24px; font-weight: 700; letter-spacing: -0.02em; color: var(--text1); margin-bottom: 14px; line-height: 1.2; }
        .pillar p { font-size: 13px; color: var(--text2); line-height: 1.7; margin-bottom: 24px; }
        .pillar-examples { display: flex; flex-direction: column; gap: 6px; }
        .pillar-example { display: flex; align-items: center; gap: 8px; font-family: var(--font-mono); font-size: 10px; color: var(--text3); letter-spacing: 0.04em; }
        .pillar-example::before { content: ''; width: 4px; height: 4px; border-radius: 50%; flex-shrink: 0; }

        .steps-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 48px; margin-top: 64px; position: relative; }
        .steps-grid::before { content: ''; position: absolute; top: 28px; left: 10%; right: 10%; height: 1px; background: linear-gradient(to right, transparent, var(--border-hover), var(--border-hover), transparent); pointer-events: none; }
        .step { text-align: center; }
        .step-num { width: 56px; height: 56px; border-radius: 50%; border: 1px solid var(--border-hover); display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; font-family: var(--font-display); font-size: 20px; font-weight: 800; color: var(--text1); position: relative; background: var(--bg); }
        .step h4 { font-family: var(--font-display); font-size: 18px; font-weight: 700; color: var(--text1); margin-bottom: 10px; letter-spacing: -0.01em; }
        .step p { font-size: 13px; color: var(--text2); line-height: 1.7; }
        .step p em { font-style: normal; color: var(--text1); }

        .pattern-section { background: var(--surface); border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); padding: 80px 24px; text-align: center; }
        .pattern-big { font-family: var(--font-display); font-size: clamp(28px, 4.5vw, 52px); font-weight: 800; line-height: 1.15; letter-spacing: -0.03em; color: var(--text1); max-width: 700px; margin: 0 auto 20px; }
        .pattern-big span { color: var(--physical); }
        .pattern-sub { font-size: 15px; color: var(--text3); font-family: var(--font-mono); letter-spacing: 0.04em; }

        .foundation-inner { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: center; }
        .foundation-visual { }
        .foundation-bar-label { font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--text4); margin-bottom: 16px; }
        .foundation-days { display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; }
        .foundation-day { height: 32px; border-radius: 4px; }
        .foundation-day.done { background: var(--physical); opacity: 0.9; }
        .foundation-day.partial { background: linear-gradient(to right, var(--physical) 60%, rgba(168,255,62,0.15)); }
        .foundation-day.empty { background: var(--surface2); border: 1px solid var(--border); }
        .foundation-count { margin-top: 16px; font-family: var(--font-display); font-size: 42px; font-weight: 800; letter-spacing: -0.04em; color: var(--text1); }
        .foundation-count span { font-size: 16px; color: var(--text3); font-family: var(--font-mono); font-weight: 400; letter-spacing: 0.04em; margin-left: 6px; }

        .final-cta { text-align: center; padding: 120px 24px; position: relative; overflow: hidden; }
        .final-cta-glow { position: absolute; width: 600px; height: 600px; background: rgba(168,255,62,0.04); border-radius: 50%; filter: blur(100px); top: 50%; left: 50%; transform: translate(-50%,-50%); pointer-events: none; }
        .final-h2 { font-family: var(--font-display); font-size: clamp(36px, 6vw, 66px); font-weight: 800; letter-spacing: -0.03em; line-height: 1.1; color: var(--text1); margin-bottom: 16px; }
        .final-sub { font-size: 15px; color: var(--text3); font-family: var(--font-mono); margin-bottom: 48px; }
        .final-cta-links { display: flex; flex-direction: column; align-items: center; gap: 16px; }
        .final-cta-secondary { font-family: var(--font-mono); font-size: 11px; color: var(--text4); text-decoration: none; letter-spacing: 0.06em; transition: color 0.2s; }
        .final-cta-secondary:hover { color: var(--text2); }

        .lp-footer { border-top: 1px solid var(--border); padding: 32px 48px; display: flex; align-items: center; justify-content: space-between; }
        .lp-footer-copy { font-family: var(--font-mono); font-size: 10px; color: var(--text4); letter-spacing: 0.08em; }

        @media (max-width: 768px) {
          .lp-nav { padding: 16px 20px; }
          .truth-inner { grid-template-columns: 1fr; gap: 48px; }
          .pillars-grid { grid-template-columns: 1fr; }
          .steps-grid { grid-template-columns: 1fr; gap: 36px; }
          .steps-grid::before { display: none; }
          .foundation-inner { grid-template-columns: 1fr; gap: 48px; }
          .lp-footer { flex-direction: column; gap: 12px; text-align: center; }
        }
      `}</style>

      {/* Nav */}
      <nav className="lp-nav">
        <Link href="/" className="lp-logo">
          <div className="lp-logo-mark">T</div>
          <span className="lp-wordmark">Trinitect</span>
        </Link>
        <Link href="/login" className="lp-signin">Sign in →</Link>
      </nav>

      {/* Hero */}
      <section className="hero">
        <div className="hero-glow hero-glow-1" />
        <div className="hero-glow hero-glow-2" />
        <div className="hero-glow hero-glow-3" />

        <div className="hero-eyebrow" data-reveal>
          <span className="eyebrow-dot" style={{ background: 'var(--physical)' }} />
          <span className="eyebrow-text">Physical</span>
          <span className="eyebrow-dot" style={{ background: 'var(--mental)' }} />
          <span className="eyebrow-text">Mental</span>
          <span className="eyebrow-dot" style={{ background: 'var(--spiritual)' }} />
          <span className="eyebrow-text">Spiritual</span>
        </div>

        <h1 data-reveal data-reveal-delay="1">
          Your body, mind, and spirit<br />
          are <em>not separate projects.</em>
        </h1>

        <p className="hero-sub" data-reveal data-reveal-delay="2">
          Most programs target one system at a time and wonder why the gains don't hold.
          Trinitect connects all three — because that's how they actually work.
        </p>

        <Link href="/start" className="hero-cta" data-reveal data-reveal-delay="3">
          Begin your foundation →
        </Link>

        <div className="hero-scroll">
          <div className="scroll-line" />
        </div>
      </section>

      {/* The Honest Truth */}
      <section className="section truth-section">
        <div className="truth-inner">
          <div data-reveal>
            <div className="section-label">The honest truth</div>
            <div className="truth-quote">
              Most self-improvement fails not because people lack willpower — but because they're solving the wrong <span>scope.</span>
            </div>
          </div>
          <div className="truth-blocks" data-reveal data-reveal-delay="2">
            <div className="truth-block" style={{ background: 'rgba(168,255,62,0.04)', borderColor: 'rgba(168,255,62,0.3)' }}>
              <div className="truth-block-label" style={{ color: 'var(--physical)' }}>Body without mind</div>
              <p>Physical discipline that burns out without mental clarity to sustain it.</p>
            </div>
            <div className="truth-block" style={{ background: 'rgba(56,217,245,0.04)', borderColor: 'rgba(56,217,245,0.3)' }}>
              <div className="truth-block-label" style={{ color: 'var(--mental)' }}>Mind without spirit</div>
              <p>Hyper-productive thinking that feels empty without a sense of direction or meaning.</p>
            </div>
            <div className="truth-block" style={{ background: 'rgba(212,160,255,0.04)', borderColor: 'rgba(212,160,255,0.3)' }}>
              <div className="truth-block-label" style={{ color: 'var(--spiritual)' }}>Spirit without body</div>
              <p>A rich inner life that can't execute — because the energy and focus aren't there.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Three Pillars */}
      <section className="section" style={{ paddingBottom: 0 }}>
        <div className="section-inner">
          <div data-reveal>
            <div className="section-label">The three pillars</div>
            <h2 className="section-h2">Everything in your life runs through one of these.</h2>
            <p className="section-sub">
              Trinitect gives you one practice per pillar, every day. Three patterns. Fifteen to thirty minutes. That's the whole commitment.
            </p>
          </div>
        </div>
        <div style={{ maxWidth: 1080, margin: '0 auto', padding: '0 24px' }}>
          <div className="pillars-grid" data-reveal data-reveal-delay="1">
            {/* Physical */}
            <div className="pillar pillar-physical">
              <div className="pillar-glow" style={{ background: 'var(--physical)' }} />
              <div className="pillar-name" style={{ color: 'var(--physical)' }}>Physical</div>
              <h3>Movement. Recovery. Fuel.</h3>
              <p>
                Your energy is the substrate of everything else. When the body is neglected, focus fades, mood drops, and purpose feels distant. Trinitect keeps physical practice in the equation — not as an add-on, but as a foundation.
              </p>
              <div className="pillar-examples">
                <div className="pillar-example" style={{ '--dot-color': 'var(--physical)' } as React.CSSProperties}>
                  <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--physical)', opacity: 0.6, flexShrink: 0 }} />
                  Morning movement block
                </div>
                <div className="pillar-example">
                  <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--physical)', opacity: 0.6, flexShrink: 0 }} />
                  Cold exposure or breathwork
                </div>
                <div className="pillar-example">
                  <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--physical)', opacity: 0.6, flexShrink: 0 }} />
                  Nutrition window practice
                </div>
              </div>
            </div>

            {/* Mental */}
            <div className="pillar pillar-mental">
              <div className="pillar-glow" style={{ background: 'var(--mental)' }} />
              <div className="pillar-name" style={{ color: 'var(--mental)' }}>Mental</div>
              <h3>Focus. Learning. Clarity.</h3>
              <p>
                Your mind is the lens through which everything passes. The quality of your thinking shapes every decision, every relationship, every goal. Trinitect trains the lens — not just the task list.
              </p>
              <div className="pillar-examples">
                <div className="pillar-example">
                  <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--mental)', opacity: 0.6, flexShrink: 0 }} />
                  Deep work block
                </div>
                <div className="pillar-example">
                  <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--mental)', opacity: 0.6, flexShrink: 0 }} />
                  Evening reflection journal
                </div>
                <div className="pillar-example">
                  <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--mental)', opacity: 0.6, flexShrink: 0 }} />
                  No-screen wind-down
                </div>
              </div>
            </div>

            {/* Spiritual */}
            <div className="pillar pillar-spiritual">
              <div className="pillar-glow" style={{ background: 'var(--spiritual)' }} />
              <div className="pillar-name" style={{ color: 'var(--spiritual)' }}>Spiritual</div>
              <h3>Purpose. Meaning. Alignment.</h3>
              <p>
                Not religion. Not ritual. The felt sense that what you're doing matters — that you're pointed toward something real. Without it, even peak performance feels hollow. Trinitect keeps that signal alive.
              </p>
              <div className="pillar-examples">
                <div className="pillar-example">
                  <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--spiritual)', opacity: 0.6, flexShrink: 0 }} />
                  Morning gratitude practice
                </div>
                <div className="pillar-example">
                  <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--spiritual)', opacity: 0.6, flexShrink: 0 }} />
                  Values alignment check-in
                </div>
                <div className="pillar-example">
                  <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--spiritual)', opacity: 0.6, flexShrink: 0 }} />
                  Intentional silence
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="section">
        <div className="section-inner">
          <div data-reveal>
            <div className="section-label">How it works</div>
            <h2 className="section-h2">Three steps. Then just the practice.</h2>
          </div>
          <div className="steps-grid">
            <div className="step" data-reveal data-reveal-delay="1">
              <div className="step-num" style={{ borderColor: 'rgba(168,255,62,0.3)', color: 'var(--physical)' }}>1</div>
              <h4>Tell us your drivers</h4>
              <p>
                What actually matters to you? <em>Vitality. Mastery. Freedom. Connection.</em> Twelve options. Your answers shape every pattern we generate — nothing is generic.
              </p>
            </div>
            <div className="step" data-reveal data-reveal-delay="2">
              <div className="step-num" style={{ borderColor: 'rgba(56,217,245,0.3)', color: 'var(--mental)' }}>2</div>
              <h4>Receive three daily patterns</h4>
              <p>
                One physical. One mental. One spiritual. Built around what drives you. Not a generic routine — a personalized structure for <em>your</em> specific life.
              </p>
            </div>
            <div className="step" data-reveal data-reveal-delay="3">
              <div className="step-num" style={{ borderColor: 'rgba(212,160,255,0.3)', color: 'var(--spiritual)' }}>3</div>
              <h4>Complete. Reflect. Repeat.</h4>
              <p>
                That's it. No streaks to chase. No gamification. Just the daily practice of becoming <em>who you said you wanted to be.</em>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pattern ≠ Habit */}
      <section className="pattern-section">
        <div data-reveal>
          <div className="section-label" style={{ marginBottom: 28 }}>A word on language</div>
          <div className="pattern-big">
            We call them <span>patterns,</span> not habits.
          </div>
          <p className="pattern-sub" style={{ marginTop: 16 }}>
            A habit is something you do. A pattern is something you become. The distinction matters.
          </p>
        </div>
      </section>

      {/* The 21-Day Foundation */}
      <section className="section">
        <div className="section-inner">
          <div className="foundation-inner">
            <div data-reveal>
              <div className="section-label">The foundation</div>
              <h2 className="section-h2">Twenty-one days. All three pillars. Every day.</h2>
              <p className="section-sub">
                The neuroscience is clear: 21 days of consistent, intentional action begins restructuring neural pathways. Most programs never reach that window because they rely on willpower alone.
              </p>
              <p style={{ fontSize: 15, color: 'var(--text3)', lineHeight: 1.75, marginTop: 20 }}>
                Trinitect builds a structure around this window. Not a streak — a foundation. At day 21, something has shifted. Not just behavior. Identity.
              </p>
            </div>
            <div className="foundation-visual" data-reveal data-reveal-delay="2">
              <div className="foundation-bar-label">Foundation Progress</div>
              <div className="foundation-days">
                {Array.from({ length: 21 }).map((_, i) => (
                  <div
                    key={i}
                    className={`foundation-day ${i < 11 ? 'done' : i === 11 ? 'partial' : 'empty'}`}
                    style={i < 11 ? { opacity: 0.6 + (i / 11) * 0.4 } : {}}
                  />
                ))}
              </div>
              <div className="foundation-count">
                11 <span>of 21 full days</span>
              </div>
              <p style={{ marginTop: 12, fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text4)', letterSpacing: '0.04em' }}>
                10 days to Foundation complete
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="final-cta">
        <div className="final-cta-glow" />
        <div data-reveal>
          <div className="section-label" style={{ marginBottom: 20 }}>Ready when you are</div>
          <h2 className="final-h2">
            The life you want<br />is a pattern problem.
          </h2>
          <p className="final-sub">Free to begin. No card required.</p>
          <div className="final-cta-links">
            <Link href="/start" className="hero-cta">
              Start your foundation →
            </Link>
            <Link href="/login" className="final-cta-secondary">
              Already have an account? Sign in →
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="lp-footer">
        <div className="lp-footer-copy">© 2026 Trinitect · Built for the intentional</div>
        <div className="lp-footer-copy">Physical · Mental · Spiritual</div>
      </footer>
    </>
  );
}
