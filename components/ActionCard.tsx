'use client';

import { useState } from 'react';
import type { Action } from '@/lib/types';

export default function ActionCard({
  action,
  onComplete,
}: {
  action: Action;
  onComplete: (id: string) => void;
}) {
  const [showWhy, setShowWhy] = useState(false);

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

        {/* Why this? — opt-in, not front-loaded */}
        <button
          onClick={e => { e.stopPropagation(); setShowWhy(w => !w); }}
          style={{
            background: 'none', border: 'none',
            padding: '5px 0 0', margin: 0,
            fontSize: 10, fontFamily: 'var(--font-mono)',
            color: showWhy ? 'var(--physical)' : 'var(--text3)',
            cursor: 'pointer', letterSpacing: '0.06em',
            display: 'flex', alignItems: 'center', gap: 5,
            transition: 'color var(--transition)',
          }}
        >
          <span style={{ fontSize: 8 }}>{showWhy ? '▲' : '▼'}</span>
          WHY THIS?
        </button>

        {showWhy && (
          <div style={{
            marginTop: 10,
            padding: '12px 14px',
            background: 'var(--surface2)',
            borderRadius: 'var(--radius-sm)',
            borderLeft: '2px solid rgba(168,255,62,0.3)',
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
      </div>

      <button
        className={`complete-btn ${action.completed ? 'done' : ''}`}
        onClick={() => !action.completed && onComplete(action.id)}
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
