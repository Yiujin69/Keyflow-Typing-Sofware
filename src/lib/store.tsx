import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type {
  KeyStat,
  LanguageId,
  LessonProgress,
  Profile,
  SessionRecord,
  SessionSummary,
  Settings,
  ThemeMode,
} from './types';
import { getLesson, TOTAL_LESSONS } from './curriculum';
import { evaluateAchievements } from './achievements';
import { computeWeakKeys, dayKey, shiftDayKey } from './metrics';
import { dueLessons, scheduleReview, starsFor } from './srs';
import { loadStoredProfile, saveStoredProfile, STORAGE_KEY } from './storage';

export const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
  layout: 'qwerty',
  language: 'en',
  sound: true,
  volume: 0.45,
  soundPack: 'soft',
  showKeyboard: true,
  showHands: true,
  showFingerHints: true,
  nextKeyCue: true,
  liveWpm: true,
  blindMode: false,
  strict: false,
  dailyGoalMin: 10,
  targetWpm: 40,
  targetAccuracy: 97,
  reduceMotion: false,
  caretStyle: 'line',
  fontScale: 1,
  showKeyboardLetters: true,
  autoAdvance: true,
};

function makeId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

export function createDefaultProfile(): Profile {
  return {
    schema: 1,
    createdAt: Date.now(),
    settings: { ...DEFAULT_SETTINGS },
    lessonProgress: {},
    sessions: [],
    keyStats: {},
    totalPracticeMs: 0,
    streak: { current: 0, best: 0, lastDay: null, days: {} },
    achievements: {},
    daily: { date: dayKey(), ms: 0, sessions: 0, wpmSum: 0, wpmCount: 0, goalMet: false },
    dailyHistory: [],
    personalBests: { wpm: 0, accuracy: 0, streak: 0, practiceMs: 0, sessions: 0 },
    onboardingDone: false,
    testsCompleted: 0,
    lessonsCompleted: 0,
    perfectSessions: 0,
    reviewQueue: [],
  };
}

function normalizeProfile(raw: unknown): Profile {
  const base = createDefaultProfile();
  if (!raw || typeof raw !== 'object') return base;
  const input = raw as Partial<Profile> & { settings?: Partial<Settings> };
  const settings = { ...base.settings, ...(input.settings ?? {}) };
  settings.layout = (['qwerty', 'dvorak', 'colemak', 'azerty', 'qwertz'] as const).includes(settings.layout)
    ? settings.layout
    : 'qwerty';
  settings.language = (['en', 'es', 'de'] as const).includes(settings.language) ? settings.language : 'en';
  settings.theme = (['system', 'light', 'dark'] as const).includes(settings.theme) ? settings.theme : 'system';
  settings.volume = Math.max(0, Math.min(1, Number(settings.volume) || 0));
  settings.fontScale = Math.max(0.85, Math.min(1.35, Number(settings.fontScale) || 1));
  settings.dailyGoalMin = Math.max(1, Math.min(240, Number(settings.dailyGoalMin) || 10));

  const sessions = Array.isArray(input.sessions) ? (input.sessions as SessionRecord[]).slice(0, 300) : [];
  const lessonProgress = (input.lessonProgress && typeof input.lessonProgress === 'object' ? input.lessonProgress : {}) as Record<string, LessonProgress>;
  const keyStats = (input.keyStats && typeof input.keyStats === 'object' ? input.keyStats : {}) as Record<string, KeyStat>;
  const streak = input.streak ?? base.streak;
  const today = dayKey();
  const yesterday = shiftDayKey(-1);
  const liveStreak = streak.lastDay === today || streak.lastDay === yesterday ? streak.current : 0;

  const profile: Profile = {
    ...base,
    ...input,
    schema: 1,
    settings,
    sessions,
    lessonProgress,
    keyStats,
    totalPracticeMs: Math.max(0, Number(input.totalPracticeMs) || 0),
    streak: {
      current: Math.max(0, liveStreak),
      best: Math.max(0, Number(streak.best) || 0, liveStreak),
      lastDay: streak.lastDay ?? null,
      days: streak.days ?? {},
    },
    achievements: input.achievements ?? {},
    dailyHistory: Array.isArray(input.dailyHistory) ? input.dailyHistory.slice(-200) : [],
    personalBests: { ...base.personalBests, ...(input.personalBests ?? {}) },
    onboardingDone: Boolean(input.onboardingDone),
    testsCompleted: Math.max(0, Number(input.testsCompleted) || 0),
    lessonsCompleted: Object.values(lessonProgress).filter((item) => item.completedAt).length,
    perfectSessions: Math.max(0, Number(input.perfectSessions) || 0),
    reviewQueue: dueLessons(lessonProgress),
    daily: {
      date: input.daily?.date ?? today,
      ms: Math.max(0, Number(input.daily?.ms) || 0),
      sessions: Math.max(0, Number(input.daily?.sessions) || 0),
      wpmSum: Math.max(0, Number(input.daily?.wpmSum) || 0),
      wpmCount: Math.max(0, Number(input.daily?.wpmCount) || 0),
      goalMet: Boolean(input.daily?.goalMet),
    },
  };
  return profile;
}

