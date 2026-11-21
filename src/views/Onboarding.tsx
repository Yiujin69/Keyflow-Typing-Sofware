import { ArrowRight, Check, Keyboard, Languages, ShieldCheck, Sparkles, Target, Timer } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Hands } from '../components/Hands';
import { Keyboard as KeyboardView } from '../components/Keyboard';
import { Button, Segmented } from '../components/ui';
import { LAYOUT_META } from '../lib/layouts';
import { useStore } from '../lib/store';
import { playStart } from '../lib/sound';
import { LANGUAGE_PACKS } from '../lib/words';
import type { LanguageId, LayoutId } from '../lib/types';

export function Onboarding({ onDone }: { onDone: () => void }) {
  const { profile, updateSettings, completeOnboarding } = useStore();
  const settings = profile.settings;
  const [step, setStep] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);

  // Keep keyboard focus inside the first-run dialog.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      panelRef.current?.querySelector<HTMLElement>('.btn-primary')?.focus();
    }, 80);
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || !panelRef.current) return;
      const focusables = [...panelRef.current.querySelectorAll<HTMLElement>('button, input, [tabindex]:not([tabindex="-1"])')].filter(
        (element) => !element.hasAttribute('disabled'),
      );
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      window.clearTimeout(timer);
    };
  }, [step]);

  const finish = () => {
    completeOnboarding();
    if (settings.sound) playStart(settings.volume);
    onDone();
  };

  return (
    <div className="onboarding" role="dialog" aria-modal="true" aria-labelledby="onboarding-title">
      <div className="onboarding-panel" ref={panelRef}>
        <div className="onboarding-art">
          <div className="onboarding-brand">
            <span className="brand-mark" aria-hidden="true">
              <span className="brand-key brand-key-1">K</span>
              <span className="brand-key brand-key-2">F</span>
            </span>
            <div>
              <strong>Keyflow</strong>
              <span>Typing studio</span>
            </div>
          </div>
          <div className="onboarding-hands">
            <Hands
              layoutId={settings.layout}
              activeFinger={step === 0 ? 'index-l' : null}
              caption="Fingers on the home row — F and J have raised bumps."
            />
          </div>
          <div className="onboarding-quote">
            <Sparkles size={16} />
            <p>“Accuracy first. Speed is what accuracy becomes when it stops being difficult.”</p>
          </div>
          <div className="onboarding-dots" aria-hidden="true">
            {[0, 1, 2].map((index) => (
              <span key={index} className={index === step ? 'is-active' : index < step ? 'is-done' : ''} />
            ))}
          </div>
        </div>

        <div className="onboarding-content">
          {step === 0 && (
            <div className="onboarding-step">
              <p className="eyebrow"><ShieldCheck size={14} /> Fully offline</p>
              <h1 id="onboarding-title">Learn to type without looking down.</h1>
              <p className="onboarding-lead">
                Thirty-eight structured lessons take you from the home row to full paragraphs. Everything runs on this
                computer: lessons, sounds, statistics and your progress.
              </p>
              <ul className="onboarding-features">
                <li><span><Keyboard size={16} /></span><div><strong>Ten-finger training</strong><p>Live keyboard and hand guidance for five layouts.</p></div></li>
                <li><span><Target size={16} /></span><div><strong>Adaptive practice</strong><p>Weak keys return automatically until they improve.</p></div></li>
                <li><span><Timer size={16} /></span><div><strong>Real measurement</strong><p>WPM, accuracy, consistency and per-key latency.</p></div></li>
              </ul>
              <div className="onboarding-actions">
                <Button variant="primary" size="lg" trailing={<ArrowRight size={17} />} onClick={() => setStep(1)}>
                  Set up my keyboard
                </Button>
                <Button variant="ghost" onClick={finish}>Skip setup</Button>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="onboarding-step">
              <p className="eyebrow"><Keyboard size={14} /> Step 2 of 3</p>
              <h1 id="onboarding-title">Choose your keyboard.</h1>
              <p className="onboarding-lead">Pick the physical layout you actually use. You can change it at any time.</p>
              <div className="onboarding-layouts">
                {LAYOUT_META.map((layout) => (
                  <button
                    key={layout.id}
                    type="button"
                    className={`onboarding-layout ${settings.layout === layout.id ? 'is-selected' : ''}`}
                    onClick={() => updateSettings({ layout: layout.id as LayoutId })}
                  >
                    <span>
                      <strong>{layout.name}</strong>
                      <em>{layout.region}</em>
                    </span>
                    {settings.layout === layout.id && <Check size={16} />}
                  </button>
                ))}
              </div>
              <div className="onboarding-language">
                <span className="setting-label"><Languages size={14} /> Lesson language</span>
                <Segmented
                  ariaLabel="Lesson language"
                  value={settings.language}
                  onChange={(language: LanguageId) => updateSettings({ language })}
                  options={(Object.keys(LANGUAGE_PACKS) as LanguageId[]).map((id) => ({
                    value: id,
                    label: `${LANGUAGE_PACKS[id].nativeName} · ${id.toUpperCase()}`,
                  }))}
                />
              </div>
              <div className="onboarding-keyboard-preview">
                <KeyboardView layoutId={settings.layout} showLetters showFingerHints compact />
              </div>
              <div className="onboarding-actions">
                <Button variant="outline" onClick={() => setStep(0)}>Back</Button>
                <Button variant="primary" size="lg" trailing={<ArrowRight size={17} />} onClick={() => setStep(2)}>
                  Continue
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="onboarding-step">
              <p className="eyebrow"><Target size={14} /> Step 3 of 3</p>
              <h1 id="onboarding-title">Set a realistic daily goal.</h1>
              <p className="onboarding-lead">
                Ten focused minutes a day will take you further than an occasional hour. You can adjust this later.
              </p>
              <div className="onboarding-goal">
                <label htmlFor="onboarding-goal">Daily practice</label>
                <div className="goal-choice-row">
                  {[5, 10, 15, 20, 30].map((minutes) => (
                    <button
                      key={minutes}
                      type="button"
                      className={`goal-choice ${settings.dailyGoalMin === minutes ? 'is-selected' : ''}`}
                      onClick={() => updateSettings({ dailyGoalMin: minutes })}
                    >
                      <strong>{minutes}</strong><span>min</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="onboarding-targets">
                <div className="onboarding-target">
                  <span>Comfortable speed target</span>
                  <strong>{settings.targetWpm} wpm</strong>
                  <input type="range" min={15} max={100} step={5} value={settings.targetWpm} onChange={(event) => updateSettings({ targetWpm: Number(event.target.value) })} className="range" />
                </div>
                <div className="onboarding-target">
                  <span>Accuracy target</span>
                  <strong>{settings.targetAccuracy}%</strong>
                  <input type="range" min={90} max={100} step={1} value={settings.targetAccuracy} onChange={(event) => updateSettings({ targetAccuracy: Number(event.target.value) })} className="range" />
                </div>
              </div>
              <div className="onboarding-note">
                <ShieldCheck size={15} />
                <span>No account is created. Your profile is saved to this device only.</span>
              </div>
              <div className="onboarding-actions">
                <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
                <Button variant="primary" size="lg" icon={<Sparkles size={17} />} onClick={finish}>
                  Start learning
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
