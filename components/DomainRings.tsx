'use client';

import type { DomainScores } from '@/lib/types';

const DOMAINS = [
  { key: 'physical', label: 'Physical', color: '#a8ff3e', r: 108 },
  { key: 'mental', label: 'Mental', color: '#38d9f5', r: 84 },
  { key: 'spiritual', label: 'Spiritual', color: '#d4a0ff', r: 60 },
  { key: 'metaphysical', label: 'Meta', color: '#ffcc44', r: 36 },
] as const;

const STROKE = 14;
const SIZE = 260;
const CX = SIZE / 2;

function Arc({ r, color, score }: { r: number; color: string; score: number }) {
  const c = 2 * Math.PI * r;
  const filled = (score / 100) * c;
  return (
    <g>
      {/* Track */}
      <circle
        cx={CX} cy={CX} r={r}
        fill="none"
        stroke="rgba(255,255,255,0.05)"
        strokeWidth={STROKE}
      />
      {/* Fill — starts at top (rotate -90deg) */}
      <circle
        cx={CX} cy={CX} r={r}
        fill="none"
        stroke={color}
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeDasharray={`${filled} ${c}`}
        transform={`rotate(-90 ${CX} ${CX})`}
        style={{ transition: 'stroke-dasharray 1s cubic-bezier(0.4,0,0.2,1)', filter: `drop-shadow(0 0 4px ${color}55)` }}
      />
    </g>
  );
}

export default function DomainRings({ scores }: { scores: DomainScores }) {
  const overall = Math.round(
    Object.values(scores).reduce((a, b) => a + b, 0) / 4
  );

  return (
    <div className="rings-layout">
      {/* SVG rings */}
      <div style={{ flexShrink: 0 }}>
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
          {DOMAINS.map(d => (
            <Arc key={d.key} r={d.r} color={d.color} score={scores[d.key]} />
          ))}
          {/* Center text */}
          <text
            x={CX} y={CX - 8}
            textAnchor="middle"
            fill="#eeeaf5"
            fontFamily="'Syne', sans-serif"
            fontSize="30"
            fontWeight="800"
          >
            {overall}
          </text>
          <text
            x={CX} y={CX + 12}
            textAnchor="middle"
            fill="#4b4f62"
            fontFamily="'JetBrains Mono', monospace"
            fontSize="10"
            letterSpacing="2"
          >
            BALANCE
          </text>
        </svg>
      </div>

      {/* Legend */}
      <div className="rings-legend">
        {DOMAINS.map(d => (
          <div className="legend-row" key={d.key}>
            <div className="legend-dot" style={{ background: d.color }} />
            <span className="legend-label">{d.label}</span>
            <div className="legend-bar-track">
              <div
                className="legend-bar-fill"
                style={{ width: `${scores[d.key]}%`, background: d.color }}
              />
            </div>
            <span className="legend-score" style={{ color: d.color }}>
              {scores[d.key]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
