import { ArrowRight, Hand, Info, Keyboard, Play, Sparkles } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Hands } from '../components/Hands';
import { Keyboard as KeyboardView } from '../components/Keyboard';
import { Badge, Button, Card } from '../components/ui';
import { fingerForCode, fingerName, getLayout } from '../lib/layouts';
import { useStore } from '../lib/store';
import type { Finger, ViewId } from '../lib/types';

const FINGER_INFO: { finger: Finger; homeCode: string; tip: string }[] = [
  { finger: 'pinky-l', homeCode: 'KeyA', tip: 'Rests on the outer home-row key. Reaches the far upper and lower corners and the left Shift. Small finger, big job — keep it light and deliberate.' },
  { finger: 'ring-l', homeCode: 'KeyS', tip: 'Rests one key inward from the pinky and reaches the ring-finger column above and below. Let it move without lifting the rest of the hand.' },
  { finger: 'middle-l', homeCode: 'KeyD', tip: 'Rests under the left middle finger and travels straight up and down. The strongest finger on the left hand; avoid leaning on it.' },
  { finger: 'index-l', homeCode: 'KeyF', tip: 'Rests on the raised bump and owns two full columns plus the inner stretch key. The busiest finger you have.' },
  { finger: 'thumb', homeCode: 'Space', tip: 'Presses the space bar with a relaxed, downward motion. Keep it slightly curved, never flat.' },
  { finger: 'index-r', homeCode: 'KeyJ', tip: 'Rests on the second raised bump and owns two columns plus the inner stretch key. Return here after every reach.' },
  { finger: 'middle-r', homeCode: 'KeyK', tip: 'Rests beside the right index finger and reaches straight up and down. Downward curls should come from the finger, not the wrist.' },
  { finger: 'ring-r', homeCode: 'KeyL', tip: 'Rests one key inward from the right pinky. Slow down here — ring fingers are naturally weaker.' },
  { finger: 'pinky-r', homeCode: 'Semicolon', tip: 'Rests on the outer home-row key. Reaches Enter, Backspace, the slash and the right Shift. Accuracy beats speed.' },
];

const TIPS = [
  'Rest your fingers on the home row between words, not just at the start.',
  'Use the Shift key on the opposite side to the letter you are capitalising.',
  'Look at the screen. The keyboard on this page is here to train your eyes forward, not down.',
  'Keep wrists floating and relaxed. If your forearms ache, your desk height or posture needs attention.',
];

