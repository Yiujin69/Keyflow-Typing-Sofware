import { ArrowRight, Crown, Gauge, Quote, Sparkles, Target, Timer, TriangleAlert, Type } from 'lucide-react';
import { useMemo, useState } from 'react';
import { SessionSurface } from '../components/SessionSurface';
import { SessionResults } from '../components/SessionResults';
import { Badge, Button, Card, Segmented, Switch } from '../components/ui';
import { getLayout } from '../lib/layouts';
import { makeTypeable } from '../lib/typeable';
import { formatDuration } from '../lib/metrics';
import { playStart } from '../lib/sound';
import { useStore } from '../lib/store';
import { buildTestText } from '../lib/textgen';
import type { RecordResult } from '../lib/store';
import type { SessionSummary, TestConfig, ViewId } from '../lib/types';

const DURATIONS = [15, 30, 60, 120];

export function TestView({
  navigate,
  focus,
  onToggleFocus,
}: {
  navigate: (view: ViewId, lessonId?: string) => void;
  focus: boolean;
  onToggleFocus: () => void;
}) {
  const { profile, recordSession } = useStore();
  const [stage, setStage] = useState<'config' | 'running'>('config');
  const [config, setConfig] = useState<TestConfig>({ seconds: 30, punctuation: true, numbers: false, mode: 'words' });
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 1_000_000));
  const [attempt, setAttempt] = useState(0);
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [outcome, setOutcome] = useState<RecordResult | null>(null);

  const language = profile.settings.language;
  const layoutId = profile.settings.layout;
  const prepared = useMemo(
    () => makeTypeable(stage === 'running' ? buildTestText(config, language, seed) : '', layoutId),
    [stage, config, language, seed, layoutId],
  );
  const text = prepared.text;
  const missing = prepared.missing;
  const recentTests = profile.sessions.filter((session) => session.kind === 'test').slice(0, 5);

  const start = () => {
    setStage('running');
    setSummary(null);
    setOutcome(null);
    setSeed(Math.floor(Math.random() * 1_000_000));
    setAttempt(0);
    if (profile.settings.sound) playStart(profile.settings.volume);
  };

  const handleFinish = (result: SessionSummary) => {
    const record = recordSession(result, undefined);
    setSummary(result);
    setOutcome(record);
  };

  const retry = () => {
    setSummary(null);
    setOutcome(null);
    setSeed(Math.floor(Math.random() * 1_000_000));
    setAttempt((value) => value + 1);
    if (profile.settings.sound) playStart(profile.settings.volume);
  };

  const changeOptions = () => {
    setSummary(null);
    setOutcome(null);
    setStage('config');
  };

  if (stage === 'config') {
    return (
      <div className="page test-page">
        <header className="page-head">
          <div>
            <p className="eyebrow"><Timer size={14} /> Timed challenge</p>
            <h1>Measure where you are.</h1>
            <p className="page-sub">A clean, distraction-free test with live speed, accuracy and consistency.</p>
          </div>
          <div className="test-pb">
            <Crown size={16} />
            <div>
              <span>Personal best</span>
              <strong>{Math.round(profile.personalBests.wpm)} wpm</strong>
            </div>
          </div>
        </header>

        <div className="test-layout">
          <Card className="test-config">
            <div className="config-block">
              <div className="config-label">
                <h3>Duration</h3>
                <p>How long you want to type without stopping.</p>
              </div>
              <div className="duration-grid">
                {DURATIONS.map((duration) => (
                  <button
                    key={duration}
                    type="button"
                    className={`duration-option ${config.seconds === duration ? 'is-selected' : ''}`}
                    onClick={() => setConfig((current) => ({ ...current, seconds: duration }))}
                  >
                    <strong>{duration}</strong>
                    <span>seconds</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="config-block">
              <div className="config-label">
                <h3>Text source</h3>
                <p>Random common words or a complete quotation.</p>
              </div>
              <Segmented
                ariaLabel="Test text source"
                value={config.mode}
                onChange={(mode) => setConfig((current) => ({ ...current, mode }))}
                options={[
                  { value: 'words', label: <><Type size={14} /> Words</> },
                  { value: 'quote', label: <><Quote size={14} /> Quote</> },
                ]}
              />
            </div>

            <div className="config-block">
              <div className="config-label">
                <h3>Modifiers</h3>
                <p>Add real-world variety to the generated text.</p>
              </div>
              <div className="config-switches">
                <Switch
                  label="Punctuation and capitals"
                  description="Sentence punctuation, commas and capital letters."
                  checked={config.punctuation}
                  onChange={(punctuation) => setConfig((current) => ({ ...current, punctuation }))}
                  disabled={config.mode === 'quote'}
                />
                <Switch
                  label="Include numbers"
                  description="Sprinkle digits into the word stream."
                  checked={config.numbers}
                  onChange={(numbers) => setConfig((current) => ({ ...current, numbers }))}
                  disabled={config.mode === 'quote'}
                />
              </div>
            </div>

            <div className="config-summary">
              <span><Gauge size={15} /> Target {profile.settings.targetWpm} wpm</span>
              <span><Target size={15} /> {profile.settings.targetAccuracy}% accuracy</span>
              <span><Sparkles size={15} /> {profile.settings.layout.toUpperCase()} · {language.toUpperCase()}</span>
            </div>

            <Button variant="primary" size="lg" className="test-start" onClick={start} trailing={<ArrowRight size={18} />}>
              Start {config.seconds}-second test
            </Button>
          </Card>

          <aside className="test-side">
            <Card title="Recent tests" subtitle="Your last five timed attempts.">
              {recentTests.length === 0 ? (
                <p className="muted small">No tests yet. Your first result sets the baseline.</p>
              ) : (
                <ul className="test-history">
                  {recentTests.map((test) => (
                    <li key={test.id}>
                      <div>
                        <strong>{Math.round(test.wpm)} wpm</strong>
                        <span>{test.accuracy.toFixed(0)}% · {formatDuration(test.durationMs, true)}</span>
                      </div>
                      <span className="muted small">
                        {new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(test.startedAt)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
            <Card title="A good test is honest">
              <ul className="tip-list compact">
                <li><span>01</span> Start with your hands already on the home row.</li>
                <li><span>02</span> Do not look at the keyboard. Let the on-screen cues guide you.</li>
                <li><span>03</span> Repeat the same test twice to see your true range, not a lucky run.</li>
              </ul>
            </Card>
          </aside>
        </div>
      </div>
    );
  }

  return (
    <div className={`page test-run ${focus ? 'is-focus' : ''}`}>
      <div className="test-run-head">
        <div>
          <button type="button" className="back-link" onClick={changeOptions}>
            <ArrowRight size={15} style={{ transform: 'rotate(180deg)' }} /> Test options
          </button>
          <h1>{config.seconds}s {config.mode === 'quote' ? 'quote' : 'word'} test</h1>
        </div>
        <Badge tone="accent">{profile.settings.layout.toUpperCase()}</Badge>
      </div>

      {missing.length > 0 && (
        <div className="warn-banner">
          <TriangleAlert size={17} />
          <div>
            <strong>Some characters are unavailable on this layout</strong>
            <p>Missing: {missing.slice(0, 8).map((char) => `“${char}”`).join(', ')}. Choose a different language in Settings.</p>
          </div>
          <Button variant="soft" size="sm" onClick={() => navigate('settings')}>Settings</Button>
        </div>
      )}

      <SessionSurface
        key={`test-${seed}-${attempt}`}
        text={text}
        kind="test"
        refId={`test-${config.seconds}`}
        label={`${config.seconds}s ${config.mode} test`}
        mode="timed"
        seconds={config.seconds}
        onFinish={handleFinish}
        onRestart={() => setSummary(null)}
        focus={focus}
        onToggleFocus={onToggleFocus}
        headerExtra={
          <>
            <Badge tone="neutral">{config.punctuation ? 'Punctuation on' : 'Letters only'}</Badge>
            {prepared.simplified > 0 && <Badge tone="warn">Accents adapted to {getLayout(layoutId).name}</Badge>}
          </>
        }
      />

      <SessionResults
        open={Boolean(summary)}
        summary={summary}
        unlocked={outcome?.unlocked}
        beatWpm={outcome?.beatWpm}
        beatAccuracy={outcome?.beatAccuracy}
        onRetry={retry}
        onNext={changeOptions}
        nextLabel="Change options"
        onClose={() => setSummary(null)}
      />
    </div>
  );
}