export interface RecordResult {
  stars: number;
  unlocked: string[];
  beatWpm: boolean;
  beatAccuracy: boolean;
  xp: number;
}

interface StoreValue {
  profile: Profile;
  ready: boolean;
  updateSettings: (patch: Partial<Settings>) => void;
  recordSession: (summary: SessionSummary, lessonId?: string) => RecordResult;
  completeOnboarding: () => void;
  resetProgress: () => void;
  importProfile: (text: string) => boolean;
  reviewDue: string[];
  weakKeys: string[];
}

const StoreContext = createContext<StoreValue | null>(null);

function applySession(profile: Profile, summary: SessionSummary, lessonId: string | undefined, now: number): Profile {
  const today = dayKey(now);
  const yesterday = shiftDayKey(-1, now);
  let daily = profile.daily;
  let dailyHistory = profile.dailyHistory;

  if (daily.date !== today) {
    if (daily.ms > 0) {
      dailyHistory = [
        ...dailyHistory,
        {
          date: daily.date,
          ms: daily.ms,
          sessions: daily.sessions,
          avgWpm: daily.wpmCount ? daily.wpmSum / daily.wpmCount : 0,
        },
      ].slice(-200);
    }
    daily = { date: today, ms: 0, sessions: 0, wpmSum: 0, wpmCount: 0, goalMet: false };
  }

  const ms = Math.max(1000, Math.round(summary.durationMs));
  const nextDailyMs = daily.ms + ms;
  const nextDaily = {
    ...daily,
    ms: nextDailyMs,
    sessions: daily.sessions + 1,
    wpmSum: daily.wpmSum + summary.wpm,
    wpmCount: daily.wpmCount + 1,
    goalMet: nextDailyMs >= profile.settings.dailyGoalMin * 60_000,
  };

  let streak = profile.streak;
  if (streak.lastDay !== today) {
    const continues = streak.lastDay === yesterday;
    const nextCurrent = continues ? streak.current + 1 : 1;
    streak = {
      current: nextCurrent,
      best: Math.max(streak.best, nextCurrent),
      lastDay: today,
      days: { ...streak.days, [today]: (streak.days[today] ?? 0) + ms },
    };
  } else {
    streak = { ...streak, days: { ...streak.days, [today]: (streak.days[today] ?? 0) + ms } };
  }

  const keyStats: Record<string, KeyStat> = { ...profile.keyStats };
  for (const [key, stat] of Object.entries(summary.keyStats)) {
    const existing = keyStats[key] ?? { correct: 0, errors: 0, timeMs: 0 };
    keyStats[key] = {
      correct: existing.correct + stat.correct,
      errors: existing.errors + stat.errors,
      timeMs: existing.timeMs + stat.timeMs,
    };
  }

  const session: SessionRecord = {
    id: makeId(),
    kind: summary.kind,
    refId: summary.refId,
    label: summary.label,
    startedAt: now - ms,
    durationMs: ms,
    wpm: round(summary.wpm, 1),
    rawWpm: round(summary.rawWpm, 1),
    accuracy: round(summary.accuracy, 1),
    consistency: round(summary.consistency, 0),
    correctChars: summary.correctChars,
    totalKeystrokes: summary.totalKeystrokes,
    errors: summary.errors,
    weakKeys: summary.weakKeys,
    layout: summary.layout,
    language: summary.language,
  };

  let lessonProgress = profile.lessonProgress;
  if (lessonId) {
    const lesson = getLesson(lessonId);
    if (lesson) {
      const existing = profile.lessonProgress[lessonId];
      const scheduled = scheduleReview(
        existing,
        lesson,
        { accuracy: summary.accuracy, wpm: summary.wpm, completed: true },
        now,
      );
      lessonProgress = { ...lessonProgress, [lessonId]: scheduled };
    }
  }

  const perfect = summary.errors === 0 && summary.totalKeystrokes > 25;
  const personalBests = {
    wpm: Math.max(profile.personalBests.wpm, summary.wpm),
    accuracy: Math.max(profile.personalBests.accuracy, summary.accuracy),
    streak: Math.max(profile.personalBests.streak, streak.current),
    practiceMs: Math.max(profile.personalBests.practiceMs, profile.totalPracticeMs + ms),
    sessions: Math.max(profile.personalBests.sessions, profile.sessions.length + 1),
  };

  return {
    ...profile,
    sessions: [session, ...profile.sessions].slice(0, 300),
    keyStats,
    lessonProgress,
    totalPracticeMs: profile.totalPracticeMs + ms,
    streak,
    daily: nextDaily,
    dailyHistory,
    personalBests,
    testsCompleted: profile.testsCompleted + (summary.kind === 'test' ? 1 : 0),
    lessonsCompleted: Object.values(lessonProgress).filter((item) => item.completedAt).length,
    perfectSessions: profile.perfectSessions + (perfect ? 1 : 0),
    reviewQueue: dueLessons(lessonProgress, now),
  };
}

