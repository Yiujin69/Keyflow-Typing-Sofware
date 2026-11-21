import { Activity, BarChart3, CalendarDays, Crown, Flame, Gauge, Keyboard as KeyboardIcon, Target, Timer, TrendingUp } from 'lucide-react';
import { useMemo } from 'react';
import { BarChart, HeatScale, LineChart } from '../components/Charts';
import { Keyboard } from '../components/Keyboard';
import { Button, Card, EmptyState, StatTile } from '../components/ui';
import { formatDuration, keyAccuracy, niceKey, shiftDayKey } from '../lib/metrics';
import { useStore } from '../lib/store';
import type { ViewId } from '../lib/types';

function shortDate(key: string): string {
  const [, month, day] = key.split('-');
  return `${Number(month)}/${Number(day)}`;
}

export function StatsView({ navigate }: { navigate: (view: ViewId, lessonId?: string) => void }) {
  const { profile } = useStore();
  const sessions = profile.sessions;

  const chronological = useMemo(() => sessions.slice(0, 40).reverse(), [sessions]);
  const wpmSeries = chronological.map((session) => ({
    label: new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(session.startedAt),
    value: session.wpm,
  }));
  const accuracySeries = chronological.map((session) => ({
    label: new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(session.startedAt),
    value: session.accuracy,
  }));

  const days = useMemo(() => {
    const history = new Map(profile.dailyHistory.map((item) => [item.date, item.ms]));
    history.set(profile.daily.date, profile.daily.ms);
    return Array.from({ length: 14 }, (_, index) => {
      const date = shiftDayKey(-(13 - index));
      return { label: shortDate(date), value: Math.round((history.get(date) ?? 0) / 60_000), date };
    });
  }, [profile.dailyHistory, profile.daily]);

  const perKey = useMemo(
    () =>
      Object.entries(profile.keyStats)
        .filter(([key]) => key !== ' ')
        .map(([key, stat]) => ({ key, accuracy: keyAccuracy(stat), attempts: stat.correct + stat.errors }))
        .filter((item) => item.attempts >= 3),
    [profile.keyStats],
  );

  const weakest = useMemo(() => perKey.slice().sort((a, b) => a.accuracy - b.accuracy).slice(0, 8), [perKey]);
  const strongest = useMemo(() => perKey.slice().sort((a, b) => b.accuracy - a.accuracy).slice(0, 8), [perKey]);

  const kindStats = useMemo(() => {
    const kinds = ['lesson', 'test', 'review', 'custom'] as const;
    return kinds.map((kind) => {
      const matching = sessions.filter((session) => session.kind === kind);
      return {
        kind,
        count: matching.length,
        avgWpm: matching.length ? matching.reduce((sum, item) => sum + item.wpm, 0) / matching.length : 0,
      };
    });
  }, [sessions]);

  if (sessions.length === 0) {
    return (
      <div className="page stats-page">
        <header className="page-head">
          <div>
            <p className="eyebrow"><BarChart3 size={14} /> Local analytics</p>
            <h1>Your numbers, once you start.</h1>
            <p className="page-sub">Every keystroke is measured locally. Nothing leaves this computer.</p>
          </div>
        </header>
        <Card>
          <EmptyState
            icon={<Activity size={22} />}
            title="No practice data yet"
            action={<Button variant="primary" onClick={() => navigate('learn')}>Start your first lesson</Button>}
          >
            Speed, accuracy, consistency, per-key latency and daily volume will appear here after your first session.
          </EmptyState>
        </Card>
      </div>
    );
  }

  return (
    <div className="page stats-page">
      <header className="page-head">
        <div>
          <p className="eyebrow"><BarChart3 size={14} /> Local analytics</p>
          <h1>Progress you can actually see.</h1>
          <p className="page-sub">
            {sessions.length} sessions · {formatDuration(profile.totalPracticeMs)} of focused practice · all stored on this device.
          </p>
        </div>
        <div className="page-actions">
          <Button variant="outline" icon={<Timer size={16} />} onClick={() => navigate('test')}>Take a test</Button>
        </div>
      </header>

      <div className="stat-grid stats-tiles">
        <StatTile label="Best speed" value={Math.round(profile.personalBests.wpm)} unit="wpm" icon={<Crown size={17} />} hint="All-time personal best" />
        <StatTile label="Best accuracy" value={profile.personalBests.accuracy.toFixed(1)} unit="%" icon={<Target size={17} />} hint="Single session record" />
        <StatTile label="Current streak" value={profile.streak.current} unit="days" icon={<Flame size={17} />} hint={`Best ${profile.streak.best} days`} />
        <StatTile label="Practice time" value={formatDuration(profile.totalPracticeMs, true)} icon={<Timer size={17} />} hint={`${profile.daily.sessions} sessions today`} />
        <StatTile label="Typed characters" value={sessions.reduce((sum, session) => sum + session.totalKeystrokes, 0).toLocaleString()} icon={<KeyboardIcon size={17} />} hint="Across every session" />
        <StatTile label="Lessons complete" value={profile.lessonsCompleted} unit="/38" icon={<CalendarDays size={17} />} hint={`${profile.testsCompleted} timed tests`} />
      </div>

      <div className="charts-grid">
        <Card title="Speed over time" subtitle="Every completed session, oldest to newest.">
          <LineChart data={wpmSeries} height={210} suffix=" wpm" goal={profile.settings.targetWpm} />
        </Card>
        <Card title="Accuracy over time" subtitle="Consistency matters more than raw speed.">
          <LineChart data={accuracySeries} height={210} suffix="%" goal={profile.settings.targetAccuracy} />
        </Card>
      </div>

      <div className="stats-split">
        <Card title="Practice volume" subtitle="Focused minutes across the last fourteen days.">
          <BarChart data={days} unit="m" goal={profile.settings.dailyGoalMin} />
        </Card>
        <Card title="Session mix" subtitle="Where your practice time goes.">
          <div className="kind-list">
            {kindStats.map((item) => (
              <div className="kind-row" key={item.kind}>
                <span className={`kind-dot kind-${item.kind}`} />
                <span className="kind-name">{item.kind}</span>
                <span className="kind-bar">
                  <span style={{ width: `${sessions.length ? (item.count / sessions.length) * 100 : 0}%` }} />
                </span>
                <strong>{item.count}</strong>
                <span className="muted">{item.avgWpm ? `${Math.round(item.avgWpm)} wpm` : '—'}</span>
              </div>
            ))}
          </div>
          <div className="chart-foot">
            <span className="muted small">Average consistency {Math.round(sessions.reduce((sum, s) => sum + s.consistency, 0) / sessions.length)}%</span>
          </div>
        </Card>
      </div>

      <Card
        title="Key accuracy map"
        subtitle="Dark blue means precise and fast; warm colours need attention."
        action={<span className="muted small">{perKey.length} keys measured</span>}
      >
        <div className="keymap-layout">
          <Keyboard layoutId={profile.settings.layout} showLetters heatmap={profile.keyStats} compact />
          <div className="keymap-side">
            <div className="keymap-block">
              <h4><TrendingUp size={14} /> Strongest keys</h4>
              <HeatScale items={strongest.slice(0, 4)} />
            </div>
            <div className="keymap-block">
              <h4><Gauge size={14} /> Needs work</h4>
              <HeatScale items={weakest.slice(0, 4)} />
            </div>
            <p className="muted small">
              Weakest key right now: {weakest.length ? <kbd>{niceKey(weakest[0].key)}</kbd> : 'not enough data'}
            </p>
          </div>
        </div>
      </Card>

      <Card title="Session log" subtitle="The most recent twenty sessions.">
        <div className="log-table-wrap">
          <table className="log-table">
            <thead>
              <tr>
                <th>When</th>
                <th>Type</th>
                <th>Session</th>
                <th>Speed</th>
                <th>Accuracy</th>
                <th>Consistency</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {sessions.slice(0, 20).map((session) => (
                <tr key={session.id}>
                  <td>{new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(session.startedAt)}</td>
                  <td><span className={`kind-tag kind-${session.kind}`}>{session.kind}</span></td>
                  <td className="log-label">{session.label}</td>
                  <td><strong>{Math.round(session.wpm)}</strong> wpm</td>
                  <td>{session.accuracy.toFixed(1)}%</td>
                  <td>{session.consistency}%</td>
                  <td>{formatDuration(session.durationMs, true)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="muted small">Showing {Math.min(20, sessions.length)} of {sessions.length}. History keeps the latest 300 sessions.</p>
      </Card>
    </div>
  );
}
