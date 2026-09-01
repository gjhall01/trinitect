'use client';

import { useState, useRef, useEffect } from 'react';
import type { Action } from '@/lib/types';

const DOMAIN_COLOR: Record<string, string> = {
  physical:  'var(--physical)',
  mental:    'var(--mental)',
  spiritual: 'var(--spiritual)',
};

export default function ActionCard({
  action,
  onComplete,
  goalBadge,
}: {
  action: Action;
  onComplete: (id: string, reflection?: { question: string; response: string }) => void;
  goalBadge?: { goalTitle: string; matchedThemes: string[] };
}) {
  const [showWhy, setShowWhy] = useState(false);
  const [showReflect, setShowReflect] = useState(false);
  const [reflectionText, setReflectionText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const color = DOMAIN_COLOR[action.domain] || 'var(--physical)';

  useEffect(() => {
    if (showReflect && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [showReflect]);

  function handleCompleteClick() {
    if (action.completed) return;
    if (action.reflection) {
      setShowReflect(true);
      setShowWhy(false);
    } else {
      onComplete(action.id);
    }
  }

  function handleSubmitReflection() {
    const response = reflectionText.trim();
    onComplete(action.id, response && action.reflection
      ? { question: action.reflection, response }
      : undefined
    );
    setShowReflect(false);
  }

  function handleSkipReflection() {
    onComplete(action.id);
    setShowReflect(false);
  }

  return (
    <div
      className={`action-card ${action.completed ? 'completed' : ''}`}
      data-domain={action.domain}
    >
      <div className="action-body">
        <div className="action-title">{action.title}</div>
        <div className="action-meta">
          <span className="action-tag" data-domain={action.domain}>
            {action.domain}
          </span>
          <span className="action-duration">{action.duration} min</span>
        </div>

        {goalBadge && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            marginTop: 6,
            fontSize: 9, fontFamily: 'var(--font-mono)', letterSpacing: '0.06em',
            color: 'var(--text3)',
          }}>
            <span style={{ color, opacity: 0.7 }}>◆</span>
            <span>For your {goalBadge.goalTitle} goal</span>
            {goalBadge.matchedThemes.length > 0 && (
              <span style={{ color: 'var(--text4)' }}>· builds {goalBadge.matchedThemes.slice(0, 2).join(' + ')}</span>
            )}
          </div>
        )}

        {/* Why this? — opt-in, hidden by default */}
        {!showReflect && (
          <button
            onClick={e => { e.stopPropagation(); setShowWhy(w => !w); }}
            style={{
              background: 'none', border: 'none',
              padding: '5px 0 0', margin: 0,
              fontSize: 10, fontFamily: 'var(--font-mono)',
              color: showWhy ? color : 'var(--text3)',
              cursor: 'pointer', letterSpacing: '0.06em',
              display: 'flex', alignItems: 'center', gap: 5,
              transition: 'color var(--transition)',
            }}
          >
            <span style={{ fontSize: 8 }}>{showWhy ? '▲' : '▼'}</span>
            WHY THIS?
          </button>
        )}

        {showWhy && !showReflect && (
          <div style={{
            marginTop: 10,
            padding: '12px 14px',
            background: 'var(--surface2)',
            borderRadius: 'var(--radius-sm)',
            borderLeft: `2px solid ${color}50`,
            animation: 'fadeIn 0.18s ease both',
          }}>
            {action.reflection && (
              <p style={{
                fontSize: 12, color: 'var(--text1)',
                fontStyle: 'italic', lineHeight: 1.6,
                marginBottom: 10,
              }}>
                {action.reflection}
              </p>
            )}
            <p style={{
              fontSize: 10, color: 'var(--text3)',
              fontFamily: 'var(--font-mono)', lineHeight: 1.5,
              borderTop: action.reflection ? '1px solid var(--border)' : 'none',
              paddingTop: action.reflection ? 8 : 0,
            }}>
              {action.benefit}
            </p>
          </div>
        )}

        {/* Inline reflection prompt — slides in after marking complete */}
        {showReflect && !action.completed && (
          <div style={{
            marginTop: 14,
            padding: '14px 16px',
            background: `${color}08`,
            border: `1px solid ${color}25`,
            borderRadius: 'var(--radius-sm)',
            animation: 'slideDown 0.22s cubic-bezier(0.4,0,0.2,1) both',
          }}>
            <div style={{
              fontSize: 9, fontFamily: 'var(--font-mono)', textTransform: 'uppercase',
              letterSpacing: '0.12em', color, marginBottom: 8,
            }}>
              Before you move on
            </div>
            <p style={{
              fontSize: 12, color: 'var(--text1)', fontStyle: 'italic',
              lineHeight: 1.65, marginBottom: 12,
            }}>
              {action.reflection}
            </p>
            <textarea
              ref={textareaRef}
              value={reflectionText}
              onChange={e => setReflectionText(e.target.value)}
              placeholder="Your thoughts… (optional)"
              rows={2}
              style={{
                width: '100%',
                background: 'var(--surface)',
                border: `1px solid ${color}30`,
                borderRadius: 8,
                padding: '10px 12px',
                color: 'var(--text1)',
                fontSize: 12,
                fontFamily: 'var(--font-body)',
                outline: 'none',
                resize: 'none',
                lineHeight: 1.55,
                marginBottom: 10,
                transition: 'border-color var(--transition)',
              }}
              onFocus={e => e.target.style.borderColor = `${color}60`}
              onBlur={e => e.target.style.borderColor = `${color}30`}
              onKeyDown={e => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmitReflection();
              }}
            />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                onClick={handleSkipReflection}
                style={{
                  background: 'none', border: '1px solid var(--border)',
                  borderRadius: 8, padding: '6px 14px',
                  fontSize: 11, fontFamily: 'var(--font-mono)',
                  color: 'var(--text3)', cursor: 'pointer',
                  letterSpacing: '0.04em',
                }}
              >
                Skip
              </button>
              <button
                onClick={handleSubmitReflection}
                style={{
                  background: color, border: 'none',
                  borderRadius: 8, padding: '6px 16px',
                  fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 700,
                  color: 'var(--bg)', cursor: 'pointer',
                  letterSpacing: '0.04em',
                }}
              >
                {reflectionText.trim() ? 'Save & done ✓' : 'Done ✓'}
              </button>
            </div>
          </div>
        )}
      </div>

      <button
        className={`complete-btn ${action.completed ? 'done' : ''}`}
        onClick={handleCompleteClick}
        aria-label={action.completed ? 'Pattern built' : 'Build this pattern'}
        title={action.completed ? 'Completed' : action.description}
        style={{ alignSelf: 'flex-start', marginTop: 2 }}
      >
        {action.completed ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
          </svg>
        )}
      </button>
    </div>
  );
}
