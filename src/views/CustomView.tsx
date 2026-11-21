import { ArrowRight, FileText, KeyRound, PenLine, Play, RotateCcw, Shuffle, Sparkles, TriangleAlert } from 'lucide-react';
import { useMemo, useState } from 'react';
import { SessionSurface } from '../components/SessionSurface';
import { SessionResults } from '../components/SessionResults';
import { Button, Card, Segmented, Switch } from '../components/ui';
import { getPack } from '../lib/words';
import { missingChars } from '../lib/layouts';
import { useStore } from '../lib/store';
import { buildWeakKeyDrill, normalizeCustomText } from '../lib/textgen';
import { makeTypeable } from '../lib/typeable';
import type { RecordResult } from '../lib/store';
import type { SessionSummary, ViewId } from '../lib/types';

type Source = 'text' | 'weak';

export function CustomView({
  navigate,
  focus,
  onToggleFocus,
}: {
  navigate: (view: ViewId, lessonId?: string) => void;
  focus: boolean;
  onToggleFocus: () => void;
}) {
  const { profile, weakKeys, recordSession, updateSettings } = useStore();
  const [source, setSource] = useState<Source>('text');
  const [draft, setDraft] = useState('');
  const [seconds, setSeconds] = useState(0);
  const [strict, setStrict] = useState(profile.settings.strict);
  const [stage, setStage] = useState<'config' | 'running'>('config');
  const [sessionText, setSessionText] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [outcome, setOutcome] = useState<RecordResult | null>(null);

  const pack = getPack(profile.settings.language);
  const normalized = normalizeCustomText(draft);
  const charCount = normalized.length;
  const missing = missingChars(profile.settings.layout, stage === 'running' ? sessionText : normalized);
  const canStart = source === 'weak' ? true : charCount >= 20;

  const preview = useMemo(() => normalized.slice(0, 120), [normalized]);

  const start = () => {
    const raw =
      source === 'weak'
        ? buildWeakKeyDrill(weakKeys.length ? weakKeys.slice(0, 5) : ['f', 'j', 'd', 'k'], profile.settings.language, Math.floor(Math.random() * 1_000_000))
        : normalized;
    const text = source === 'weak' ? makeTypeable(raw, profile.settings.layout).text : raw;
    if (!text || text.length < 5) return;
    setSessionText(text);
    setSummary(null);
    setOutcome(null);
    setAttempt((value) => value + 1);
    setStage('running');
  };

  const handleFinish = (result: SessionSummary) => {
    const record = recordSession(result, undefined);
    setSummary(result);
    setOutcome(record);
  };

  const retry = () => {
    setSummary(null);
    setOutcome(null);
    setAttempt((value) => value + 1);
  };

  const backToConfig = () => {
    setSummary(null);
    setOutcome(null);
    setStage('config');
  };

  if (stage === 'running') {
    return (
      <div className={`page custom-page ${focus ? 'is-focus' : ''}`}>
        <header className="lesson-head">
          <button type="button" className="back-link" onClick={backToConfig}>
            <ArrowRight size={16} style={{ transform: 'rotate(180deg)' }} /> Customize
          </button>
          <div className="lesson-head-main">
            <div>
              <p className="eyebrow"><PenLine size={13} /> Custom practice</p>
              <h1>{source === 'weak' ? 'Weak-key session' : 'Your own text'}</h1>
              <p className="page-sub">{sessionText.split(' ').length} words · {seconds === 0 ? 'untimed' : `${seconds}s limit`}</p>
            </div>
          </div>
        </header>

        {missing.length > 0 && (
          <div className="warn-banner">
            <TriangleAlert size={17} />
            <div>
              <strong>Some characters cannot be typed on this layout</strong>
              <p>Missing: {missing.slice(0, 8).map((char) => `“${char}”`).join(', ')}</p>
            </div>
            <Button variant="soft" size="sm" onClick={() => navigate('settings')}>Settings</Button>
          </div>
        )}

        <SessionSurface
          key={`custom-${attempt}`}
          text={sessionText}
          kind="custom"
          refId="custom"
          label={source === 'weak' ? 'Weak-key session' : 'Custom text'}
          mode={seconds > 0 ? 'timed' : 'lesson'}
          seconds={seconds || undefined}
          onFinish={handleFinish}
          onRestart={() => setSummary(null)}
          focus={focus}
          onToggleFocus={onToggleFocus}
          strictOverride={strict}
        />

        <SessionResults
          open={Boolean(summary)}
          summary={summary}
          unlocked={outcome?.unlocked}
          beatWpm={outcome?.beatWpm}
          beatAccuracy={outcome?.beatAccuracy}
          onRetry={retry}
          onNext={backToConfig}
          nextLabel="New text"
          onClose={() => setSummary(null)}
        />
      </div>
    );
  }

  return (
    <div className="page custom-page">
      <header className="page-head">
        <div>
          <p className="eyebrow"><PenLine size={14} /> Your material</p>
          <h1>Practise exactly what you need.</h1>
          <p className="page-sub">Paste notes, code comments, a poem or a work document. Everything stays on this device.</p>
        </div>
      </header>

      <div className="custom-layout">
        <Card className="custom-editor-card">
          <div className="editor-head">
            <Segmented
              ariaLabel="Practice text source"
              value={source}
              onChange={setSource}
              options={[
                { value: 'text', label: <><FileText size={14} /> My text</> },
                { value: 'weak', label: <><KeyRound size={14} /> Weak keys</> },
              ]}
            />
            <div className="editor-tools">
              <Button
                variant="ghost"
                size="sm"
                icon={<Shuffle size={14} />}
                onClick={() => {
                  setSource('text');
                  setDraft(pack.paragraphs[Math.floor(Math.random() * pack.paragraphs.length)] ?? '');
                }}
              >
                Random paragraph
              </Button>
              {draft && (
                <Button variant="ghost" size="sm" onClick={() => setDraft('')}>
                  Clear
                </Button>
              )}
            </div>
          </div>

          {source === 'text' ? (
            <>
              <label htmlFor="custom-text" className="sr-only">Custom practice text</label>
              <textarea
                id="custom-text"
                className="custom-textarea"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Paste or type the text you want to practise here. At least 20 characters."
                rows={12}
                spellCheck={false}
                autoFocus
              />
              <div className="editor-foot">
                <span>{charCount} characters · {normalized ? normalized.split(' ').length : 0} words</span>
                <span className="muted">{source === 'text' && charCount > 0 && charCount < 20 ? 'Add a little more text to begin.' : 'Line breaks become spaces.'}</span>
              </div>
              {preview && (
                <div className="editor-preview">
                  <span>Preview</span>
                  <p>{preview}{normalized.length > 120 ? '…' : ''}</p>
                </div>
              )}
            </>
          ) : (
            <div className="weak-source">
              <span className="weak-source-icon"><KeyRound size={26} /></span>
              <h3>Generated from your weak keys</h3>
              <p>
                {weakKeys.length > 0
                  ? 'A fresh drill will be built around the keys where you make the most mistakes.'
                  : 'Not enough data yet — Keyflow will start with the home-row anchors.'}
              </p>
              <div className="key-chips large">
                {(weakKeys.length ? weakKeys : ['a', 's', 'd', 'f']).map((key) => (
                  <kbd key={key}>{key}</kbd>
                ))}
              </div>
            </div>
          )}
        </Card>

        <aside className="custom-side">
          <Card title="Session options">
            <div className="option-group">
              <span className="option-label">Time limit</span>
              <Segmented
                ariaLabel="Custom session time limit"
                value={seconds}
                onChange={setSeconds}
                options={[
                  { value: 0, label: 'None' },
                  { value: 60, label: '1 min' },
                  { value: 120, label: '2 min' },
                  { value: 300, label: '5 min' },
                ]}
              />
            </div>
            <Switch
              label="Strict mode"
              description="A wrong key will not advance the cursor until you correct it."
              checked={strict}
              onChange={(value) => {
                setStrict(value);
                updateSettings({ strict: value });
              }}
            />
            <div className="option-group">
              <span className="option-label">Layout</span>
              <p className="muted small">{profile.settings.layout.toUpperCase()} · switch in Settings</p>
            </div>
            <Button variant="primary" size="lg" icon={<Play size={17} />} disabled={!canStart} onClick={start} className="custom-start">
              Start practising
            </Button>
            {!canStart && <p className="muted small center">Enter at least 20 characters.</p>}
          </Card>

          <Card title="A note on privacy" className="soft-card">
            <p className="muted small">
              Custom text is never uploaded. It is used only in memory for this session and is not written to your
              profile or history beyond session statistics.
            </p>
          </Card>

          <Card title="Try a focused drill">
            <p className="muted small">Want structure instead? The adaptive review builds short drills automatically.</p>
            <Button variant="soft" size="sm" icon={<Sparkles size={15} />} onClick={() => navigate('review')} trailing={<ArrowRight size={14} />}>
              Open review
            </Button>
            <Button variant="ghost" size="sm" icon={<RotateCcw size={14} />} onClick={() => setDraft(pack.sentences.slice(0, 3).join(' '))}>
              Load three sentences
            </Button>
          </Card>
        </aside>
      </div>
    </div>
  );
}
