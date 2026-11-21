import { useCallback, useEffect, useRef, useState } from 'react';
import type { KeyStat, LanguageId, LayoutId, SessionKind, SessionSummary } from '../lib/types';
import { computeWeakKeys } from '../lib/metrics';

export type CharState = 'pending' | 'correct' | 'wrong';

interface Stats {
  keystrokes: number;
  correct: number;
  errors: number;
  startAt: number;
  endAt: number;
  pausedMs: number;
  pausedAt: number;
  lastKeyAt: number;
  intervals: number[];
  keyStats: Record<string, KeyStat>;
  samples: { t: number; wpm: number; errors: number }[];
  lastSampleAt: number;
}

interface UseTypingOptions {
  text: string;
  active: boolean;
  mode: 'lesson' | 'timed';
  seconds?: number;
  strict?: boolean;
  kind: SessionKind;
  refId: string;
  label: string;
  layout: LayoutId;
  language: LanguageId;
  onFinish?: (summary: SessionSummary) => void;
  onKey?: (correct: boolean) => void;
}

export interface TypingController {
  status: 'idle' | 'running' | 'finished';
  index: number;
  states: CharState[];
  errors: number;
  correctChars: number;
  keystrokes: number;
  elapsedMs: number;
  remainingMs: number | null;
  wpm: number;
  rawWpm: number;
  accuracy: number;
  consistency: number;
  paused: boolean;
  lastError: number;
  restart: () => void;
  setPaused: (value: boolean) => void;
  summary: SessionSummary | null;
}

function emptyStats(): Stats {
  return {
    keystrokes: 0,
    correct: 0,
    errors: 0,
    startAt: 0,
    endAt: 0,
    pausedMs: 0,
    pausedAt: 0,
    lastKeyAt: 0,
    intervals: [],
    keyStats: {},
    samples: [],
    lastSampleAt: 0,
  };
}

function consistencyFrom(intervals: number[]): number {
  if (intervals.length < 6) return 100;
  const trimmed = intervals.filter((value) => value < 2000);
  if (trimmed.length < 6) return 100;
  const mean = trimmed.reduce((sum, value) => sum + value, 0) / trimmed.length;
  if (mean <= 0) return 100;
  const variance = trimmed.reduce((sum, value) => sum + (value - mean) ** 2, 0) / trimmed.length;
  const cv = Math.sqrt(variance) / mean;
  return Math.max(0, Math.min(100, Math.round((1 - cv * 0.85) * 100)));
}

