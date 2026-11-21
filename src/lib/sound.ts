import type { SoundPack } from './types';

let context: AudioContext | null = null;
let noiseBuffer: AudioBuffer | null = null;

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!context) context = new Ctor();
  if (context.state === 'suspended') void context.resume();
  return context;
}

function getNoise(ctx: AudioContext): AudioBuffer {
  if (!noiseBuffer) {
    const length = Math.floor(ctx.sampleRate * 0.08);
    noiseBuffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / length) ** 2;
    }
  }
  return noiseBuffer;
}

function envelope(ctx: AudioContext, duration: number, volume: number): GainNode {
  const gain = ctx.createGain();
  const now = ctx.currentTime;
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(volume, now + 0.004);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  gain.connect(ctx.destination);
  return gain;
}

function tone(ctx: AudioContext, frequency: number, duration: number, volume: number, type: OscillatorType) {
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, ctx.currentTime);
  osc.connect(envelope(ctx, duration, volume));
  osc.start();
  osc.stop(ctx.currentTime + duration + 0.02);
}

function noise(ctx: AudioContext, volume: number, duration: number, cutoff: number) {
  const source = ctx.createBufferSource();
  source.buffer = getNoise(ctx);
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = cutoff;
  filter.Q.value = 0.9;
  source.connect(filter);
  filter.connect(envelope(ctx, duration, volume));
  source.start();
}

/** Play a key click. All audio is synthesised locally — no files or network. */
export function playKey(pack: SoundPack, volume: number, variant = 0): void {
  if (volume <= 0) return;
  const ctx = getContext();
  if (!ctx) return;
  const jitter = 1 + (Math.random() - 0.5) * 0.08;
  const base = Math.max(0.02, Math.min(1, volume)) * 0.35;

  if (pack === 'minimal') {
    noise(ctx, base * variant, 0.03, 2600);
    return;
  }
  if (pack === 'mechanical') {
    noise(ctx, base * 0.9, 0.045, 1800 * jitter);
    tone(ctx, 210 * jitter, 0.055, base * 0.5, 'triangle');
    return;
  }
  noise(ctx, base * 0.6, 0.05, 3200);
  tone(ctx, 520 * jitter, 0.045, base * 0.22, 'sine');
}

export function playError(volume: number): void {
  if (volume <= 0) return;
  const ctx = getContext();
  if (!ctx) return;
  tone(ctx, 132, 0.12, Math.min(0.3, volume * 0.25), 'square');
}

export function playComplete(volume: number): void {
  if (volume <= 0) return;
  const ctx = getContext();
  if (!ctx) return;
  [523.25, 659.25, 783.99].forEach((frequency, index) => {
    window.setTimeout(() => {
      const live = getContext();
      if (!live) return;
      tone(live, frequency, 0.28, Math.min(0.22, volume * 0.16), 'sine');
    }, index * 90);
  });
}

export function playStart(volume: number): void {
  if (volume <= 0) return;
  const ctx = getContext();
  if (!ctx) return;
  tone(ctx, 420, 0.09, Math.min(0.16, volume * 0.12), 'sine');
  window.setTimeout(() => {
    const live = getContext();
    if (live) tone(live, 630, 0.11, Math.min(0.16, volume * 0.12), 'sine');
  }, 80);
}
