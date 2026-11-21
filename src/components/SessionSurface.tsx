import { Hand, Keyboard as KeyboardIcon, Maximize2, Minimize2, Pause, Play, RotateCcw, Target, Timer, Volume2, VolumeX, Zap } from 'lucide-react';
import { useEffect, useRef, type ReactNode } from 'react';
import { useTyping } from '../hooks/useTyping';
import { useStore } from '../lib/store';
import { fingerForCode, fingerName, getLayout } from '../lib/layouts';
import { formatClock } from '../lib/metrics';
import { playComplete, playError, playKey, playStart } from '../lib/sound';
import type { SessionKind, SessionSummary } from '../lib/types';
import { IconButton } from './ui';
import { TypingArea } from './TypingArea';
import { Keyboard } from './Keyboard';
import { Hands } from './Hands';

export interface SessionSurfaceProps {
  text: string;
  kind: SessionKind;
  refId: string;
  label: string;
  mode: 'lesson' | 'timed';
  seconds?: number;
  onFinish: (summary: SessionSummary) => void;
  onRestart: () => void;
  focus?: boolean;
  onToggleFocus?: () => void;
  headerExtra?: ReactNode;
  showFocusToggle?: boolean;
  strictOverride?: boolean;
  children?: ReactNode;
}

export function SessionSurface({
  text,
  kind,
  refId,
  label,
  mode,
  seconds = 30,
  onFinish,
  onRestart,
  focus = false,
  onToggleFocus,
  headerExtra,
  showFocusToggle = true,
  strictOverride,
  children,
}: SessionSurfaceProps) {
  const { profile, updateSettings } = useStore();
  const settings = profile.settings;
  const handledRef = useRef(false);

  useEffect(() => {
    handledRef.current = false;
  }, [text]);

  const typing = useTyping({
    text,
    active: true,
    mode,
    seconds,
    strict: strictOverride ?? settings.strict,
    kind,
    refId,
    label,
    layout: settings.layout,
    language: settings.language,
    onKey: (correct) => {
      if (!settings.sound) return;
      if (correct) playKey(settings.soundPack, settings.volume);
      else playError(settings.volume);
    },
    onFinish: (summary) => {
      if (handledRef.current) return;
      handledRef.current = true;
      if (settings.sound) playComplete(settings.volume);
      onFinish(summary);
    },
  });

  const nextChar = typing.index < text.length ? text[typing.index] : null;
  const layout = getLayout(settings.layout);
  const key = nextChar ? layout.charMap[nextChar] : undefined;
  const finger = key ? fingerForCode(key.code) : null;
  const shiftHand = key?.shift ? (finger?.endsWith('-l') ? 'right' : 'left') : null;
  const progress = text.length ? (typing.index / text.length) * 100 : 0;

  // Escape pauses and resumes. The typing engine ignores Escape as input.
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (typing.status !== 'running') return;
      event.preventDefault();
      typing.setPaused(!typing.paused);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [typing.status, typing.paused, typing.setPaused]);

  const restart = () => {
    typing.restart();
    handledRef.current = false;
    onRestart();
    if (settings.sound) playStart(settings.volume);
  };

  return (
    <div className={`session ${focus ? 'is-focus' : ''}`}>
      <div className="session-bar">
        <div className="session-meta">
          <span className="session-label">{label}</span>
          {headerExtra}
        </div>
        <div className="session-controls">
          <div className="live-stats" role="status" aria-live="off">
            {settings.liveWpm && (
              <span className="live-stat">
                <Zap size={14} aria-hidden="true" />
                <strong>{Math.round(typing.wpm)}</strong>
                <em>wpm</em>
              </span>
            )}
            <span className="live-stat">
              <Target size={14} aria-hidden="true" />
              <strong>{typing.accuracy.toFixed(0)}</strong>
              <em>%</em>
            </span>
            <span className="live-stat">
              <Timer size={14} aria-hidden="true" />
              <strong>{typing.remainingMs !== null ? formatClock(typing.remainingMs) : formatClock(typing.elapsedMs)}</strong>
            </span>
          </div>
          <div className="session-actions">
            <IconButton
              label={settings.sound ? 'Mute sounds' : 'Enable sounds'}
              onClick={() => updateSettings({ sound: !settings.sound })}
            >
              {settings.sound ? <Volume2 size={17} /> : <VolumeX size={17} />}
            </IconButton>
            <IconButton
              label={settings.showKeyboard ? 'Hide keyboard' : 'Show keyboard'}
              active={settings.showKeyboard}
              onClick={() => updateSettings({ showKeyboard: !settings.showKeyboard })}
            >
              <KeyboardIcon size={17} />
            </IconButton>
            <IconButton
              label={settings.showHands ? 'Hide hand guide' : 'Show hand guide'}
              active={settings.showHands}
              onClick={() => updateSettings({ showHands: !settings.showHands })}
            >
              <Hand size={17} />
            </IconButton>
            {showFocusToggle && onToggleFocus && (
              <IconButton
                label={focus ? 'Exit distraction-free mode' : 'Distraction-free mode'}
                active={focus}
                onClick={onToggleFocus}
              >
                {focus ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
              </IconButton>
            )}
            <IconButton label="Restart session" onClick={restart}>
              <RotateCcw size={17} />
            </IconButton>
            <IconButton
              label={typing.paused ? 'Resume' : 'Pause'}
              onClick={() => typing.setPaused(!typing.paused)}
              disabled={typing.status !== 'running'}
            >
              {typing.paused ? <Play size={17} /> : <Pause size={17} />}
            </IconButton>
          </div>
        </div>
      </div>

      <div className="session-progress" aria-hidden="true">
        <div className={`session-progress-fill ${mode === 'timed' ? 'is-timer' : ''}`} style={{ width: `${mode === 'timed' ? 100 - (typing.remainingMs ?? 0) / (seconds * 10) : progress}%` }} />
      </div>

      <div className="session-stage">
        <TypingArea
          text={text}
          states={typing.states}
          index={typing.index}
          caretStyle={settings.caretStyle}
          fontSize={28 * settings.fontScale}
        />
        {typing.status === 'idle' && <div className="start-hint">Start typing when you are ready…</div>}
      </div>

      <div className="surface-boost" aria-live="polite">
        {finger && settings.nextKeyCue && typing.status !== 'finished' && (
          <span className="next-key-cue">
            Next: <kbd>{nextChar === ' ' ? 'space' : nextChar}</kbd> with{' '}
            <strong>{fingerName(finger)}</strong>
          </span>
        )}
        {typing.lastError > 0 && <span key={typing.lastError} className="error-flash" aria-live="assertive">Correction needed</span>}
      </div>

      {children}

      {settings.showHands && (
        <div className="hands-panel">
          <Hands layoutId={settings.layout} activeFinger={finger} shiftHand={shiftHand} compact />
        </div>
      )}
      {settings.showKeyboard && (
        <div className="keyboard-panel">
          <Keyboard
            layoutId={settings.layout}
            nextChar={nextChar}
            showLetters={settings.showKeyboardLetters}
            showFingerHints={settings.showFingerHints}
            compact
          />
        </div>
      )}

      {typing.paused && (
        <div className="pause-overlay" role="dialog" aria-modal="true" aria-label="Session paused">
          <div className="pause-card">
            <Pause size={26} />
            <h3>Paused</h3>
            <p>Your timer is on hold. Take a breath.</p>
            <div className="pause-actions">
              <button type="button" className="btn btn-primary" onClick={() => typing.setPaused(false)}>
                <Play size={16} /> Resume
              </button>
              <button type="button" className="btn btn-outline" onClick={restart}>
                <RotateCcw size={16} /> Start over
              </button>
            </div>
            <span className="pause-hint">Esc to resume</span>
          </div>
        </div>
      )}

    </div>
  );
}