function round(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function applyTheme(mode: ThemeMode, reduceMotion: boolean, fontScale: number) {
  const root = document.documentElement;
  const dark = mode === 'dark' || (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  root.dataset.theme = dark ? 'dark' : 'light';
  root.dataset.motion = reduceMotion ? 'reduced' : 'full';
  root.style.setProperty('--font-scale', String(fontScale));
  document.body.style.colorScheme = dark ? 'dark' : 'light';
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile>(() => createDefaultProfile());
  const [ready, setReady] = useState(false);
  const profileRef = useRef(profile);
  profileRef.current = profile;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const raw = await loadStoredProfile();
      if (cancelled) return;
      if (raw) {
        try {
          setProfile(normalizeProfile(JSON.parse(raw)));
        } catch {
          setProfile(createDefaultProfile());
        }
      }
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Apply appearance immediately, even before the profile is loaded.
  useEffect(() => {
    applyTheme(profile.settings.theme, profile.settings.reduceMotion, profile.settings.fontScale);
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = () => {
      if (profile.settings.theme === 'system') {
        applyTheme('system', profile.settings.reduceMotion, profile.settings.fontScale);
      }
    };
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [profile.settings.theme, profile.settings.reduceMotion, profile.settings.fontScale]);

  // Debounced autosave; also flushes on unload.
  useEffect(() => {
    if (!ready) return;
    const timer = window.setTimeout(() => {
      void saveStoredProfile(profile);
    }, 220);
    return () => window.clearTimeout(timer);
  }, [profile, ready]);

  useEffect(() => {
    if (!ready) return;
    const flush = () => {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profileRef.current));
      } catch {
        // best effort
      }
    };
    window.addEventListener('beforeunload', flush);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') flush();
    });
    return () => window.removeEventListener('beforeunload', flush);
  }, [ready]);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setProfile((current) => ({ ...current, settings: { ...current.settings, ...patch } }));
  }, []);

  const recordSession = useCallback((summary: SessionSummary, lessonId?: string): RecordResult => {
    const now = Date.now();
    const current = profileRef.current;
    const updated = applySession(current, summary, lessonId, now);
    const unlocked = evaluateAchievements(updated);
    if (unlocked.length) {
      const achievements = { ...updated.achievements };
      for (const id of unlocked) achievements[id] = now;
      updated.achievements = achievements;
    }
    const lesson = lessonId ? getLesson(lessonId) : undefined;
    const stars = lesson ? starsFor(lesson, summary.wpm, summary.accuracy) : 0;
    const beatWpm = summary.wpm > current.personalBests.wpm;
    const beatAccuracy = summary.accuracy > current.personalBests.accuracy;
    updated.reviewQueue = dueLessons(updated.lessonProgress, now);
    profileRef.current = updated;
    setProfile(updated);
    const xp = Math.round(summary.correctChars / 10 + (stars > 0 ? stars * 12 : 0) + (summary.kind === 'test' ? 10 : 0));
    return { stars, unlocked, beatWpm, beatAccuracy, xp };
  }, []);

  const completeOnboarding = useCallback(() => {
    setProfile((current) => ({ ...current, onboardingDone: true }));
  }, []);

  const resetProgress = useCallback(() => {
    const fresh = createDefaultProfile();
    const settings = profileRef.current.settings;
    const next = { ...fresh, settings: { ...settings }, onboardingDone: true };
    profileRef.current = next;
    setProfile(next);
    void saveStoredProfile(next);
  }, []);

  const importProfile = useCallback((text: string): boolean => {
    try {
      const parsed = JSON.parse(text);
      if (!parsed || typeof parsed !== 'object' || (!parsed.settings && !parsed.sessions && !parsed.lessonProgress)) {
        return false;
      }
      const next = normalizeProfile(parsed);
      next.onboardingDone = true;
      profileRef.current = next;
      setProfile(next);
      void saveStoredProfile(next);
      return true;
    } catch {
      return false;
    }
  }, []);

  const reviewDue = useMemo(() => dueLessons(profile.lessonProgress), [profile.lessonProgress]);
  const weakKeys = useMemo(() => computeWeakKeys(profile.keyStats, 6), [profile.keyStats]);

  const value = useMemo<StoreValue>(
    () => ({
      profile,
      ready,
      updateSettings,
      recordSession,
      completeOnboarding,
      resetProgress,
      importProfile,
      reviewDue,
      weakKeys,
    }),
    [profile, ready, updateSettings, recordSession, completeOnboarding, resetProgress, importProfile, reviewDue, weakKeys],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used inside StoreProvider');
  return context;
}

export function useSettings(): Settings {
  return useStore().profile.settings;
}

export function useLanguage(): LanguageId {
  return useStore().profile.settings.language;
}

export { TOTAL_LESSONS };
