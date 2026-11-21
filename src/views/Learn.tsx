import { ArrowRight, Check, Circle, Hand, Play, Repeat2, Sparkles, Star, Target } from 'lucide-react';
import { Badge, Button, Card, ProgressBar, Ring } from '../components/ui';
import { CURRICULUM, nextLessonId, TOTAL_LESSONS, unitProgress } from '../lib/curriculum';
import { formatDue, dueLessons } from '../lib/srs';
import { niceKey } from '../lib/metrics';
import { useStore } from '../lib/store';
import type { ViewId } from '../lib/types';

export function Learn({ navigate }: { navigate: (view: ViewId, lessonId?: string) => void }) {
  const { profile, reviewDue } = useStore();
  const completed = profile.lessonsCompleted;
  const completion = (completed / TOTAL_LESSONS) * 100;
  const nextId = nextLessonId(profile.lessonProgress);
  const due = new Set(dueLessons(profile.lessonProgress));

  return (
    <div className="page learn">
      <header className="page-head">
        <div>
          <p className="eyebrow"><Sparkles size={14} /> Structured curriculum</p>
          <h1>From home row to full fluency.</h1>
          <p className="page-sub">
            Seven units, {TOTAL_LESSONS} lessons, one key at a time. Every lesson adapts to how you actually type.
          </p>
        </div>
        <div className="page-actions">
          <Button variant="outline" icon={<Hand size={16} />} onClick={() => navigate('fingers')}>
            Finger guide
          </Button>
          <Button variant="primary" icon={<Play size={16} />} onClick={() => navigate('learn', nextId)}>
            Continue
          </Button>
        </div>
      </header>

      <div className="learn-layout">
        <div className="learn-main">
          {reviewDue.length > 0 && (
            <div className="inline-callout">
              <Repeat2 size={18} />
              <div>
                <strong>{reviewDue.length} lesson{reviewDue.length === 1 ? '' : 's'} due for spaced review</strong>
                <p>Short reviews are the fastest way to make the keys permanent.</p>
              </div>
              <Button variant="soft" size="sm" onClick={() => navigate('review')}>Review</Button>
            </div>
          )}

          <div className="unit-list">
            {CURRICULUM.map((unit, unitIndex) => {
              const progress = unitProgress(unit, profile.lessonProgress);
              const isNextUnit = unit.lessons.some((lesson) => lesson.id === nextId);
              return (
                <section className="unit-card" key={unit.id} style={{ '--unit-accent': unit.accent } as React.CSSProperties}>
                  <header className="unit-head">
                    <div className="unit-title">
                      <span className="unit-badge">{String(unitIndex + 1).padStart(2, '0')}</span>
                      <div>
                        <h2>{unit.title}</h2>
                        <p>{unit.description}</p>
                      </div>
                    </div>
                    <div className="unit-meter">
                      <span>{progress.done}/{progress.total}</span>
                      <div className="unit-meter-bar">
                        <span style={{ width: `${progress.ratio * 100}%` }} />
                      </div>
                      {isNextUnit && <Badge tone="accent">In progress</Badge>}
                      {progress.done === progress.total && <Badge tone="good">Complete</Badge>}
                    </div>
                  </header>

                  <div className="lesson-list">
                    {unit.lessons.map((lesson, lessonIndex) => {
                      const lessonProgress = profile.lessonProgress[lesson.id];
                      const isDone = Boolean(lessonProgress?.completedAt);
                      const isNext = lesson.id === nextId;
                      const isDue = due.has(lesson.id);
                      return (
                        <button
                          type="button"
                          key={lesson.id}
                          className={`lesson-row ${isDone ? 'is-done' : ''} ${isNext ? 'is-next' : ''}`}
                          onClick={() => navigate('learn', lesson.id)}
                        >
                          <span className="lesson-state" aria-hidden="true">
                            {isDone ? <Check size={15} /> : <Circle size={14} />}
                          </span>
                          <span className="lesson-index">{String(lessonIndex + 1).padStart(2, '0')}</span>
                          <span className="lesson-copy">
                            <span className="lesson-title-line">
                              <strong>{lesson.title}</strong>
                              {isNext && <Badge tone="accent">Up next</Badge>}
                              {isDue && <Badge tone="warn">Review due</Badge>}
                            </span>
                            <span className="lesson-subtitle">{lesson.subtitle}</span>
                            {lesson.newKeys.length > 0 && (
                              <span className="new-keys">
                                {lesson.newKeys.map((key) => (
                                  <kbd key={key}>{key === ' ' ? 'space' : niceKey(key)}</kbd>
                                ))}
                              </span>
                            )}
                          </span>
                          <span className="lesson-stats">
                            {lessonProgress?.bestWpm ? (
                              <span className="lesson-best">{Math.round(lessonProgress.bestWpm)} <em>wpm</em></span>
                            ) : (
                              <span className="lesson-target"><Target size={13} /> {lesson.targetWpm} wpm</span>
                            )}
                            {lessonProgress?.stars ? (
                              <span className="mini-stars" aria-label={`${lessonProgress.stars} stars`}>
                                {[1, 2, 3].map((star) => (
                                  <Star key={star} size={11} fill={star <= lessonProgress.stars ? 'currentColor' : 'none'} />
                                ))}
                              </span>
                            ) : (
                              <span className="lesson-due">{isDone ? formatDue(lessonProgress) : 'Not started'}</span>
                            )}
                          </span>
                          <span className="lesson-go" aria-hidden="true"><ArrowRight size={16} /></span>
                        </button>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        </div>

        <aside className="learn-aside">
          <Card className="aside-progress">
            <Ring value={completion} size={132} stroke={10} label={`${Math.round(completion)} percent complete`}>
              <strong>{Math.round(completion)}%</strong>
              <span>{completed}/{TOTAL_LESSONS}</span>
            </Ring>
            <div className="aside-progress-copy">
              <h3>Course progress</h3>
              <p>{completed === TOTAL_LESSONS ? 'Every lesson complete. Time to chase personal bests.' : 'Lessons unlock in any order — but the path is designed to build habits in sequence.'}</p>
              <ProgressBar value={completion} />
            </div>
          </Card>

          <Card title="Today" subtitle="A little every day beats a lot once a week.">
            <div className="aside-stats">
              <div><span>Focused time</span><strong>{Math.round(profile.daily.ms / 60_000)} min</strong></div>
              <div><span>Daily goal</span><strong>{profile.settings.dailyGoalMin} min</strong></div>
              <div><span>Streak</span><strong>{profile.streak.current} days</strong></div>
              <div><span>Reviews due</span><strong>{reviewDue.length}</strong></div>
            </div>
            <Button variant="soft" size="sm" onClick={() => navigate('review')} icon={<Repeat2 size={15} />}>
              Open review queue
            </Button>
          </Card>

          <Card title="How lessons adapt" className="aside-tip">
            <ul className="tip-list">
              <li><span>01</span> Drill text is generated from the keys you have unlocked.</li>
              <li><span>02</span> Mistyped keys are weighted and return in review.</li>
              <li><span>03</span> Stars reflect both speed and accuracy, never speed alone.</li>
            </ul>
            <Button variant="ghost" size="sm" onClick={() => navigate('settings')} trailing={<ArrowRight size={14} />}>
              Tune your targets
            </Button>
          </Card>
        </aside>
      </div>
    </div>
  );
}