export function useTyping(options: UseTypingOptions): TypingController {
  const { text, active, mode, seconds = 30, strict = false, kind, refId, label, layout, language, onFinish, onKey } = options;
  const [status, setStatus] = useState<'idle' | 'running' | 'finished'>('idle');
  const [index, setIndex] = useState(0);
  const [states, setStates] = useState<CharState[]>(() => Array.from({ length: text.length }, () => 'pending'));
  const [tick, setTick] = useState(0);
  const [paused, setPausedState] = useState(false);
  const [lastError, setLastError] = useState(0);
  const [, forceSummary] = useState(0);

  const statsRef = useRef<Stats>(emptyStats());
  const indexRef = useRef(0);
  const textRef = useRef(text);
  const statusRef = useRef<'idle' | 'running' | 'finished'>('idle');
  const pausedRef = useRef(false);
  const summaryRef = useRef<SessionSummary | null>(null);
  const onFinishRef = useRef(onFinish);
  const onKeyRef = useRef(onKey);
  const metaRef = useRef({ kind, refId, label, layout, language, mode, seconds, strict, text });
  onFinishRef.current = onFinish;
  onKeyRef.current = onKey;
  metaRef.current = { kind, refId, label, layout, language, mode, seconds, strict, text };
  textRef.current = text;

  const buildSummary = useCallback((): SessionSummary => {
    const stats = statsRef.current;
    const current = metaRef.current;
    const endAt = stats.endAt || Date.now();
    const durationMs = Math.max(250, endAt - stats.startAt - stats.pausedMs);
    const minutes = durationMs / 60_000;
    const wpm = minutes > 0 ? stats.correct / 5 / minutes : 0;
    const rawWpm = minutes > 0 ? stats.keystrokes / 5 / minutes : 0;
    const accuracy = stats.keystrokes > 0 ? (stats.correct / stats.keystrokes) * 100 : 100;
    const keyStats = Object.fromEntries(
      Object.entries(stats.keyStats).map(([key, stat]) => [key, { ...stat }]),
    );
    return {
      kind: current.kind,
      refId: current.refId,
      label: current.label,
      wpm: Math.round(wpm * 10) / 10,
      rawWpm: Math.round(rawWpm * 10) / 10,
      accuracy: Math.round(accuracy * 10) / 10,
      consistency: consistencyFrom(stats.intervals),
      correctChars: stats.correct,
      incorrectChars: stats.errors,
      totalKeystrokes: stats.keystrokes,
      errors: stats.errors,
      durationMs,
      keyStats,
      weakKeys: computeWeakKeys(keyStats, 6),
      samples: stats.samples.slice(-120),
      layout: current.layout,
      language: current.language,
    };
  }, []);

  const finish = useCallback(() => {
    if (statusRef.current === 'finished') return;
    const stats = statsRef.current;
    stats.endAt = Date.now();
    if (stats.samples.length === 0 || stats.lastSampleAt < stats.endAt - 500) {
      const minutes = Math.max(0.001, (stats.endAt - stats.startAt - stats.pausedMs) / 60_000);
      stats.samples.push({
        t: Math.round((stats.endAt - stats.startAt) / 1000),
        wpm: Math.round((stats.correct / 5 / minutes) * 10) / 10,
        errors: stats.errors,
      });
    }
    statusRef.current = 'finished';
    setStatus('finished');
    const summary = buildSummary();
    summaryRef.current = summary;
    forceSummary((value) => value + 1);
    pausedRef.current = false;
    setPausedState(false);
    onFinishRef.current?.(summary);
  }, [buildSummary]);

  const reset = useCallback(() => {
    statsRef.current = emptyStats();
    indexRef.current = 0;
    statusRef.current = 'idle';
    pausedRef.current = false;
    summaryRef.current = null;
    setIndex(0);
    setStatus('idle');
    setStates(Array.from({ length: textRef.current.length }, () => 'pending'));
    setPausedState(false);
    setTick((value) => value + 1);
    setLastError(0);
  }, []);

  useEffect(() => {
    reset();
    // Reset whenever a new exercise text is loaded.
  }, [text, reset]);

  // Keyboard capture.
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (!active || pausedRef.current || statusRef.current === 'finished') return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.isComposing) return;
      const target = event.target as HTMLElement | null;
      const isFormField = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
      if (isFormField) return;

      if (event.key === 'Backspace') {
        event.preventDefault();
        if (indexRef.current === 0) return;
        const previous = indexRef.current - 1;
        indexRef.current = previous;
        setIndex(previous);
        setStates((current) => {
          if (current[previous] === 'pending') return current;
          const next = current.slice();
          next[previous] = 'pending';
          return next;
        });
        return;
      }

      if (event.key === 'Tab' || event.key === 'Enter' || event.key === 'Escape') {
        if (event.key !== 'Escape') event.preventDefault();
        return;
      }

      if (event.key.length !== 1) return;
      event.preventDefault();

      const stats = statsRef.current;
      const meta = metaRef.current;
      const currentText = textRef.current;
      const now = Date.now();
      if (statusRef.current === 'idle') {
        statusRef.current = 'running';
        setStatus('running');
        stats.startAt = now;
        stats.lastKeyAt = now;
        stats.lastSampleAt = now;
      }
      const expected = currentText[indexRef.current];
      if (expected === undefined) return;

      const interval = stats.lastKeyAt ? Math.min(3000, now - stats.lastKeyAt) : 0;
      stats.lastKeyAt = now;
      stats.keystrokes += 1;
      if (interval > 0) stats.intervals.push(interval);

      const statKey = expected === ' ' ? ' ' : expected.toLowerCase();
      const keyStat = stats.keyStats[statKey] ?? { correct: 0, errors: 0, timeMs: 0 };
      const isCorrect = event.key === expected;

      if (isCorrect) {
        stats.correct += 1;
        keyStat.correct += 1;
        keyStat.timeMs += interval;
        stats.keyStats[statKey] = keyStat;
        const nextIndex = indexRef.current + 1;
        indexRef.current = nextIndex;
        setIndex(nextIndex);
        setStates((current) => {
          const next = current.slice();
          next[nextIndex - 1] = 'correct';
          return next;
        });
        onKeyRef.current?.(true);
        if (nextIndex >= currentText.length) {
          finish();
          return;
        }
      } else {
        stats.errors += 1;
        keyStat.errors += 1;
        stats.keyStats[statKey] = keyStat;
        setLastError(now);
        onKeyRef.current?.(false);
        if (!meta.strict) {
          const nextIndex = indexRef.current + 1;
          indexRef.current = nextIndex;
          setIndex(nextIndex);
          setStates((current) => {
            const next = current.slice();
            next[nextIndex - 1] = 'wrong';
            return next;
          });
          if (nextIndex >= currentText.length) {
            finish();
            return;
          }
        } else {
          setStates((current) => {
            const next = current.slice();
            next[indexRef.current] = 'wrong';
            return next;
          });
        }
      }
      setTick((value) => value + 1);
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [active, finish]);

  // Clock.
  useEffect(() => {
    if (!active || status === 'finished') return;
    const interval = window.setInterval(() => {
      setTick((value) => value + 1);
      const stats = statsRef.current;
      if (statusRef.current !== 'running' || pausedRef.current) return;
      const now = Date.now();
      const elapsed = now - stats.startAt - stats.pausedMs;

      if (mode === 'timed' && elapsed >= seconds * 1000) {
        stats.endAt = stats.startAt + stats.pausedMs + seconds * 1000;
        finish();
        return;
      }

      if (now - stats.lastSampleAt >= 900) {
        const minutes = Math.max(0.001, elapsed / 60_000);
        stats.samples.push({
          t: Math.round(elapsed / 1000),
          wpm: Math.round((stats.correct / 5 / minutes) * 10) / 10,
          errors: stats.errors,
        });
        stats.lastSampleAt = now;
      }
    }, 200);
    return () => window.clearInterval(interval);
  }, [active, status, mode, seconds, finish]);

  const setPaused = useCallback((value: boolean) => {
    if (statusRef.current !== 'running') return;
    const stats = statsRef.current;
    if (value && !pausedRef.current) {
      pausedRef.current = true;
      stats.pausedAt = Date.now();
      setPausedState(true);
    } else if (!value && pausedRef.current) {
      pausedRef.current = false;
      stats.pausedMs += Date.now() - stats.pausedAt;
      stats.pausedAt = 0;
      stats.lastKeyAt = Date.now();
      setPausedState(false);
    }
    setTick((current) => current + 1);
  }, []);

  const stats = statsRef.current;
  const now = Date.now();
  let elapsed = 0;
  if (status === 'finished') {
    elapsed = Math.max(0, stats.endAt - stats.startAt - stats.pausedMs);
  } else if (status === 'running') {
    elapsed = Math.max(0, (paused && stats.pausedAt ? stats.pausedAt : now) - stats.startAt - stats.pausedMs);
  }
  void tick;
  const minutes = elapsed / 60_000;
  // Avoid a huge first-keystroke spike in the live display.
  const measured = elapsed >= 1200;
  const wpm = measured && minutes > 0 ? Math.min(300, stats.correct / 5 / minutes) : 0;
  const rawWpm = measured && minutes > 0 ? Math.min(400, stats.keystrokes / 5 / minutes) : 0;
  const accuracy = stats.keystrokes > 0 ? (stats.correct / stats.keystrokes) * 100 : 100;

  return {
    status,
    index,
    states,
    errors: stats.errors,
    correctChars: stats.correct,
    keystrokes: stats.keystrokes,
    elapsedMs: elapsed,
    remainingMs: mode === 'timed' && active ? Math.max(0, seconds * 1000 - elapsed) : null,
    wpm: Math.round(wpm * 10) / 10,
    rawWpm: Math.round(rawWpm * 10) / 10,
    accuracy: Math.round(accuracy * 10) / 10,
    consistency: consistencyFrom(stats.intervals),
    paused,
    lastError,
    restart: reset,
    setPaused,
    summary: summaryRef.current,
  };
}
