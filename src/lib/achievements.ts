import type { Achievement, Profile } from './types';
import { CURRICULUM } from './curriculum';

function unitComplete(profile: Profile, unitId: string): number {
  const unit = CURRICULUM.find((item) => item.id === unitId);
  if (!unit) return 0;
  return unit.lessons.filter((lesson) => profile.lessonProgress[lesson.id]?.completedAt).length;
}

function unitTotal(unitId: string): number {
  return CURRICULUM.find((item) => item.id === unitId)?.lessons.length ?? 1;
}

const practiceHours = (profile: Profile) => profile.totalPracticeMs / 3_600_000;

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first-session',
    title: 'First keystrokes',
    description: 'Complete your first practice session.',
    tier: 'bronze',
    icon: 'flag',
    progress: (p) => ({ current: Math.min(p.sessions.length, 1), goal: 1 }),
    unlocked: (p) => p.sessions.length >= 1,
  },
  {
    id: 'ten-sessions',
    title: 'Building the habit',
    description: 'Finish ten sessions.',
    tier: 'bronze',
    icon: 'layers',
    progress: (p) => ({ current: Math.min(p.sessions.length, 10), goal: 10 }),
    unlocked: (p) => p.sessions.length >= 10,
  },
  {
    id: 'fifty-sessions',
    title: 'Dedicated student',
    description: 'Finish fifty sessions.',
    tier: 'silver',
    icon: 'layers',
    progress: (p) => ({ current: Math.min(p.sessions.length, 50), goal: 50 }),
    unlocked: (p) => p.sessions.length >= 50,
  },
  {
    id: 'hundred-sessions',
    title: 'Century of practice',
    description: 'Finish one hundred sessions.',
    tier: 'gold',
    icon: 'medal',
    progress: (p) => ({ current: Math.min(p.sessions.length, 100), goal: 100 }),
    unlocked: (p) => p.sessions.length >= 100,
  },
  {
    id: 'wpm-30',
    title: 'Cruising',
    description: 'Reach 30 WPM in any session.',
    tier: 'bronze',
    icon: 'gauge',
    progress: (p) => ({ current: Math.min(p.personalBests.wpm, 30), goal: 30 }),
    unlocked: (p) => p.personalBests.wpm >= 30,
  },
  {
    id: 'wpm-50',
    title: 'Fluent',
    description: 'Reach 50 WPM.',
    tier: 'silver',
    icon: 'gauge',
    progress: (p) => ({ current: Math.min(p.personalBests.wpm, 50), goal: 50 }),
    unlocked: (p) => p.personalBests.wpm >= 50,
  },
  {
    id: 'wpm-80',
    title: 'Fast hands',
    description: 'Reach 80 WPM.',
    tier: 'gold',
    icon: 'zap',
    progress: (p) => ({ current: Math.min(p.personalBests.wpm, 80), goal: 80 }),
    unlocked: (p) => p.personalBests.wpm >= 80,
  },
  {
    id: 'wpm-100',
    title: 'Triple digits',
    description: 'Reach 100 WPM.',
    tier: 'platinum',
    icon: 'crown',
    progress: (p) => ({ current: Math.min(p.personalBests.wpm, 100), goal: 100 }),
    unlocked: (p) => p.personalBests.wpm >= 100,
  },
  {
    id: 'accuracy-99',
    title: 'Surgical precision',
    description: 'Finish a session with 99% accuracy or better.',
    tier: 'gold',
    icon: 'target',
    progress: (p) => ({ current: Math.min(p.personalBests.accuracy, 99), goal: 99 }),
    unlocked: (p) => p.personalBests.accuracy >= 99,
  },
  {
    id: 'flawless',
    title: 'Flawless',
    description: 'Complete a full session with no mistakes.',
    tier: 'silver',
    icon: 'sparkles',
    progress: (p) => ({ current: Math.min(p.perfectSessions, 1), goal: 1 }),
    unlocked: (p) => p.perfectSessions >= 1,
  },
  {
    id: 'streak-3',
    title: 'Three in a row',
    description: 'Practice three days in a row.',
    tier: 'bronze',
    icon: 'flame',
    progress: (p) => ({ current: Math.min(p.streak.current, 3), goal: 3 }),
    unlocked: (p) => p.streak.best >= 3,
  },
  {
    id: 'streak-7',
    title: 'Week of focus',
    description: 'Practice seven days in a row.',
    tier: 'silver',
    icon: 'flame',
    progress: (p) => ({ current: Math.min(p.streak.best, 7), goal: 7 }),
    unlocked: (p) => p.streak.best >= 7,
  },
  {
    id: 'streak-30',
    title: 'Unbreakable',
    description: 'Practice thirty days in a row.',
    tier: 'platinum',
    icon: 'flame',
    progress: (p) => ({ current: Math.min(p.streak.best, 30), goal: 30 }),
    unlocked: (p) => p.streak.best >= 30,
  },
  {
    id: 'practice-hour',
    title: 'One hour in',
    description: 'Accumulate one hour of practice.',
    tier: 'bronze',
    icon: 'clock',
    progress: (p) => ({ current: Math.min(practiceHours(p), 1), goal: 1 }),
    unlocked: (p) => practiceHours(p) >= 1,
  },
  {
    id: 'practice-ten-hours',
    title: 'Ten hours of focus',
    description: 'Accumulate ten hours of practice.',
    tier: 'gold',
    icon: 'clock',
    progress: (p) => ({ current: Math.min(practiceHours(p), 10), goal: 10 }),
    unlocked: (p) => practiceHours(p) >= 10,
  },
  {
    id: 'home-row',
    title: 'Home sweet home',
    description: 'Complete every home-row lesson.',
    tier: 'bronze',
    icon: 'keyboard',
    progress: (p) => ({ current: unitComplete(p, 'home'), goal: unitTotal('home') }),
    unlocked: (p) => unitComplete(p, 'home') >= unitTotal('home'),
  },
  {
    id: 'top-row',
    title: 'Reaching up',
    description: 'Complete every upper-row lesson.',
    tier: 'silver',
    icon: 'keyboard',
    progress: (p) => ({ current: unitComplete(p, 'top'), goal: unitTotal('top') }),
    unlocked: (p) => unitComplete(p, 'top') >= unitTotal('top'),
  },
  {
    id: 'bottom-row',
    title: 'Full reach',
    description: 'Complete every lower-row lesson.',
    tier: 'silver',
    icon: 'keyboard',
    progress: (p) => ({ current: unitComplete(p, 'bottom'), goal: unitTotal('bottom') }),
    unlocked: (p) => unitComplete(p, 'bottom') >= unitTotal('bottom'),
  },
  {
    id: 'numbers',
    title: 'Number cruncher',
    description: 'Complete every lesson in the numbers unit.',
    tier: 'silver',
    icon: 'hash',
    progress: (p) => ({ current: unitComplete(p, 'numbers'), goal: unitTotal('numbers') }),
    unlocked: (p) => unitComplete(p, 'numbers') >= unitTotal('numbers'),
  },
  {
    id: 'curriculum',
    title: 'The whole journey',
    description: 'Complete all 38 lessons.',
    tier: 'platinum',
    icon: 'crown',
    progress: (p) => ({ current: p.lessonsCompleted, goal: 38 }),
    unlocked: (p) => p.lessonsCompleted >= 38,
  },
  {
    id: 'tests-10',
    title: 'Under pressure',
    description: 'Complete ten timed typing tests.',
    tier: 'silver',
    icon: 'timer',
    progress: (p) => ({ current: Math.min(p.testsCompleted, 10), goal: 10 }),
    unlocked: (p) => p.testsCompleted >= 10,
  },
  {
    id: 'review-master',
    title: 'Smart repetition',
    description: 'Complete ten adaptive review sessions.',
    tier: 'silver',
    icon: 'activity',
    progress: (p) => ({
      current: Math.min(p.sessions.filter((session) => session.kind === 'review').length, 10),
      goal: 10,
    }),
    unlocked: (p) => p.sessions.filter((session) => session.kind === 'review').length >= 10,
  },
];

export const ACHIEVEMENT_MAP = new Map(ACHIEVEMENTS.map((achievement) => [achievement.id, achievement]));

export function evaluateAchievements(profile: Profile): string[] {
  return ACHIEVEMENTS.filter(
    (achievement) => !profile.achievements[achievement.id] && achievement.unlocked(profile),
  ).map((achievement) => achievement.id);
}
