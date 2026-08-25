'use client';

import type { Action } from '@/lib/types';

export default function ActionCard({
  action,
  onComplete,
}: {
  action: Action;
  onComplete: (id: string) => void;
}) {
  return (
    <div
      className={`action-card ${action.completed ? 'completed' : ''}`}
      data-domain={action.domain}
    >
      <div className="action-body">
        <div className="action-title">{action.title}</div>
        <div className="action-meta">
          <span className="action-tag" data-domain={action.domain}>
            {action.domain === 'metaphysical' ? 'meta' : action.domain}
          </span>
          <span className="action-duration">{action.duration} min</span>
        </div>
        <div className="action-benefit">{action.benefit}</div>
      </div>

      <button
        className={`complete-btn ${action.completed ? 'done' : ''}`}
        onClick={() => !action.completed && onComplete(action.id)}
        aria-label={action.completed ? 'Done' : 'Mark complete'}
        title={action.completed ? 'Completed' : action.description}
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