export function FingersView({ navigate }: { navigate: (view: ViewId, lessonId?: string) => void }) {
  const { profile } = useStore();
  const layout = getLayout(profile.settings.layout);
  const [selected, setSelected] = useState('f');

  const info = useMemo(() => {
    const key = layout.charMap[selected];
    if (!key) return null;
    const finger = fingerForCode(key.code);
    const rowIndex = layout.rows.findIndex((row) => row.some((item) => item.code === key.code));
    const rowLabels = ['Number row', 'Upper row', 'Home row', 'Lower row', 'Bottom row'];
    const glyph = layout.rows.flat().find((item) => item.code === key.code);
    return {
      key,
      finger,
      glyph: glyph?.base ?? selected,
      shift: glyph?.shift,
      row: rowLabels[rowIndex] ?? 'Keyboard',
      home: layout.rows.flat().find((item) => item.code === key.code)?.home ?? false,
      tip: FINGER_INFO.find((item) => item.finger === finger)?.tip ?? '',
    };
  }, [layout, selected]);

  const activeFinger = info?.finger ?? null;
  const baseFor = (code: string) => layout.rows.flat().find((key) => key.code === code)?.base ?? '';
  const homeGlyph = (code: string) => (code === 'Space' ? 'space' : baseFor(code).toUpperCase());

  return (
    <div className="page fingers-page">
      <header className="page-head">
        <div>
          <p className="eyebrow"><Hand size={14} /> Technique</p>
          <h1>Ten fingers. Eight anchors.</h1>
          <p className="page-sub">
            Touch typing is not about speed. It is about returning to a known position after every movement.
          </p>
        </div>
        <div className="page-actions">
          <Button variant="outline" icon={<Play size={15} />} onClick={() => navigate('learn', 'home-1')}>
            Anchor drill
          </Button>
          <Button variant="primary" onClick={() => navigate('learn', 'home-6')} trailing={<ArrowRight size={15} />}>
            Home-row checkpoint
          </Button>
        </div>
      </header>

      <div className="fingers-layout">
        <div className="fingers-main">
          <Card className="finger-detail" title={`Key ${info?.glyph ?? selected}`} subtitle="Select any key to see the finger that presses it.">
            <div className="finger-detail-body">
              <div className="finger-key-display">
                <span className="finger-big-key">{selected === ' ' ? 'space' : info?.glyph ?? selected}</span>
                {info?.shift && info.shift !== info.glyph && <span className="finger-shift">Shift → {info.shift}</span>}
              </div>
              <div className="finger-detail-copy">
                <div className="finger-badges">
                  <Badge tone="accent">{info ? fingerName(info.finger) : 'Unknown'}</Badge>
                  <Badge tone="neutral">{info?.row ?? '—'}</Badge>
                  {info?.home && <Badge tone="good">Home key</Badge>}
                </div>
                <p>{info?.tip || 'Choose a key on the keyboard below.'}</p>
                {info?.key.shift && (
                  <p className="muted small">
                    Hold Shift with your {info.finger.endsWith('-l') ? 'right' : 'left'} pinky while pressing this key.
                  </p>
                )}
              </div>
            </div>
            <div className="finger-hands">
              <Hands layoutId={profile.settings.layout} activeFinger={activeFinger} />
            </div>
            <div className="finger-keyboard">
              <KeyboardView
                layoutId={profile.settings.layout}
                nextChar={selected}
                showLetters
                showFingerHints
                onKeySelect={setSelected}
                compact
              />
            </div>
          </Card>

          <div className="finger-lower">
            <Card title="Home position" subtitle="The two raised bumps are your reference point.">
              <div className="home-grid">
                <div className="home-hand">
                  <span>Left hand</span>
                  <div className="home-keys">
                    <kbd>{homeGlyph('KeyA')}</kbd>
                    <kbd>{homeGlyph('KeyS')}</kbd>
                    <kbd>{homeGlyph('KeyD')}</kbd>
                    <kbd className="is-anchor">{homeGlyph('KeyF')}<i /></kbd>
                  </div>
                  <p className="muted small">Pinky · ring · middle · index</p>
                </div>
                <div className="home-hand">
                  <span>Right hand</span>
                  <div className="home-keys">
                    <kbd className="is-anchor">{homeGlyph('KeyJ')}<i /></kbd>
                    <kbd>{homeGlyph('KeyK')}</kbd>
                    <kbd>{homeGlyph('KeyL')}</kbd>
                    <kbd>{homeGlyph('Semicolon')}</kbd>
                  </div>
                  <p className="muted small">Index · middle · ring · pinky</p>
                </div>
              </div>
              <p className="muted small">
                Thumbs rest lightly above the space bar. Every other key is a temporary reach away from this position.
              </p>
            </Card>

            <Card title="Technique checklist">
              <ul className="check-list">
                {TIPS.map((tip) => (
                  <li key={tip}><span className="check-dot" />{tip}</li>
                ))}
              </ul>
            </Card>
          </div>
        </div>

        <aside className="fingers-side">
          <Card title="Finger map" subtitle="Each finger owns a column of keys.">
            <div className="finger-legend">
              {FINGER_INFO.map((item) => (
                <button
                  type="button"
                  key={item.finger}
                  className={`finger-legend-row ${activeFinger === item.finger ? 'is-active' : ''}`}
                  onClick={() => {
                    const homeChar = item.homeCode === 'Space' ? ' ' : baseFor(item.homeCode);
                    setSelected(homeChar);
                  }}
                >
                  <span className={`finger-swatch finger-${item.finger}`} />
                  <span className="finger-legend-name">{fingerName(item.finger)}</span>
                  <kbd>{homeGlyph(item.homeCode)}</kbd>
                </button>
              ))}
            </div>
          </Card>

          <Card title="Keys by finger" className="soft-card">
            <div className="finger-key-list">
              {FINGER_INFO.filter((item) => item.finger !== 'thumb').map((item) => {
                const keys = layout.rows
                  .flat()
                  .filter((key) => !key.special && fingerForCode(key.code) === item.finger)
                  .map((key) => key.base)
                  .filter(Boolean);
                return (
                  <div key={item.finger}>
                    <span>{fingerName(item.finger)}</span>
                    <p>{keys.join(' · ')}</p>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card className="tip-callout">
            <Sparkles size={18} />
            <h4>Feel, don’t look</h4>
            <p className="muted small">
              Slide your index fingers until you feel the raised bars on F and J. That is home. Everything else is
              measured from there.
            </p>
            <Button variant="soft" size="sm" icon={<Info size={14} />} onClick={() => navigate('learn', 'home-5')}>
              Practise reaches
            </Button>
          </Card>
        </aside>
      </div>

      <p className="fingers-foot muted small">
        <Keyboard size={14} /> Layout: {layout.name} ({layout.region}). Change it in Settings.
      </p>
    </div>
  );
}
