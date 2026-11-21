import type { Finger, LayoutId } from './types';

export type KeySpecial = 'backspace' | 'tab' | 'caps' | 'enter' | 'shift' | 'ctrl' | 'alt' | 'meta' | 'space';

export interface KeyDef {
  code: string;
  base: string;
  shift?: string;
  w: number;
  special?: KeySpecial;
  home?: boolean;
}

export interface KeyboardLayout {
  id: LayoutId;
  name: string;
  region: string;
  rows: KeyDef[][];
  charMap: Record<string, { code: string; shift: boolean }>;
}

interface PhysicalKey {
  code: string;
  w?: number;
  special?: KeySpecial;
  finger: Finger;
  home?: boolean;
}

const ROW_1: PhysicalKey[] = [
  { code: 'Backquote', finger: 'pinky-l' },
  { code: 'Digit1', finger: 'pinky-l' },
  { code: 'Digit2', finger: 'ring-l' },
  { code: 'Digit3', finger: 'middle-l' },
  { code: 'Digit4', finger: 'index-l' },
  { code: 'Digit5', finger: 'index-l' },
  { code: 'Digit6', finger: 'index-r' },
  { code: 'Digit7', finger: 'index-r' },
  { code: 'Digit8', finger: 'middle-r' },
  { code: 'Digit9', finger: 'ring-r' },
  { code: 'Digit0', finger: 'pinky-r' },
  { code: 'Minus', finger: 'pinky-r' },
  { code: 'Equal', finger: 'pinky-r' },
  { code: 'Backspace', w: 2, special: 'backspace', finger: 'pinky-r' },
];

const ROW_2: PhysicalKey[] = [
  { code: 'Tab', w: 1.5, special: 'tab', finger: 'pinky-l' },
  { code: 'KeyQ', finger: 'pinky-l' },
  { code: 'KeyW', finger: 'ring-l' },
  { code: 'KeyE', finger: 'middle-l' },
  { code: 'KeyR', finger: 'index-l' },
  { code: 'KeyT', finger: 'index-l' },
  { code: 'KeyY', finger: 'index-r' },
  { code: 'KeyU', finger: 'index-r' },
  { code: 'KeyI', finger: 'middle-r' },
  { code: 'KeyO', finger: 'ring-r' },
  { code: 'KeyP', finger: 'pinky-r' },
  { code: 'BracketLeft', finger: 'pinky-r' },
  { code: 'BracketRight', finger: 'pinky-r' },
  { code: 'Backslash', w: 1.5, finger: 'pinky-r' },
];

const ROW_3: PhysicalKey[] = [
  { code: 'CapsLock', w: 1.75, special: 'caps', finger: 'pinky-l' },
  { code: 'KeyA', finger: 'pinky-l' },
  { code: 'KeyS', finger: 'ring-l' },
  { code: 'KeyD', finger: 'middle-l' },
  { code: 'KeyF', finger: 'index-l', home: true },
  { code: 'KeyG', finger: 'index-l' },
  { code: 'KeyH', finger: 'index-r' },
  { code: 'KeyJ', finger: 'index-r', home: true },
  { code: 'KeyK', finger: 'middle-r' },
  { code: 'KeyL', finger: 'ring-r' },
  { code: 'Semicolon', finger: 'pinky-r' },
  { code: 'Quote', finger: 'pinky-r' },
  { code: 'Enter', w: 2.25, special: 'enter', finger: 'pinky-r' },
];

const ROW_4: PhysicalKey[] = [
  { code: 'ShiftLeft', w: 2.25, special: 'shift', finger: 'pinky-l' },
  { code: 'KeyZ', finger: 'pinky-l' },
  { code: 'KeyX', finger: 'ring-l' },
  { code: 'KeyC', finger: 'middle-l' },
  { code: 'KeyV', finger: 'index-l' },
  { code: 'KeyB', finger: 'index-l' },
  { code: 'KeyN', finger: 'index-r' },
  { code: 'KeyM', finger: 'index-r' },
  { code: 'Comma', finger: 'middle-r' },
  { code: 'Period', finger: 'ring-r' },
  { code: 'Slash', finger: 'pinky-r' },
  { code: 'ShiftRight', w: 2.75, special: 'shift', finger: 'pinky-r' },
];

