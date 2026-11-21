import { ArrowRight, BookOpenCheck, Brain, Clock, KeyRound, Play, Repeat2, Sparkles, Target } from 'lucide-react';
import { useMemo, useState } from 'react';
import { SessionSurface } from '../components/SessionSurface';
import { SessionResults } from '../components/SessionResults';
import { Badge, Button, Card, EmptyState } from '../components/ui';
import { getLesson } from '../lib/curriculum';
import { formatDue } from '../lib/srs';
import { keyAccuracy, niceKey } from '../lib/metrics';
import { useStore } from '../lib/store';
import { buildLessonText, buildWeakKeyDrill } from '../lib/textgen';
import { makeTypeable } from '../lib/typeable';
import type { RecordResult } from '../lib/store';
import type { SessionSummary, ViewId } from '../lib/types';

interface Drill {
  text: string;
  label: string;
  lessonId?: string;
  kindLabel: string;
}

export function ReviewView({
  navigate,
  focus,
  onToggleFocus,
}: {
  navigate: (view: ViewId, lessonId?: string) => void;
  focus: boolean;
  onToggleFocus: () => void;
}) {
  const { profile, reviewDue, weakKeys, recordSession } = useStore();
  const [drill, setDrill] = useState<Drill | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [outcome, setOutcome] = useState<RecordResult | null>(null);

  const language = profile.settings.language;
  const dueList = useMemo(
    () =>
      reviewDue
        .map((id) => ({ lesson: getLesson(id), progress: profile.lessonProgress[id] }))
        .filter((item) => item.lesson),
    [reviewDue, profile.lessonProgress],
  );

  const weakStats = useMemo(
    () =>
      weakKeys
        .map((key) => ({ key, stat: profile.keyStats[key] }))
        .filter((item) => item.stat)
        .map((item) => ({
          ...item,
          accuracy: keyAccuracy(item.stat),
          avgMs: item.stat.correct ? item.stat.timeMs / item.stat.correct : 0,
        })),
    [weakKeys, profile.keyStats],
  );

  const prepare = (raw: string) => makeTypeable(raw, profile.settings.layout).text;

  const startWeakDrill = () => {
    const keys = weakKeys.length > 0 ? weakKeys.slice(0, 4) : ['a', 's', 'd', 'f'];
    setDrill({
      text: prepare(buildWeakKeyDrill(keys, language, Math.floor(Math.random() * 1_000_000))),
      label: `Weak keys · ${keys.map(niceKey).join(' ')}`,
      kindLabel: 'Adaptive key drill',
    });
    setAttempt((value) => value + 1);
    setSummary(null);
    setOutcome(null);
  };

  const startLessonReview = (lessonId: string) => {
    const lesson = getLesson(lessonId);
    if (!lesson) return;
    setDrill({
      text: prepare(buildLessonText(lesson, language, Math.floor(Math.random() * 1_000_000))),
      label: lesson.title,
      lessonId,
      kindLabel: 'Spaced review',
    });
    setAttempt((value) => value + 1);
    setSummary(null);
    setOutcome(null);
  };

  const handleFinish = (result: SessionSummary) => {
    const record = recordSession(result, drill?.lessonId);
    setSummary(result);
    setOutcome(record);
  };

  const closeDrill = () => {
    setDrill(null);
    setSummary(null);
    setOutcome(null);
  };

  const newRound = () => {
    if (drill?.lessonId) startLessonReview(drill.lessonId);
    else startWeakDrill();
  };

  if (drill) {
    return (
      <div className={`page review-page ${focus ? 'is-focus' : ''}`}>
        <header className="lesson-head">
          <button type="button" className="back-link" onClick={closeDrill}>
            <ArrowRight size={16} style={{ transform: 'rotate(180deg)' }} /> Review queue
          </button>
          <div className="lesson-head-main">
            <div>
              <p className="eyebrow"><Repeat2 size={13} /> {drill.kindLabel}</p>
              <h1>{drill.label}</h1>
              <p className="page-sub">Short, focused repetition. Stop while it still feels easy.</p>
            </div>
            <Badge tone="accent">Adaptive text</Badge>
          </div>
        </header>

        <SessionSurface
          key={`${drill.label}-${attempt}`}
          text={drill.text}
          kind="review"
          refId={drill.lessonId ?? 'review-keys'}
          label={drill.label}
          mode="lesson"
          onFinish={handleFinish}
          onRestart={() => setSummary(null)}
          focus={focus}
          onToggleFocus={onToggleFocus}
        />

        <SessionResults
          open={Boolean(summary)}
          summary={summary}
          unlocked={outcome?.unlocked}
          beatWpm={outcome?.beatWpm}
          beatAccuracy={outcome?.beatAccuracy}
          onRetry={newRound}
          onClose={() => setSummary(null)}
        />
      </div>
    );
  }

  const hasAnything = dueList.length > 0 || weakStats.length > 0;

  return (
    <div className="page review-page">
      <header className="page-head">
        <div>
          <p className="eyebrow"><Brain size={14} /> Spaced repetition</p>
          <h1>Review what is fading.</h1>
          <p className="page-sub">
            Keyflow schedules lessons at the edge of forgetting and rebuilds drills around the keys that cost you accuracy.
          </p>
        </div>
        <div className="page-actions">
          <Button variant="soft" icon={<KeyRound size={16} />} onClick={startWeakDrill}>
            Train weak keys
          </Button>
          {dueList.length > 0 && (
            <Button variant="primary" icon={<Play size={16} />} onClick={() => startLessonReview(dueList[0].lesson!.id)}>
              Start review
            </Button>
          )}
        </div>
      </header>

      {!hasAnything ? (
        <Card>
          <EmptyState
            icon={<Sparkles size={22} />}
            title="Nothing to review yet"
            action={<Button variant="soft" onClick={() => navigate('learn')}>Go to lessons</Button>}
          >
            Complete a lesson or a test and this page will fill with scheduled reviews and targeted key drills.
          </EmptyState>
        </Card>
      ) : (
        <div className="review-layout">
          <div className="review-main">
            <Card
              title="Due now"
              subtitle="Lessons scheduled by the spaced-repetition engine."
              action={<Badge tone={dueList.length ? 'warn' : 'good'}>{dueList.length} due</Badge>}
            >
              {dueList.length === 0 ? (
                <p className="muted small">Nothing due right now. Your next review appears automatically — keep practising new material.</p>
              ) : (
                <ul className="due-list">
                  {dueList.map(({ lesson, progress }) => (
                    <li key={lesson!.id}>
                      <div className="due-icon"><BookOpenCheck size={17} /></div>
                      <div className="due-copy">
                        <strong>{lesson!.title}</strong>
                        <span>
                          {progress?.stars ? `${progress.stars}/3 stars` : 'In progress'} · best {Math.round(progress?.bestWpm ?? 0)} wpm · {formatDue(progress)}
                        </span>
                      </div>
                      <Button variant="soft" size="sm" icon={<Play size={14} />} onClick={() => startLessonReview(lesson!.id)}>
                        Review
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card
              title="Weak-key workshop"
              subtitle="Generated from your own error and latency data."
              action={
                <Button variant="ghost" size="sm" onClick={startWeakDrill} trailing={<ArrowRight size={14} />}>
                  New drill
                </Button>
              }
            >
              {weakStats.length === 0 ? (
                <p className="muted small">No meaningful weak keys yet. Type a little more and this fills in.</p>
              ) : (
                <>
                  <div className="key-chips large">
                    {weakStats.map((item) => (
                      <kbd key={item.key}>{niceKey(item.key)}</kbd>
                    ))}
                  </div>
                  <div className="weak-table">
                    {weakStats.map((item) => (
                      <div className="weak-table-row" key={item.key}>
                        <kbd>{niceKey(item.key)}</kbd>
                        <span className="weak-bar">
                          <span style={{ width: `${Math.max(4, item.accuracy)}%` }} className={item.accuracy >= 90 ? 'is-mid' : 'is-low'} />
                        </span>
                        <strong>{item.accuracy.toFixed(0)}%</strong>
                        <span className="muted">{Math.round(item.avgMs)}ms</span>
                      </div>
                    ))}
                  </div>
                  <Button variant="primary" icon={<KeyRound size={16} />} onClick={startWeakDrill}>
                    Drill these keys
                  </Button>
                </>
              )}
            </Card>
          </div>

          <aside className="review-side">
            <Card title="How the schedule works">
              <ol className="srs-steps">
                <li>
                  <span>1</span>
                  <div><strong>Strong result</strong><p>High accuracy and target speed push the lesson days into the future.</p></div>
                </li>
                <li>
                  <span>2</span>
                  <div><strong>Shaky result</strong><p>The lesson returns within the same hour, while the pattern is still fresh.</p></div>
                </li>
                <li>
                  <span>3</span>
                  <div><strong>Weak keys</strong><p>Every mistake and slow keystroke is weighted, then folded into generated drills.</p></div>
                </li>
              </ol>
            </Card>

            <Card title="Review load" subtitle="Practised lessons by schedule.">
              <div className="review-load">
                <div><Clock size={15} /><span>Due now</span><strong>{dueList.length}</strong></div>
                <div><Target size={15} /><span>Weak keys</span><strong>{weakStats.length}</strong></div>
                <div><Repeat2 size={15} /><span>Reviews done</span><strong>{profile.sessions.filter((session) => session.kind === 'review').length}</strong></div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('learn')} trailing={<ArrowRight size={14} />}>
                Back to the path
              </Button>
            </Card>
          </aside>
        </div>
      )}
    </div>
  );
}
