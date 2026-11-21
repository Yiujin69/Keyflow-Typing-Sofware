import { fingerName, getLayout } from '../lib/layouts';
import type { Finger, LayoutId } from '../lib/types';

interface HandsProps {
  layoutId: LayoutId;
  activeFinger?: Finger | null;
  shiftHand?: 'left' | 'right' | null;
  compact?: boolean;
  caption?: string;
}

interface FingerShape {
  id: string;
  rightId: string;
  finger: Finger;
  x: number;
  y: number;
  w: number;
  h: number;
}

const FINGERS: FingerShape[] = [
  { id: 'pinky', rightId: 'pinky-r', finger: 'pinky-l', x: 40, y: 68, w: 22, h: 58 },
  { id: 'ring', rightId: 'ring-r', finger: 'ring-l', x: 68, y: 48, w: 24, h: 78 },
  { id: 'middle', rightId: 'middle-r', finger: 'middle-l', x: 98, y: 38, w: 24, h: 88 },
  { id: 'index', rightId: 'index-r', finger: 'index-l', x: 128, y: 52, w: 24, h: 74 },
];

const HOME_CODES = ['KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyJ', 'KeyK', 'KeyL', 'Semicolon'];

function glyphsFor(layoutId: LayoutId): Record<string, string> {
  const layout = getLayout(layoutId);
  const result: Record<string, string> = {};
  for (const row of layout.rows) {
    for (const key of row) {
      if (HOME_CODES.includes(key.code)) result[key.code] = key.base.toUpperCase();
    }
  }
  return result;
}

function Hand({ side, activeFinger, shiftHand }: { side: 'left' | 'right'; activeFinger: Finger | null; shiftHand: 'left' | 'right' | null }) {
  const isRight = side === 'right';
  const active = (finger: Finger) => activeFinger === finger;
  const fingerClass = (finger: Finger, extra = '') =>
    `finger-shape ${`finger-${finger}`} ${active(finger) ? 'is-active' : ''} ${extra}`.trim();

  return (
    <g transform={isRight ? 'translate(212 0) translate(200 0) scale(-1 1)' : undefined} className={isRight ? 'hand hand-right' : 'hand hand-left'}>
      <g className={shiftHand === side ? 'palm is-shift-hand' : 'palm'}>
        <rect x="40" y="112" width="116" height="76" rx="28" className="hand-palm" />
        <rect x="76" y="180" width="46" height="28" rx="13" className="hand-wrist" />
      </g>
      {FINGERS.map((shape) => {
        const finger = isRight ? (shape.rightId as Finger) : shape.finger;
        return (
          <g key={shape.id}>
            <rect
              x={shape.x}
              y={shape.y}
              width={shape.w}
              height={shape.h}
              rx={shape.w / 2}
              className={fingerClass(finger)}
            />
          </g>
        );
      })}
      <rect
        x="120"
        y="126"
        width="54"
        height="22"
        rx="11"
        transform="rotate(27 147 137)"
        className={fingerClass(isRight ? 'thumb' : 'thumb', 'hand-thumb')}
      />
      {!isRight && (
        <g className="hand-markers">
          <circle cx="140" cy="60" r="2.6" className="home-marker" />
        </g>
      )}
      {isRight && (
        <g className="hand-markers">
          <circle cx="140" cy="60" r="2.6" className="home-marker" />
        </g>
      )}
    </g>
  );
}

export function Hands({ layoutId, activeFinger = null, shiftHand = null, compact = false, caption }: HandsProps) {
  const glyphs = glyphsFor(layoutId);
  const handSide = activeFinger?.endsWith('-l') ? 'left' : activeFinger?.endsWith('-r') ? 'right' : null;

  return (
    <div className={`hands ${compact ? 'is-compact' : ''}`}>
      <svg viewBox="0 0 424 218" className="hands-svg" role="img" aria-label={
        activeFinger ? `Hand diagram. ${fingerName(activeFinger)} is active.` : 'Hand diagram with finger placement.'
      }>
        <Hand side="left" activeFinger={activeFinger} shiftHand={shiftHand} />
        <Hand side="right" activeFinger={activeFinger} shiftHand={shiftHand} />
        <g className="hand-labels" aria-hidden="true">
          <text x="51" y="212">{glyphs.KeyA}</text>
          <text x="80" y="212">{glyphs.KeyS}</text>
          <text x="110" y="212">{glyphs.KeyD}</text>
          <text x="140" y="212">{glyphs.KeyF}</text>
          <text x="272" y="212">{glyphs.KeyJ}</text>
          <text x="302" y="212">{glyphs.KeyK}</text>
          <text x="332" y="212">{glyphs.KeyL}</text>
          <text x="361" y="212">{glyphs.Semicolon}</text>
        </g>
      </svg>
      <div className="hands-caption" aria-live="polite">
        {caption ??
          (activeFinger
            ? `${fingerName(activeFinger)}${handSide ? ` · ${handSide} hand` : ''}`
            : 'Rest your fingers on the home row — index fingers on the raised bumps.')}
      </div>
    </div>
  );
}