const ROW_5: PhysicalKey[] = [
  { code: 'ControlLeft', w: 1.25, special: 'ctrl', finger: 'pinky-l' },
  { code: 'MetaLeft', w: 1.25, special: 'meta', finger: 'pinky-l' },
  { code: 'AltLeft', w: 1.25, special: 'alt', finger: 'pinky-l' },
  { code: 'Space', w: 7.5, special: 'space', finger: 'thumb' },
  { code: 'AltRight', w: 1.25, special: 'alt', finger: 'pinky-r' },
  { code: 'MetaRight', w: 1.25, special: 'meta', finger: 'pinky-r' },
  { code: 'ControlRight', w: 1.25, special: 'ctrl', finger: 'pinky-r' },
];

const PHYSICAL_ROWS: PhysicalKey[][] = [ROW_1, ROW_2, ROW_3, ROW_4, ROW_5];

const FINGER_BY_CODE: Record<string, Finger> = {};
for (const row of PHYSICAL_ROWS) {
  for (const key of row) FINGER_BY_CODE[key.code] = key.finger;
}

const US_BASE: Record<string, [string, string]> = {
  Backquote: ['`', '~'],
  Digit1: ['1', '!'],
  Digit2: ['2', '@'],
  Digit3: ['3', '#'],
  Digit4: ['4', '$'],
  Digit5: ['5', '%'],
  Digit6: ['6', '^'],
  Digit7: ['7', '&'],
  Digit8: ['8', '*'],
  Digit9: ['9', '('],
  Digit0: ['0', ')'],
  Minus: ['-', '_'],
  Equal: ['=', '+'],
  KeyQ: ['q', 'Q'],
  KeyW: ['w', 'W'],
  KeyE: ['e', 'E'],
  KeyR: ['r', 'R'],
  KeyT: ['t', 'T'],
  KeyY: ['y', 'Y'],
  KeyU: ['u', 'U'],
  KeyI: ['i', 'I'],
  KeyO: ['o', 'O'],
  KeyP: ['p', 'P'],
  BracketLeft: ['[', '{'],
  BracketRight: [']', '}'],
  Backslash: ['\\', '|'],
  KeyA: ['a', 'A'],
  KeyS: ['s', 'S'],
  KeyD: ['d', 'D'],
  KeyF: ['f', 'F'],
  KeyG: ['g', 'G'],
  KeyH: ['h', 'H'],
  KeyJ: ['j', 'J'],
  KeyK: ['k', 'K'],
  KeyL: ['l', 'L'],
  Semicolon: [';', ':'],
  Quote: ["'", '"'],
  KeyZ: ['z', 'Z'],
  KeyX: ['x', 'X'],
  KeyC: ['c', 'C'],
  KeyV: ['v', 'V'],
  KeyB: ['b', 'B'],
  KeyN: ['n', 'N'],
  KeyM: ['m', 'M'],
  Comma: [',', '<'],
  Period: ['.', '>'],
  Slash: ['/', '?'],
  Space: [' ', ' '],
};

