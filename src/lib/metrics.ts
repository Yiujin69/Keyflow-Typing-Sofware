import type { KeyStat, SessionRecord } from './types';

export const MINUTE = 60_000;
export const DAY = 86_400_000;

export function dayKey(timestamp = Date.now()): string {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function shiftDayKey(days: number, from = Date.now()): string {
  return dayKey(from + days * DAY);
}

export function formatDuration(ms: number, compact = false): string {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (compact) {
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m`;
    return `${seconds}s`;
  }
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

export function formatClock(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export function niceKey(key: string): string {
  if (key === ' ') return 'space';
  return key;
}

/** Error-weighted, latency-aware weakness score. */
export function computeWeakKeys(stats: Record<string, KeyStat>, limit = 5): string[] {
  const scored: { key: string; score: number }[] = [];
  for (const [key, stat] of Object.entries(stats)) {
    if (key === ' ') continue;
    const attempts = stat.correct + stat.errors;
    if (attempts < 4) continue;
    const errorRate = stat.errors / attempts;
    const avgMs = stat.correct > 0 ? stat.timeMs / stat.correct : 400;
    const score = errorRate * 120 + Math.max(0, avgMs - 200) / 18;
    if (errorRate > 0.015 || score > 6) scored.push({ key, score });
  }
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.key);
}

export function sessionAverage(sessions: SessionRecord[], count = 5): number {
  const recent = sessions.slice(0, count);
  if (!recent.length) return 0;
  return recent.reduce((sum, session) => sum + session.wpm, 0) / recent.length;
}

export function trendPercent(sessions: SessionRecord[]): number {
  if (sessions.length < 4) return 0;
  const recent = sessions.slice(0, Math.min(5, Math.floor(sessions.length / 2)));
  const older = sessions.slice(Math.min(5, Math.floor(sessions.length / 2)), Math.min(10, sessions.length));
  if (!older.length) return 0;
  const recentAvg = recent.reduce((sum, s) => sum + s.wpm, 0) / recent.length;
  const olderAvg = older.reduce((sum, s) => sum + s.wpm, 0) / older.length;
  if (olderAvg <= 0) return 0;
  return ((recentAvg - olderAvg) / olderAvg) * 100;
}

export function keyAccuracy(stat: KeyStat): number {
  const attempts = stat.correct + stat.errors;
  return attempts === 0 ? 100 : (stat.correct / attempts) * 100;
}

export function totalKeystrokes(sessions: SessionRecord[]): number {
  return sessions.reduce((sum, session) => sum + session.totalKeystrokes, 0);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function ordinal(value: number): string {
  const suffix = ['th', 'st', 'nd', 'rd'];
  const remainder = value % 100;
  return `${value}${suffix[(remainder - 20) % 10] ?? suffix[remainder] ?? suffix[0]}`;
}

/** Build a smooth SVG path from numeric points. */
export function buildPath(values: number[], width: number, height: number, padding = 6): string {
  if (values.length === 0) return '';
  if (values.length === 1) {
    const y = height - padding;
    return `M ${padding} ${y} L ${width - padding} ${y}`;
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const step = (width - padding * 2) / (values.length - 1);
  return values
    .map((value, index) => {
      const x = padding + index * step;
      const y = height - padding - ((value - min) / range) * (height - padding * 2);
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');
}

export function average(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}
