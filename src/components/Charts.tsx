import { useId } from 'react';

export interface ChartPoint {
  label: string;
  value: number;
}

function smoothPath(points: { x: number; y: number }[]): string {
  if (!points.length) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  let path = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i += 1) {
    const current = points[i];
    const previous = points[i - 1];
    const midX = (previous.x + current.x) / 2;
    path += ` C ${midX} ${previous.y}, ${midX} ${current.y}, ${current.x} ${current.y}`;
  }
  return path;
}

export function LineChart({
  data,
  height = 190,
  suffix = '',
  goal,
  emptyLabel = 'Complete a few sessions to see your trend.',
}: {
  data: ChartPoint[];
  height?: number;
  suffix?: string;
  goal?: number;
  emptyLabel?: string;
}) {
  const rawId = useId();
  const gradientId = `grad-${rawId.replace(/[^a-zA-Z0-9]/g, '')}`;
  const width = 640;
  const padding = { top: 16, right: 16, bottom: 26, left: 38 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  if (data.length === 0) {
    return <div className="chart-empty" style={{ height }}>{emptyLabel}</div>;
  }

  const values = data.map((point) => point.value);
  const max = Math.max(...values, goal ?? 0, 1);
  const min = 0;
  const range = max - min || 1;
  const step = data.length > 1 ? innerWidth / (data.length - 1) : 0;
  const points = data.map((point, index) => ({
    x: padding.left + (data.length === 1 ? innerWidth / 2 : index * step),
    y: padding.top + innerHeight - ((point.value - min) / range) * innerHeight,
  }));
  const line = smoothPath(points);
  const area = `${line} L ${points[points.length - 1].x} ${padding.top + innerHeight} L ${points[0].x} ${padding.top + innerHeight} Z`;
  const goalY = goal ? padding.top + innerHeight - ((goal - min) / range) * innerHeight : null;

  return (
    <div className="chart-wrap">
      <svg viewBox={`0 0 ${width} ${height}`} className="chart-svg" role="img" aria-label={`Trend chart with ${data.length} points, latest ${data[data.length - 1].value.toFixed(1)}${suffix}`}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 0.5, 1].map((fraction) => {
          const y = padding.top + innerHeight * fraction;
          return (
            <g key={fraction}>
              <line x1={padding.left} x2={width - padding.right} y1={y} y2={y} className="chart-grid" />
              <text x={padding.left - 8} y={y + 4} textAnchor="end" className="chart-axis">
                {Math.round(max - fraction * range)}
              </text>
            </g>
          );
        })}
        {goalY !== null && (
          <g>
            <line x1={padding.left} x2={width - padding.right} y1={goalY} y2={goalY} className="chart-goal" />
            <text x={width - padding.right} y={goalY - 6} textAnchor="end" className="chart-goal-label">
              goal {goal}
              {suffix}
            </text>
          </g>
        )}
        <path d={area} fill={`url(#${gradientId})`} />
        <path d={line} className="chart-line" fill="none" />
        {points.map((point, index) => (
          <circle key={index} cx={point.x} cy={point.y} r={data.length > 30 ? 1.5 : 3} className="chart-dot">
            <title>{`${data[index].label}: ${data[index].value.toFixed(1)}${suffix}`}</title>
          </circle>
        ))}
        <text x={padding.left} y={height - 6} className="chart-axis">{data[0].label}</text>
        {data.length > 1 && (
          <text x={width - padding.right} y={height - 6} textAnchor="end" className="chart-axis">
            {data[data.length - 1].label}
          </text>
        )}
      </svg>
    </div>
  );
}

export function BarChart({
  data,
  height = 170,
  unit = 'm',
  goal,
}: {
  data: ChartPoint[];
  height?: number;
  unit?: string;
  goal?: number;
}) {
  if (!data.length) {
    return <div className="chart-empty" style={{ height }}>No practice recorded yet.</div>;
  }
  const max = Math.max(...data.map((point) => point.value), goal ?? 0, 1);
  return (
    <div className="bar-chart" style={{ height }}>
      <div className="bar-grid" aria-hidden="true">
        <span>{Math.round(max)}{unit}</span>
        <span>{Math.round(max / 2)}{unit}</span>
        <span>0</span>
      </div>
      <div className="bar-columns">
        {data.map((point, index) => (
          <div className="bar-column" key={`${point.label}-${index}`} title={`${point.label}: ${point.value.toFixed(1)}${unit}`}>
            {goal ? <div className="bar-goal" style={{ bottom: `${(goal / max) * 100}%` }} /> : null}
            <div
              className={`bar-fill ${point.value === 0 ? 'is-empty' : ''}`}
              style={{ height: `${Math.max(point.value > 0 ? 4 : 1, (point.value / max) * 100)}%` }}
            />
            <span className="bar-label">{point.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Sparkline({ values, width = 120, height = 36, tone = 'accent' }: { values: number[]; width?: number; height?: number; tone?: 'accent' | 'good' }) {
  if (values.length < 2) {
    return <div className="sparkline-empty" style={{ width, height }} />;
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const step = width / (values.length - 1);
  const points = values.map((value, index) => `${index * step},${height - 3 - ((value - min) / range) * (height - 6)}`);
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className={`sparkline sparkline-${tone}`} aria-hidden="true">
      <polyline points={points.join(' ')} fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function HeatScale({ items }: { items: { key: string; accuracy: number; attempts: number }[] }) {
  const sorted = items.slice().sort((a, b) => a.accuracy - b.accuracy);
  return (
    <div className="heat-list">
      {sorted.map((item) => (
        <div className="heat-row" key={item.key}>
          <kbd>{item.key === ' ' ? 'space' : item.key}</kbd>
          <div className="heat-track">
            <div
              className={`heat-fill ${item.accuracy >= 97 ? 'is-good' : item.accuracy >= 90 ? 'is-mid' : 'is-low'}`}
              style={{ width: `${item.accuracy}%` }}
            />
          </div>
          <span className="heat-value">{item.accuracy.toFixed(0)}%</span>
          <span className="heat-attempts">{item.attempts}</span>
        </div>
      ))}
    </div>
  );
}
