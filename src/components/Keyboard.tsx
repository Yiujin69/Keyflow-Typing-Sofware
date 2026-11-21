import { fingerForCode, getLayout } from '../lib/layouts';
import type { LayoutId } from '../lib/types';
import { keyAccuracy } from '../lib/metrics';
import type { KeyStat } from '../lib/types';

export interface KeyboardProps {
  layoutId: LayoutId;
  nextChar?: string | null;
  typedChar?: string | null;
  showLetters?: boolean;
  showFingerHints?: boolean;
  compact?: boolean;
  heatmap?: Record<string, KeyStat>;
  onKeySelect?: (char: string) => void;
  className?: string;
}

const FINGER_LABELS: Record<string, string> = {
  'pinky-l': 'left pinky',
  'ring-l': 'left ring',
  'middle-l': 'left middle',
  'index-l': 'left index',
  thumb: 'thumb',
  'index-r': 'right index',
  'middle-r': 'right middle',
  'ring-r': 'right ring',
  'pinky-r': 'right pinky',
};

export function Keyboard({
  layoutId,
  nextChar,
  typedChar,
  showLetters = true,
  showFingerHints = false,
  compact = false,
  heatmap,
  onKeySelect,
  className = '',
}: KeyboardProps) {
  const layout = getLayout(layoutId);
  const target = nextChar ? layout.charMap[nextChar] : undefined;
  const targetFinger = target ? fingerForCode(target.code) : null;
  const typed = typedChar ? layout.charMap[typedChar] : undefined;

  let shiftHintCode: string | null = null;
  if (target?.shift) {
    shiftHintCode = targetFinger?.endsWith('-l') ? 'ShiftRight' : 'ShiftLeft';
  }

  return (
    <div className={`keyboard ${compact ? 'is-compact' : ''} ${className}`} aria-hidden={onKeySelect ? undefined : true}>
      {layout.rows.map((row, rowIndex) => (
        <div className="kb-row" key={rowIndex}>
          {row.map((key) => {
            const finger = fingerForCode(key.code);
            const isTarget = target?.code === key.code;
            const isTyped = typed?.code === key.code;
            const stat = heatmap?.[key.base];
            const accuracy = stat ? keyAccuracy(stat) : null;
            const heat = accuracy === null ? null : accuracy >= 97 ? 4 : accuracy >= 93 ? 3 : accuracy >= 88 ? 2 : accuracy >= 80 ? 1 : 0;
            const clickable = Boolean(onKeySelect) && Boolean(key.base) && !key.special;
            const label = key.special === 'space' ? 'space' : showLetters ? key.base : '';
            const title = key.special
              ? key.special
              : `${key.base === ' ' ? 'Space' : key.base}${key.shift ? ` / ${key.shift}` : ''} · ${FINGER_LABELS[finger]}`;

            return (
              <div
                key={key.code}
                className={[
                  'kb-key',
                  key.special ? `kb-special kb-${key.special}` : '',
                  key.home ? 'is-home' : '',
                  isTarget ? 'is-target' : '',
                  isTarget && shiftHintCode === key.code ? 'is-shift-target' : '',
                  isTyped ? 'is-typed' : '',
                  clickable ? 'is-clickable' : '',
                  heat !== null ? `heat heat-${heat}` : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                style={{ flex: `0 0 calc(var(--key-unit) * ${key.w} + var(--key-gap) * ${key.w - 1})` }}
                data-finger={finger}
                title={title}
                role={clickable ? 'button' : undefined}
                tabIndex={clickable ? 0 : undefined}
                onClick={clickable ? () => onKeySelect?.(key.base) : undefined}
                onKeyDown={
                  clickable
                    ? (event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          onKeySelect?.(key.base);
                        }
                      }
                    : undefined
                }
              >
                {showFingerHints && !key.special && <span className="kb-finger-dot" aria-hidden="true" />}
                {key.shift && showLetters && key.base !== ' ' && (
                  <span className="kb-shift-label" aria-hidden="true">{key.shift}</span>
                )}
                <span className="kb-label">{label}</span>
                {key.home && <span className="kb-home-bar" aria-hidden="true" />}
                {isTarget && <span className="kb-target-ring" aria-hidden="true" />}
              </div>
            );
          })}
        </div>
      ))}
      <p className="kb-legend">
        {showFingerHints ? 'Each key is colour-coded to the finger that presses it.' : 'Keys light up as you type.'}
      </p>
    </div>
  );
}
