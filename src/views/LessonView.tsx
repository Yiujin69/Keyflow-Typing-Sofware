import { ArrowLeft, ArrowRight, Gauge, Layers, RotateCcw, Shuffle, Sparkles, Star, Target, TriangleAlert } from 'lucide-react';
import { useMemo, useState } from 'react';
import { SessionSurface } from '../components/SessionSurface';
import { SessionResults } from '../components/SessionResults';
import { Badge, Button, ProgressBar } from '../components/ui';
import { ALL_LESSONS, getLesson, getUnit } from '../lib/curriculum';
import { getLayout } from '../lib/layouts';
import { makeTypeable } from '../lib/typeable';
import { formatDue } from '../lib/srs';
import { useStore } from '../lib/store';
import { buildLessonText } from '../lib/textgen';
import type { SessionSummary, ViewId } from '../lib/types';
import type { RecordResult } from '../lib/store';

export function LessonView({
  lessonId,
  navigate,
  focus,
  onToggleFocus,
}: {
  lessonId: string;
  navigate: (view: ViewId, lessonId?: string) => void;
  focus: boolean;
  onToggleFocus: () => void;
}) {
  const lesson = getLesson(lessonId);
  const { profile, recordSession } = useStore();
  const [seed, setSeed] = useState(() => Date.now() % 1_000_000);
  const [attempt, setAttempt] = useState(0);
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [outcome, setOutcome] = useState<RecordResult | null>(null);

  const language = profile.settings.language;
  const layoutId = profile.settings.layout;
  const prepared = useMemo(() => {
    const generated = lesson ? buildLessonText(lesson, language, seed) : '';
    return makeTypeable(generated, layoutId);
  }, [lesson, language, seed, layoutId]);
  const text = prepared.text;

  if (!lesson) {
    return (
      <div className="page">
        <p>Lesson not found.</p>
        <Button onClick={() => navigate('learn')}>Back to the learning path</Button>
      </div>
    );
  }

  const unit = getUnit(lesson.unitId);
  const progress = profile.lessonProgress[lesson.id];
  const next = ALL_LESSONS.find((item) => item.index === lesson.index + 1);
  const missing = prepared.missing;

  const handleFinish = (result: SessionSummary) => {
    const record = recordSession(result, lesson.id);
    setSummary(result);
    setOutcome(record);
  };

  const retry = () => {
    setSummary(null);
    setOutcome(null);
    setAttempt((value) => value + 1);
  };

  const newText = () => {
    setSummary(null);
    setOutcome(null);
    setSeed(Math.floor(Math.random() * 1_000_000));
  };

  return (
    <div className={`page lesson-page ${focus ? 'is-focus' : ''}`}>
      {!focus && (
        <header className="lesson-head">
          <button type="button" className="back-link" onClick={() => navigate('learn')}>
            <ArrowLeft size={16} /> Learning path
          </button>
          <div className="lesson-head-main">
            <div>
              <p className="eyebrow">
                <Layers size={13} /> Unit {unit ? unit.title : 'Practice'} · Lesson {lesson.index}
              </p>
              <h1>{lesson.title}</h1>
              <p className="page-sub">{lesson.subtitle}</p>
            </div>
            <div className="lesson-targets">
              <div className="target-chip"><Gauge size={14} /><span>{lesson.targetWpm} wpm target</span></div>
              <div className="target-chip"><Target size={14} /><span>{lesson.targetAccuracy}% accuracy</span></div>
              {progress?.stars ? (
                <div className="target-chip stars">
                  <Star size={14} fill="currentColor" /><span>{progress.stars}/3 stars</span>
                </div>
              ) : null}
            </div>
          </div>
          <div className="lesson-head-meta">
            {lesson.newKeys.length > 0 && (
              <div className="new-key-group">
                <span>New keys</span>
                {lesson.newKeys.map((key) => (
                  <kbd key={key}>{key === ' ' ? 'space' : key}</kbd>
                ))}
              </div>
            )}
            <div className="lesson-meta-actions">
              <Button variant="ghost" size="sm" icon={<Shuffle size={15} />} onClick={newText}>
                New text
              </Button>
              <Button variant="ghost" size="sm" icon={<RotateCcw size={15} />} onClick={retry}>
                Restart
              </Button>
              <span className="lesson-best-inline">
                {progress?.bestWpm ? <>Best {Math.round(progress.bestWpm)} wpm</> : 'First attempt'}
                {progress ? ` · ${formatDue(progress)}` : ''}
              </span>
            </div>
            {progress && (
              <ProgressBar value={(progress.stars / 3) * 100} height={4} />
            )}
          </div>
        </header>
      )}

      {focus && (
        <div className="focus-topline">
          <span>Lesson {lesson.index} · {lesson.title}</span>
          <span className="muted">Distraction-free mode</span>
        </div>
      )}

      {missing.length > 0 && (
        <div className="warn-banner">
          <TriangleAlert size={17} />
          <div>
            <strong>Your current layout cannot type every character here</strong>
            <p>
              Missing: {missing.slice(0, 8).map((char) => `“${char}”`).join(', ')}. Switch the keyboard layout or the
              lesson language to make this exercise fully typeable.
            </p>
          </div>
          <Button variant="soft" size="sm" onClick={() => navigate('settings')}>
            Open settings
          </Button>
        </div>
      )}

      <SessionSurface
        key={`${lesson.id}-${seed}-${attempt}`}
        text={text}
        kind="lesson"
        refId={lesson.id}
        label={`${unit?.title ?? 'Lesson'} · ${lesson.title}`}
        mode="lesson"
        onFinish={handleFinish}
        onRestart={() => setSummary(null)}
        focus={focus}
        onToggleFocus={onToggleFocus}
        headerExtra={
          <>
            <Badge tone="neutral">{text.split(' ').length} words</Badge>
            {prepared.simplified > 0 && (
              <Badge tone="warn">Accents adapted to {getLayout(layoutId).name}</Badge>
            )}
          </>
        }
      />

      {!focus && (
        <div className="lesson-after">
          <div className="lesson-tip">
            <Sparkles size={16} />
            <p>
              Accuracy first: speed is a by-product of relaxed, repeatable movement. If a key feels uncertain, slow down
              until it is right, then build rhythm.
            </p>
          </div>
          <div className="lesson-nav">
            {lesson.index > 1 && (
              <Button
                variant="outline"
                icon={<ArrowLeft size={15} />}
                onClick={() => navigate('learn', ALL_LESSONS[lesson.index - 2].id)}
              >
                Previous lesson
              </Button>
            )}
            {next && (
              <Button variant="soft" trailing={<ArrowRight size={15} />} onClick={() => navigate('learn', next.id)}>
                Next: {next.title}
              </Button>
            )}
          </div>
        </div>
      )}

      <SessionResults
        open={Boolean(summary)}
        summary={summary}
        stars={outcome?.stars}
        unlocked={outcome?.unlocked}
        beatWpm={outcome?.beatWpm}
        beatAccuracy={outcome?.beatAccuracy}
        comparison={{ wpm: lesson.targetWpm, accuracy: lesson.targetAccuracy }}
        onRetry={retry}
        onNext={next ? () => navigate('learn', next.id) : undefined}
        nextLabel={next ? 'Next lesson' : 'Back to path'}
        onClose={() => setSummary(null)}
      />
    </div>
  );
}
