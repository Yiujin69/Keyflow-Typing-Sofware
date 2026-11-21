import { Check, Download, HardDrive, Keyboard, Languages, Palette, RotateCcw, ShieldCheck, SlidersHorizontal, Upload, Volume2, VolumeX } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Badge, Button, Card, Modal, Segmented, Switch } from '../components/ui';
import { LAYOUT_META } from '../lib/layouts';
import { playKey, playStart } from '../lib/sound';
import { useStore } from '../lib/store';
import { exportProfileFile, importProfileFile, isDesktop } from '../lib/storage';
import { LANGUAGE_PACKS } from '../lib/words';
import type { LayoutId, LanguageId, SoundPack, ThemeMode, ViewId } from '../lib/types';

type Status = { tone: 'good' | 'bad'; text: string } | null;

export function SettingsView({ navigate }: { navigate: (view: ViewId, lessonId?: string) => void }) {
  const { profile, updateSettings, importProfile, resetProgress } = useStore();
  const settings = profile.settings;
  const [status, setStatus] = useState<Status>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const statusTimer = useRef<number | null>(null);

  const notify = (tone: 'good' | 'bad', text: string) => {
    setStatus({ tone, text });
    if (statusTimer.current) window.clearTimeout(statusTimer.current);
    statusTimer.current = window.setTimeout(() => setStatus(null), 4000);
  };

  const handleExport = async () => {
    const ok = await exportProfileFile(profile);
    notify(ok ? 'good' : 'bad', ok ? 'Progress exported as a JSON file.' : 'Export was cancelled or could not be written.');
  };

  const handleImport = async () => {
    const text = await importProfileFile();
    if (!text) {
      notify('bad', 'No file selected.');
      return;
    }
    const ok = importProfile(text);
    notify(ok ? 'good' : 'bad', ok ? 'Progress imported and restored.' : 'That file is not a valid Keyflow profile.');
  };

  useEffect(() => {
    return () => {
      if (statusTimer.current) window.clearTimeout(statusTimer.current);
    };
  }, []);

  return (
    <div className="page settings-page">
      <header className="page-head">
        <div>
          <p className="eyebrow"><SlidersHorizontal size={14} /> Preferences</p>
          <h1>Make it fit your hands.</h1>
          <p className="page-sub">Every setting is stored locally with your progress. Nothing is synced or transmitted.</p>
        </div>
        {status && <div className={`status-pill is-${status.tone}`}>{status.text}</div>}
      </header>

      <div className="settings-layout">
        <div className="settings-main">
          <Card title={<span className="settings-title"><Palette size={17} /> Appearance</span>} subtitle="Light, dark, or follow the operating system.">
            <div className="setting-block">
              <span className="setting-label">Theme</span>
              <Segmented
                ariaLabel="Theme"
                value={settings.theme}
                onChange={(theme: ThemeMode) => updateSettings({ theme })}
                options={[
                  { value: 'system', label: 'System' },
                  { value: 'light', label: 'Light' },
                  { value: 'dark', label: 'Dark' },
                ]}
              />
            </div>
            <div className="setting-block">
              <span className="setting-label">Cursor style</span>
              <Segmented
                ariaLabel="Cursor style"
                value={settings.caretStyle}
                onChange={(caretStyle: 'line' | 'block' | 'underline') => updateSettings({ caretStyle })}
                options={[
                  { value: 'line', label: 'Line' },
                  { value: 'block', label: 'Block' },
                  { value: 'underline', label: 'Underline' },
                ]}
              />
            </div>
            <div className="setting-block">
              <label className="setting-label" htmlFor="font-scale">Text size <span>{Math.round(settings.fontScale * 100)}%</span></label>
              <input
                id="font-scale"
                type="range"
                min={0.85}
                max={1.35}
                step={0.05}
                value={settings.fontScale}
                onChange={(event) => updateSettings({ fontScale: Number(event.target.value) })}
                className="range"
              />
              <p className="muted small">Scales the typing surface and the interface typography.</p>
            </div>
            <Switch
              label="Reduce motion"
              description="Removes animated transitions and celebration effects."
              checked={settings.reduceMotion}
              onChange={(reduceMotion) => updateSettings({ reduceMotion })}
            />
          </Card>

          <Card title={<span className="settings-title"><Keyboard size={17} /> Keyboard layout</span>} subtitle="The physical arrangement your fingers follow.">
            <div className="layout-grid">
              {LAYOUT_META.map((layout) => (
                <button
                  type="button"
                  key={layout.id}
                  className={`layout-option ${settings.layout === layout.id ? 'is-selected' : ''}`}
                  onClick={() => updateSettings({ layout: layout.id as LayoutId })}
                  aria-pressed={settings.layout === layout.id}
                >
                  <span className="layout-option-top">
                    <strong>{layout.name}</strong>
                    {settings.layout === layout.id && <Check size={16} />}
                  </span>
                  <span className="layout-region">{layout.region}</span>
                  <span className="layout-blurb">{layout.blurb}</span>
                </button>
              ))}
            </div>
          </Card>

          <Card title={<span className="settings-title"><Languages size={17} /> Lesson language</span>} subtitle="Word lists, sentences, paragraphs and quotes are bundled offline.">
            <div className="language-row">
              <Segmented
                ariaLabel="Lesson language"
                value={settings.language}
                onChange={(language: LanguageId) => updateSettings({ language })}
                options={(Object.keys(LANGUAGE_PACKS) as LanguageId[]).map((id) => ({
                  value: id,
                  label: (
                    <>
                      {LANGUAGE_PACKS[id].nativeName}
                      <span className="lang-code">{id.toUpperCase()}</span>
                    </>
                  ),
                }))}
              />
            </div>
            <p className="muted small">
              {LAYOUT_META.find((layout) => layout.id === settings.layout)?.name} can produce{' '}
              {settings.language === 'de' && settings.layout !== 'qwertz'
                ? 'most, but not all, German characters. Umlauts need QWERTZ or a layout with those glyphs.'
                : settings.language === 'es'
                  ? 'the Spanish word list. Accented characters are avoided in drills so every lesson stays typeable.'
                  : 'the English word list, sentences and paragraphs.'}
            </p>
          </Card>

          <Card title="Typing behaviour" subtitle="Tune how strict and how visual the practice feels.">
            <div className="settings-switch-grid">
              <Switch label="On-screen keyboard" description="Show the live keyboard while practising." checked={settings.showKeyboard} onChange={(showKeyboard) => updateSettings({ showKeyboard })} />
              <Switch label="Hand guide" description="Highlight the active finger on a hand diagram." checked={settings.showHands} onChange={(showHands) => updateSettings({ showHands })} />
              <Switch label="Finger colour hints" description="Colour-code every key by the finger that presses it." checked={settings.showFingerHints} onChange={(showFingerHints) => updateSettings({ showFingerHints })} />
              <Switch label="Key legends" description="Show letters and symbols on the on-screen keyboard." checked={settings.showKeyboardLetters} onChange={(showKeyboardLetters) => updateSettings({ showKeyboardLetters })} />
              <Switch label="Next-key cue" description="Name the next key and the finger to use." checked={settings.nextKeyCue} onChange={(nextKeyCue) => updateSettings({ nextKeyCue })} />
              <Switch label="Live speed" description="Show WPM updating as you type." checked={settings.liveWpm} onChange={(liveWpm) => updateSettings({ liveWpm })} />
              <Switch label="Strict mode" description="Mistakes stop the cursor until you press the right key." checked={settings.strict} onChange={(strict) => updateSettings({ strict })} />
            </div>
          </Card>

          <Card title="Goals and targets" subtitle="Used for star ratings, chart goal lines and daily streaks.">
            <div className="goal-settings">
              <div className="setting-block">
                <label className="setting-label" htmlFor="goal-minutes">Daily practice goal <span>{settings.dailyGoalMin} minutes</span></label>
                <input id="goal-minutes" type="range" min={1} max={120} step={1} value={settings.dailyGoalMin} onChange={(event) => updateSettings({ dailyGoalMin: Number(event.target.value) })} className="range" />
              </div>
              <div className="setting-block">
                <label className="setting-label" htmlFor="target-wpm">Target speed <span>{settings.targetWpm} wpm</span></label>
                <input id="target-wpm" type="range" min={10} max={140} step={1} value={settings.targetWpm} onChange={(event) => updateSettings({ targetWpm: Number(event.target.value) })} className="range" />
              </div>
              <div className="setting-block">
                <label className="setting-label" htmlFor="target-accuracy">Target accuracy <span>{settings.targetAccuracy}%</span></label>
                <input id="target-accuracy" type="range" min={85} max={100} step={1} value={settings.targetAccuracy} onChange={(event) => updateSettings({ targetAccuracy: Number(event.target.value) })} className="range" />
              </div>
            </div>
          </Card>

          <Card title="Sound" subtitle="Synthesised locally with the Web Audio API — no audio files, no downloads.">
            <Switch label="Typing sounds" description="Subtle key clicks and a soft error tone." checked={settings.sound} onChange={(sound) => updateSettings({ sound })} />
            <div className={`sound-controls ${settings.sound ? '' : 'is-disabled'}`}>
              <div className="setting-block">
                <label className="setting-label" htmlFor="volume">Volume <span>{Math.round(settings.volume * 100)}%</span></label>
                <div className="volume-row">
                  {settings.volume > 0 ? <Volume2 size={16} /> : <VolumeX size={16} />}
                  <input id="volume" type="range" min={0} max={1} step={0.05} value={settings.volume} onChange={(event) => updateSettings({ volume: Number(event.target.value) })} className="range" />
                </div>
              </div>
              <div className="setting-block">
                <span className="setting-label">Sound character</span>
                <Segmented
                  ariaLabel="Sound pack"
                  value={settings.soundPack}
                  onChange={(soundPack: SoundPack) => updateSettings({ soundPack })}
                  options={[
                    { value: 'soft', label: 'Soft' },
                    { value: 'mechanical', label: 'Mechanical' },
                    { value: 'minimal', label: 'Minimal' },
                  ]}
                />
              </div>
              <Button
                variant="soft"
                size="sm"
                icon={<Volume2 size={15} />}
                onClick={() => {
                  if (settings.sound) playKey(settings.soundPack, Math.max(0.2, settings.volume), 1);
                  playStart(settings.volume);
                }}
                disabled={!settings.sound}
              >
                Preview sound
              </Button>
            </div>
          </Card>
        </div>

        <aside className="settings-side">
          <Card title={<span className="settings-title"><HardDrive size={17} /> Your data</span>} subtitle="A single JSON profile, stored on this computer.">
            <div className="data-stats">
              <div><span>Profile created</span><strong>{new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(profile.createdAt)}</strong></div>
              <div><span>Sessions stored</span><strong>{profile.sessions.length}</strong></div>
              <div><span>Practice time</span><strong>{Math.round(profile.totalPracticeMs / 60_000)} min</strong></div>
            </div>
            <div className="data-actions">
              <Button variant="soft" size="sm" icon={<Download size={15} />} onClick={handleExport}>Export progress</Button>
              <Button variant="soft" size="sm" icon={<Upload size={15} />} onClick={handleImport}>Import progress</Button>
            </div>
            <p className="muted small">
              {isDesktop()
                ? 'Stored in the app’s user-data folder. Export creates a portable JSON backup you can carry to another machine.'
                : 'Stored in this browser’s local storage. Export a JSON backup before clearing site data.'}
            </p>
          </Card>

          <Card title="Maintenance" className="soft-card">
            <p className="muted small">Resetting clears lessons, sessions, statistics and achievements. Your preferences stay.</p>
            <Button variant="danger" size="sm" icon={<RotateCcw size={15} />} onClick={() => setConfirmReset(true)}>
              Reset all progress
            </Button>
          </Card>

          <Card className="about-card">
            <div className="about-head">
              <span className="brand-mark small"><span className="brand-key brand-key-1">K</span><span className="brand-key brand-key-2">F</span></span>
              <div>
                <strong>Keyflow</strong>
                <span>Version 1.0.0</span>
              </div>
            </div>
            <div className="about-badges">
              <Badge tone="good"><ShieldCheck size={12} /> Offline first</Badge>
              <Badge tone="neutral">{isDesktop() ? 'Desktop app' : 'Local web app'}</Badge>
            </div>
            <p className="muted small">
              No accounts, analytics, remote fonts, tracking or network calls. Lessons, layouts, sounds and progress all
              live on this device.
            </p>
            <Button variant="ghost" size="sm" onClick={() => navigate('fingers')}>Open finger guide</Button>
          </Card>
        </aside>
      </div>

      <Modal
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title="Reset all progress?"
        subtitle="This cannot be undone, but you can export a backup first."
        footer={
          <div className="results-actions">
            <Button variant="outline" onClick={() => setConfirmReset(false)}>Cancel</Button>
            <Button
              variant="danger"
              onClick={() => {
                resetProgress();
                setConfirmReset(false);
                notify('good', 'All progress has been reset.');
              }}
            >
              Reset everything
            </Button>
          </div>
        }
      >
        <p>
          You will lose <strong>{profile.lessonsCompleted} completed lessons</strong>, <strong>{profile.sessions.length} sessions</strong>,
          all per-key statistics, <strong>{Object.keys(profile.achievements).length} achievements</strong> and your{' '}
          <strong>{profile.streak.current}-day streak</strong>. Preferences and keyboard layout are kept.
        </p>
      </Modal>
    </div>
  );
}