const LAYOUT_OVERRIDES: Record<LayoutId, Record<string, [string, string]>> = {
  qwerty: {},
  dvorak: {
    Backquote: ['`', '~'],
    BracketLeft: ['[', '{'],
    BracketRight: [']', '}'],
    Minus: ['-', '_'],
    Equal: ['=', '+'],
    KeyQ: ["'", '"'],
    KeyW: [',', '<'],
    KeyE: ['.', '>'],
    KeyR: ['p', 'P'],
    KeyT: ['y', 'Y'],
    KeyY: ['f', 'F'],
    KeyU: ['g', 'G'],
    KeyI: ['c', 'C'],
    KeyO: ['r', 'R'],
    KeyP: ['l', 'L'],
    Semicolon: ['s', 'S'],
    Quote: ['-', '_'],
    KeyA: ['a', 'A'],
    KeyS: ['o', 'O'],
    KeyD: ['e', 'E'],
    KeyF: ['u', 'U'],
    KeyG: ['i', 'I'],
    KeyH: ['d', 'D'],
    KeyJ: ['h', 'H'],
    KeyK: ['t', 'T'],
    KeyL: ['n', 'N'],
    KeyZ: [';', ':'],
    KeyX: ['q', 'Q'],
    KeyC: ['j', 'J'],
    KeyV: ['k', 'K'],
    KeyB: ['x', 'X'],
    KeyN: ['b', 'B'],
    KeyM: ['m', 'M'],
    Comma: ['w', 'W'],
    Period: ['v', 'V'],
    Slash: ['z', 'Z'],
  },
  colemak: {
    KeyQ: ['q', 'Q'],
    KeyW: ['w', 'W'],
    KeyE: ['f', 'F'],
    KeyR: ['p', 'P'],
    KeyT: ['g', 'G'],
    KeyY: ['j', 'J'],
    KeyU: ['l', 'L'],
    KeyI: ['u', 'U'],
    KeyO: ['y', 'Y'],
    KeyP: [';', ':'],
    KeyA: ['a', 'A'],
    KeyS: ['r', 'R'],
    KeyD: ['s', 'S'],
    KeyF: ['t', 'T'],
    KeyG: ['d', 'D'],
    KeyH: ['h', 'H'],
    KeyJ: ['n', 'N'],
    KeyK: ['e', 'E'],
    KeyL: ['i', 'I'],
    Semicolon: ['o', 'O'],
    Quote: ["'", '"'],
    KeyZ: ['z', 'Z'],
    KeyX: ['x', 'X'],
    KeyC: ['c', 'C'],
    KeyV: ['v', 'V'],
    KeyB: ['b', 'B'],
    KeyN: ['k', 'K'],
    KeyM: ['m', 'M'],
    Comma: [',', '<'],
    Period: ['.', '>'],
    Slash: ['/', '?'],
  },
  azerty: {
    Backquote: ['²', ''],
    Digit1: ['&', '1'],
    Digit2: ['é', '2'],
    Digit3: ['"', '3'],
    Digit4: ["'", '4'],
    Digit5: ['(', '5'],
    Digit6: ['-', '6'],
    Digit7: ['è', '7'],
    Digit8: ['_', '8'],
    Digit9: ['ç', '9'],
    Digit0: ['à', '0'],
    Minus: [')', '°'],
    Equal: ['=', '+'],
    KeyQ: ['a', 'A'],
    KeyW: ['z', 'Z'],
    KeyE: ['e', 'E'],
    KeyR: ['r', 'R'],
    KeyT: ['t', 'T'],
    KeyY: ['y', 'Y'],
    KeyU: ['u', 'U'],
    KeyI: ['i', 'I'],
    KeyO: ['o', 'O'],
    KeyP: ['p', 'P'],
    BracketLeft: ['^', '¨'],
    BracketRight: ['$', '£'],
    Backslash: ['`', '~'],
    KeyA: ['q', 'Q'],
    KeyS: ['s', 'S'],
    KeyD: ['d', 'D'],
    KeyF: ['f', 'F'],
    KeyG: ['g', 'G'],
    KeyH: ['h', 'H'],
    KeyJ: ['j', 'J'],
    KeyK: ['k', 'K'],
    KeyL: ['l', 'L'],
    Semicolon: ['m', 'M'],
    Quote: ['ù', '%'],
    KeyZ: ['w', 'W'],
    KeyX: ['x', 'X'],
    KeyC: ['c', 'C'],
    KeyV: ['v', 'V'],
    KeyB: ['b', 'B'],
    KeyN: ['n', 'N'],
    KeyM: [',', '?'],
    Comma: [';', '.'],
    Period: [':', '/'],
    Slash: ['!', '§'],
  },
  qwertz: {
    KeyY: ['z', 'Z'],
    KeyZ: ['y', 'Y'],
    BracketLeft: ['ü', 'Ü'],
    BracketRight: ['+', '*'],
    Backslash: ['#', "'"],
    Semicolon: ['ö', 'Ö'],
    Quote: ['ä', 'Ä'],
    Minus: ['ß', '?'],
    Equal: ['´', '`'],
    Digit1: ['1', '!'],
    Digit2: ['2', '"'],
    Digit3: ['3', '§'],
    Digit4: ['4', '$'],
    Digit5: ['5', '%'],
    Digit6: ['6', '&'],
    Digit7: ['7', '/'],
    Digit8: ['8', '('],
    Digit9: ['9', ')'],
    Digit0: ['0', '='],
    Comma: [',', ';'],
    Period: ['.', ':'],
    Slash: ['-', '_'],
  },
};

const SPECIAL_LABELS: Record<KeySpecial, string> = {
  backspace: '⌫',
  tab: '⇥',
  caps: '⇪',
  enter: '↵',
  shift: '⇧',
  ctrl: 'Ctrl',
  alt: 'Alt',
  meta: '❖',
  space: '',
};

