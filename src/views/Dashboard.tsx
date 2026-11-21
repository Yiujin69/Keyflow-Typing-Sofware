import {
  ArrowRight,
  CalendarDays,
  Flame,
  Gauge,
  Play,
  Repeat2,
  Sparkles,
  Target,
  Timer,
  TrendingDown,
  TrendingUp,
  Trophy,
  Zap,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { LineChart, Sparkline } from '../components/Charts';
import { Keyboard } from '../components/Keyboard';
import { AchievementIcon } from '../components/AchievementIcon';
import { Badge, Button, Card, ProgressBar, Ring, Segmented, StatTile } from '../components/ui';
import { ACHIEVEMENTS } from '../lib/achievements';
import { ALL_LESSONS, CURRICULUM, getLesson, getUnit, nextLessonId, TOTAL_LESSONS } from '../lib/curriculum';
import { average, formatDuration, niceKey, trendPercent } from '../lib/metrics';
import { useStore } from '../lib/store';
import type { ViewId } from '../lib/types';

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 5) return 'Late night practice';
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function timeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.round(diff / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days}d ago`;
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(timestamp);
}

function shortDate(timestamp: number): string {
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(timestamp);
}

export function Dashboard({ navigate }: { navigate: (view: ViewId, lessonId?: string) => void }) {
  const { profile, weakKeys } = useStore();
  const [metric, setMetric] = useState<'wpm' | 'accuracy'>('wpm');

  const sessions = profile.sessions;
  const nextId = nextLessonId(profile.lessonProgress);
  const nextLesson = getLesson(nextId) ?? ALL_LESSONS[0];
  const nextUnit = getUnit(nextLesson.unitId);
  const completed = profile.lessonsCompleted;
  const completion = (completed / TOTAL_LESSONS) * 100;
  const goalPct = Math.min(100, (profile.daily.ms / (profile.settings.dailyGoalMin * 60_000)) * 100);
  const recent = sessions.slice(0, 5);
  const avgAccuracy = average(sessions.slice(0, 10).map((session) => session.accuracy));
  const trend = trendPercent(sessions);
  const wpmHistory = sessions.map((session) => session.wpm).slice(0, 12).reverse();
  const accuracyHistory = sessions.map((session) => session.accuracy).slice(0, 12).reverse();

  const chartData = useMemo(() => {
    return sessions
      .slice(0, 14)
      .reverse()
      .map((session) => ({
        label: shortDate(session.startedAt),
        value: metric === 'wpm' ? session.wpm : session.accuracy,
      }));
  }, [sessions, metric]);

  const nextAchievements = useMemo(() => {
    const locked = ACHIEVEMENTS.filter((achievement) => !profile.achievements[achievement.id]);
    return locked
      .map((achievement) => {
        const progress = achievement.progress?.(profile) ?? { current: 0, goal: 1 };
        return { achievement, ratio: progress.current / progress.goal, progress };
      })
      .sort((a, b) => b.ratio - a.ratio)
      .slice(0, 3);
  }, [profile]);

  const unlockedCount = Object.keys(profile.achievements).length;

  return (
    <div className="page dashboard">
      <header className="page-head">
        <div>
          <p className="eyebrow"><CalendarDays size={14} /> {greeting()}</p>
          <h1>Keep the rhythm going.</h1>
          <p className="page-sub">
            {completed === 0
              ? 'Your first lesson takes about two minutes. Begin with the home row.'
              : `${completed} of ${TOTAL_LESSONS} lessons complete · ${Math.round(completion)}% of the path`}
          </p>
        </div>
        <div className="page-actions">
          <Button variant="outline" icon={<Timer size={17} />} onClick={() => navigate('test')}>
            Quick test
          </Button>
          <Button variant="primary" icon={<Play size={16} />} onClick={() => navigate('learn', nextId)}>
            {completed === 0 ? 'Start learning' : 'Continue lesson'}
          </Button>
        </div>
      </header>

      {profile.reviewQueue.length > 0 && (
        <div className="notice-banner">
          <span className="notice-icon"><Repeat2 size={17} /></span>
          <div>
            <strong>{profile.reviewQueue.length} lesson{profile.reviewQueue.length === 1 ? '' : 's'} ready for review</strong>
            <p>Spaced repetition keeps the keys you have learned fresh. Reviews take under a minute.</p>
          </div>
          <Button variant="soft" size="sm" trailing={<ArrowRight size={15} />} onClick={() => navigate('review')}>
            Review now
          </Button>
        </div>
      )}

      <div className="dash-grid">
        <Card className="continue-card" as="article">
          <div className="continue-copy">
            <div className="continue-top">
              <Badge tone="accent">Up next</Badge>
              <span className="continue-unit">{nextUnit?.title}</span>
            </div>
            <h2>{nextLesson.title}</h2>
            <p>{nextLesson.subtitle}</p>
            <div className="continue-meta">
              <span><Gauge size={15} /> Target {nextLesson.targetWpm} wpm</span>
              <span><Target size={15} /> {nextLesson.targetAccuracy}% accuracy</span>
              <span><Sparkles size={15} /> Lesson {nextLesson.index} of {TOTAL_LESSONS}</span>
            </div>
            <div className="continue-actions">
              <Button variant="primary" icon={<Play size={16} />} onClick={() => navigate('learn', nextLesson.id)}>
                Practice this lesson
              </Button>
              <span className="continue-progress-text">
                {completed}/{TOTAL_LESSONS} complete
              </span>
            </div>
            <ProgressBar value={completion} />
          </div>
          <div className="continue-visual" aria-hidden="true">
            <Keyboard layoutId={profile.settings.layout} showLetters showFingerHints compact />
          </div>
        </Card>

        <Card className="goal-card" title="Today's goal" subtitle={`${profile.settings.dailyGoalMin} focused minutes`}>
          <div className="goal-body">
            <Ring
              value={goalPct}
              size={116}
              stroke={10}
              tone={goalPct >= 100 ? 'good' : 'accent'}
              label={`${Math.round(goalPct)} percent of daily goal`}
            >
              <span className="goal-percent">{Math.round(goalPct)}%</span>
              <span className="goal-caption">{formatDuration(profile.daily.ms, true)}</span>
            </Ring>
            <div className="goal-details">
              <div className="goal-row">
                <Flame size={16} />
                <span className="goal-row-label">Current streak</span>
                <strong>{profile.streak.current}d</strong>
              </div>
              <div className="goal-row">
                <Trophy size={16} />
                <span className="goal-row-label">Best streak</span>
                <strong>{profile.streak.best}d</strong>
              </div>
              <div className="goal-row">
                <Zap size={16} />
                <span className="goal-row-label">Sessions today</span>
                <strong>{profile.daily.sessions}</strong>
              </div>
              <button type="button" className="text-link" onClick={() => navigate('stats')}>
                View statistics <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </Card>

        <div className="stat-grid">
          <StatTile
            label="Best speed"
            value={Math.round(profile.personalBests.wpm)}
            unit="wpm"
            icon={<Gauge size={17} />}
            hint={
              <span className={`trend ${trend >= 0 ? 'is-up' : 'is-down'}`}>
                {trend >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                {trend === 0 ? 'Building a baseline' : `${trend > 0 ? '+' : ''}${trend.toFixed(0)}% recent trend`}
              </span>
            }
          >
            <Sparkline values={wpmHistory} tone="accent" />
          </StatTile>
          <StatTile
            label="Accuracy"
            value={avgAccuracy ? avgAccuracy.toFixed(1) : '—'}
            unit="%"
            icon={<Target size={17} />}
            hint="Average of your last ten sessions"
          >
            <Sparkline values={accuracyHistory} tone="good" />
          </StatTile>
          <StatTile
            label="Practice time"
            value={formatDuration(profile.totalPracticeMs, true)}
            icon={<Timer size={17} />}
            hint={`${sessions.length} session${sessions.length === 1 ? '' : 's'} logged locally`}
          />
          <StatTile
            label="Lessons complete"
            value={completed}
            unit={`/${TOTAL_LESSONS}`}
            icon={<Trophy size={17} />}
            hint={`${unlockedCount} achievements unlocked`}
          >
            <ProgressBar value={completion} />
          </StatTile>
        </div>

        <Card
          className="trend-card"
          title="Performance trend"
          subtitle="Every session is stored on this device."
          action={
            <Segmented
              ariaLabel="Chart metric"
              size="sm"
              value={metric}
              onChange={setMetric}
              options={[
                { value: 'wpm', label: 'Speed' },
                { value: 'accuracy', label: 'Accuracy' },
              ]}
            />
          }
        >
          <LineChart
            data={chartData}
            height={200}
            suffix={metric === 'wpm' ? ' wpm' : '%'}
            goal={metric === 'wpm' ? profile.settings.targetWpm : profile.settings.targetAccuracy}
          />
          <div className="chart-foot">
            <span>Last {chartData.length} sessions</span>
            <span className="muted">Personal best {Math.round(profile.personalBests.wpm)} wpm</span>
          </div>
        </Card>

        <Card
          className="weak-card"
          title="Targeted practice"
          subtitle="Keys with the highest error rate and slowest response."
          action={
            <Button variant="ghost" size="sm" trailing={<ArrowRight size={14} />} onClick={() => navigate('review')}>
              Review
            </Button>
          }
        >
          {weakKeys.length > 0 ? (
            <>
              <div className="key-chips large">
                {weakKeys.map((key) => (
                  <kbd key={key}>{niceKey(key)}</kbd>
                ))}
              </div>
              <p className="muted small">
                The adaptive engine prioritises these keys in drills and moves them to the front of your review queue.
              </p>
              <Button variant="soft" size="sm" onClick={() => navigate('review')}>
                Train weak keys
              </Button>
            </>
          ) : (
            <div className="weak-empty">
              <span className="weak-empty-icon"><Sparkles size={20} /></span>
              <div>
                <strong>No weak keys detected yet</strong>
                <p className="muted small">Complete a few sessions and Keyflow will map exactly where you slow down.</p>
              </div>
            </div>
          )}
        </Card>

        <Card
          className="recent-card"
          title="Recent activity"
          action={
            <Button variant="ghost" size="sm" trailing={<ArrowRight size={14} />} onClick={() => navigate('stats')}>
              All stats
            </Button>
          }
        >
          {recent.length === 0 ? (
            <div className="recent-empty">
              <p>No sessions yet. Your first lesson is waiting.</p>
              <Button variant="soft" size="sm" onClick={() => navigate('learn', nextLesson.id)}>
                Begin lesson one
              </Button>
            </div>
          ) : (
            <ul className="session-list">
              {recent.map((session) => (
                <li key={session.id}>
                  <span className={`session-dot kind-${session.kind}`} aria-hidden="true" />
                  <div className="session-info">
                    <strong>{session.label}</strong>
                    <span>{timeAgo(session.startedAt)} · {formatDuration(session.durationMs, true)}</span>
                  </div>
                  <div className="session-numbers">
                    <strong>{Math.round(session.wpm)} wpm</strong>
                    <span>{session.accuracy.toFixed(0)}%</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card
          className="ach-strip"
          title="Next achievements"
          action={
            <Button variant="ghost" size="sm" trailing={<ArrowRight size={14} />} onClick={() => navigate('achievements')}>
              {unlockedCount} unlocked
            </Button>
          }
        >
          <div className="ach-mini-grid">
            {nextAchievements.map(({ achievement, progress }) => (
              <div className="ach-mini" key={achievement.id}>
                <span className={`ach-icon tier-${achievement.tier}`}>
                  <AchievementIcon name={achievement.icon} size={17} />
                </span>
                <div>
                  <strong>{achievement.title}</strong>
                  <span>{Math.round(progress.current)} / {Math.round(progress.goal)}</span>
                  <ProgressBar value={(progress.current / progress.goal) * 100} height={4} />
                </div>
              </div>
            ))}
            {nextAchievements.length === 0 && <p className="muted small">Every achievement unlocked. Extraordinary.</p>}
          </div>
        </Card>
      </div>

      <p className="dash-foot">
        {CURRICULUM.length} units · {TOTAL_LESSONS} lessons · no account, no cloud, no subscription.
      </p>
    </div>
  );
}
