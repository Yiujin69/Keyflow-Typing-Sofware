export type ViewId =
  | 'dashboard'
  | 'learn'
  | 'test'
  | 'review'
  | 'custom'
  | 'stats'
  | 'achievements'
  | 'fingers'
  | 'settings';

export type Finger =
  | 'pinky-l'
  | 'ring-l'
  | 'middle-l'
  | 'index-l'
  | 'thumb'
  | 'index-r'
  | 'middle-r'
  | 'ring-r'
  | 'pinky-r';

export type LayoutId = 'qwerty' | 'dvorak' | 'colemak' | 'azerty' | 'qwertz';
export type LanguageId = 'en' | 'es' | 'de';
export type ThemeMode = 'system' | 'light' | 'dark';
export type SoundPack = 'soft' | 'mechanical' | 'minimal';
export type SessionKind = 'lesson' | 'test' | 'review' | 'custom';

export type LessonKind = 'keys' | 'words' | 'sentences' | 'paragraphs' | 'numbers' | 'symbols' | 'capitals';

export interface Lesson {
  id: string;
  unitId: string;
  index: number;
  title: string;
  subtitle: string;
  kind: LessonKind;
  newKeys: string[];
  allowedKeys: string;
  targetWpm: number;
  targetAccuracy: number;
  /** Hand-written drill lines. Generated lessons compose lines from the language pack. */
  lines?: string[];
  /** Generation strategy for lessons without hand-written drills. */
  gen?: 'words' | 'sentences' | 'paragraphs' | 'numbers' | 'punctuation';
}

export interface Unit {
  id: string;
  title: string;
  description: string;
  accent: string;
  lessons: Lesson[];
}

export interface Settings {
  theme: ThemeMode;
  layout: LayoutId;
  language: LanguageId;
  sound: boolean;
  volume: number;
  soundPack: SoundPack;
  showKeyboard: boolean;
  showHands: boolean;
  showFingerHints: boolean;
  nextKeyCue: boolean;
  liveWpm: boolean;
  blindMode: boolean;
  strict: boolean;
  dailyGoalMin: number;
  targetWpm: number;
  targetAccuracy: number;
  reduceMotion: boolean;
  caretStyle: 'line' | 'block' | 'underline';
  fontScale: number;
  showKeyboardLetters: boolean;
  autoAdvance: boolean;
}

export interface KeyStat {
  correct: number;
  errors: number;
  timeMs: number;
}

export interface SessionRecord {
  id: string;
  kind: SessionKind;
  refId: string;
  label: string;
  startedAt: number;
  durationMs: number;
  wpm: number;
  rawWpm: number;
  accuracy: number;
  consistency: number;
  correctChars: number;
  totalKeystrokes: number;
  errors: number;
  weakKeys: string[];
  layout: LayoutId;
  language: LanguageId;
}

export interface LessonProgress {
  id: string;
  attempts: number;
  bestWpm: number;
  bestAccuracy: number;
  completedAt: number | null;
  stars: number;
  dueAt: number;
  intervalDays: number;
  ease: number;
  reps: number;
  lapses: number;
  lastPracticed: number | null;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  icon: string;
  progress?: (state: Profile) => { current: number; goal: number };
  unlocked: (state: Profile) => boolean;
}

export interface StreakState {
  current: number;
  best: number;
  lastDay: string | null;
  days: Record<string, number>;
}

export interface DailyGoal {
  date: string;
  ms: number;
  sessions: number;
  wpmSum: number;
  wpmCount: number;
  goalMet: boolean;
}

export interface Profile {
  schema: 1;
  createdAt: number;
  settings: Settings;
  lessonProgress: Record<string, LessonProgress>;
  sessions: SessionRecord[];
  keyStats: Record<string, KeyStat>;
  totalPracticeMs: number;
  streak: StreakState;
  achievements: Record<string, number>;
  daily: DailyGoal;
  dailyHistory: { date: string; ms: number; sessions: number; avgWpm: number }[];
  personalBests: { wpm: number; accuracy: number; streak: number; practiceMs: number; sessions: number };
  onboardingDone: boolean;
  testsCompleted: number;
  lessonsCompleted: number;
  perfectSessions: number;
  reviewQueue: string[];
}

export interface SessionSummary {
  kind: SessionKind;
  refId: string;
  label: string;
  wpm: number;
  rawWpm: number;
  accuracy: number;
  consistency: number;
  correctChars: number;
  incorrectChars: number;
  totalKeystrokes: number;
  errors: number;
  durationMs: number;
  keyStats: Record<string, KeyStat>;
  weakKeys: string[];
  samples: { t: number; wpm: number; errors: number }[];
  layout: LayoutId;
  language: LanguageId;
}

export interface TestConfig {
  seconds: number;
  punctuation: boolean;
  numbers: boolean;
  mode: 'words' | 'quote';
}
