import type { LessonProgress, Lesson } from './types';

const DAY = 86_400_000;
const MIN_15 = 15 * 60_000;

export function makeLessonProgress(): LessonProgress {
  return {
    id: '',
    attempts: 0,
    bestWpm: 0,
    bestAccuracy: 0,
    completedAt: null,
    stars: 0,
    dueAt: 0,
    intervalDays: 0,
    ease: 2.5,
    reps: 0,
    lapses: 0,
    lastPracticed: null,
  };
}

export function starsFor(lesson: Lesson, wpm: number, accuracy: number): number {
  if (wpm >= lesson.targetWpm && accuracy >= lesson.targetAccuracy) return 3;
  if (wpm >= lesson.targetWpm * 0.75 && accuracy >= lesson.targetAccuracy - 2) return 2;
  return 1;
}

export interface ReviewOutcome {
  accuracy: number;
  wpm: number;
  completed: boolean;
}

/**
 * A compact SM-2 style scheduler. Strong results push the lesson further out;
 * weak results bring it back within the same session, which is what makes the
 * review queue feel responsive rather than punishing.
 */
export function scheduleReview(previous: LessonProgress | undefined, lesson: Lesson, outcome: ReviewOutcome, now = Date.now()): LessonProgress {
  const base = previous ? { ...previous } : makeLessonProgress();
  const accuracy = outcome.accuracy;
  let quality: number;
  if (!outcome.completed) quality = 2;
  else if (accuracy >= Math.min(99, lesson.targetAccuracy + 1) && outcome.wpm >= lesson.targetWpm) quality = 5;
  else if (accuracy >= lesson.targetAccuracy && outcome.wpm >= lesson.targetWpm * 0.8) quality = 4;
  else if (accuracy >= 90) quality = 3;
  else quality = 2;

  let { ease, reps, intervalDays, lapses } = base;
  ease = Math.max(1.3, Math.min(2.9, ease + (0.1 - (5 - quality) * 0.08)));

  if (quality < 3) {
    reps = 0;
    lapses += 1;
    intervalDays = 0;
  } else {
    reps += 1;
    if (reps === 1) intervalDays = 1;
    else if (reps === 2) intervalDays = 3;
    else intervalDays = Math.max(4, Math.round(intervalDays * ease));
  }

  const dueAt =
    quality < 3
      ? now + MIN_15
      : quality === 3
        ? now + DAY * 0.5
        : now + intervalDays * DAY;

  return {
    ...base,
    id: lesson.id,
    attempts: base.attempts + 1,
    bestWpm: Math.max(base.bestWpm, Math.round(outcome.wpm)),
    bestAccuracy: Math.max(base.bestAccuracy, accuracy),
    completedAt: base.completedAt ?? (outcome.completed ? now : null),
    stars: Math.max(base.stars, outcome.completed ? starsFor(lesson, outcome.wpm, accuracy) : 0),
    dueAt,
    intervalDays,
    ease,
    reps,
    lapses,
    lastPracticed: now,
  };
}

export function dueLessons(progress: Record<string, LessonProgress>, now = Date.now()): string[] {
  return Object.values(progress)
    .filter((item) => item.completedAt && item.dueAt <= now)
    .sort((a, b) => a.dueAt - b.dueAt)
    .map((item) => item.id);
}

export function formatDue(progress: LessonProgress | undefined, now = Date.now()): string {
  if (!progress || !progress.completedAt) return 'Not started';
  const diff = progress.dueAt - now;
  if (diff <= 0) return 'Due now';
  if (diff < 60 * 60_000) return `In ${Math.max(1, Math.round(diff / 60_000))} min`;
  if (diff < DAY) return `In ${Math.round(diff / (60 * 60_000))} h`;
  return `In ${Math.round(diff / DAY)} d`;
}