export const LAYOUT_META: { id: LayoutId; name: string; region: string; blurb: string }[] = [
  { id: 'qwerty', name: 'QWERTY', region: 'US · International', blurb: 'The most widely supported layout and the default for most keyboards.' },
  { id: 'dvorak', name: 'Dvorak', region: 'US · Ergonomic', blurb: 'Vowels and common consonants sit on the home row to reduce finger travel.' },
  { id: 'colemak', name: 'Colemak', region: 'Modern · Ergonomic', blurb: 'Keeps familiar shortcuts while improving home-row usage over QWERTY.' },
  { id: 'azerty', name: 'AZERTY', region: 'France · Belgium', blurb: 'French layout with accented characters and shifted number row.' },
  { id: 'qwertz', name: 'QWERTZ', region: 'Germany · Austria', blurb: 'German layout with umlauts and swapped Y/Z positions.' },
];

function buildLayout(id: LayoutId): KeyboardLayout {
  const overrides = LAYOUT_OVERRIDES[id];
  const charMap: Record<string, { code: string; shift: boolean }> = {};
  const rows: KeyDef[][] = PHYSICAL_ROWS.map((row) =>
    row.map((key) => {
      const special = key.special;
      if (special) {
        return {
          code: key.code,
          base: SPECIAL_LABELS[special],
          shift: undefined,
          w: key.w ?? 1,
          special,
          home: false,
        };
      }
      const glyphs = overrides[key.code] ?? US_BASE[key.code] ?? ['', ''];
      return {
        code: key.code,
        base: glyphs[0],
        shift: glyphs[1] || undefined,
        w: key.w ?? 1,
        home: key.home,
      };
    }),
  );

  for (const row of rows) {
    for (const key of row) {
      if (key.special) continue;
      if (key.base && key.base !== ' ') charMap[key.base] = { code: key.code, shift: false };
      if (key.shift && key.shift !== key.base) charMap[key.shift] = { code: key.code, shift: true };
    }
  }
  charMap[' '] = { code: 'Space', shift: false };

  const meta = LAYOUT_META.find((l) => l.id === id)!;
  return { id, name: meta.name, region: meta.region, rows, charMap };
}

const cache = new Map<LayoutId, KeyboardLayout>();
export function getLayout(id: LayoutId): KeyboardLayout {
  let layout = cache.get(id);
  if (!layout) {
    layout = buildLayout(id);
    cache.set(id, layout);
  }
  return layout;
}

export function fingerForCode(code: string): Finger {
  return FINGER_BY_CODE[code] ?? 'thumb';
}

export function fingerForKeyChar(layoutId: LayoutId, char: string): Finger | null {
  const key = getLayout(layoutId).charMap[char];
  if (!key) return null;
  return fingerForCode(key.code);
}

const FINGER_NAMES: Record<Finger, string> = {
  'pinky-l': 'Left pinky',
  'ring-l': 'Left ring',
  'middle-l': 'Left middle',
  'index-l': 'Left index',
  thumb: 'Thumb',
  'index-r': 'Right index',
  'middle-r': 'Right middle',
  'ring-r': 'Right ring',
  'pinky-r': 'Right pinky',
};

export function fingerName(finger: Finger): string {
  return FINGER_NAMES[finger];
}

/** Characters in a given text that the selected layout cannot produce. */
export function missingChars(layoutId: LayoutId, text: string): string[] {
  const map = getLayout(layoutId).charMap;
  const missing = new Set<string>();
  for (const char of text) {
    if (char === '\n') continue;
    if (!map[char]) missing.add(char);
  }
  return [...missing];
}

/** Which hand should press Shift for a given character. */
export function shiftHandFor(char: string): 'left' | 'right' | null {
  if (!/[A-Z!@#$%^&*()_+{}|:"<>?~]/.test(char)) return null;
  const shifted: Record<string, Finger> = {
    '!': 'pinky-l', '@': 'ring-l', '#': 'middle-l', '$': 'index-l', '%': 'index-l',
    '^': 'index-r', '&': 'index-r', '*': 'middle-r', '(': 'ring-r', ')': 'pinky-r',
    '_': 'pinky-r', '+': 'pinky-r', '{': 'pinky-r', '}': 'pinky-r', '|': 'pinky-r',
    ':': 'pinky-r', '"': 'pinky-r', '<': 'middle-r', '>': 'ring-r', '?': 'pinky-r', '~': 'pinky-l',
  };
  const finger = shifted[char] ?? (/[A-Z]/.test(char) ? 'pinky-r' : null);
  if (!finger) return null;
  return finger.endsWith('-l') ? 'right' : 'left';
}
