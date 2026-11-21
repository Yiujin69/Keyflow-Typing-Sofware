import type { Lesson, LanguageId, TestConfig } from './types';
import { getPack } from './words';

function hashString(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rand: () => number, items: T[]): T {
  return items[Math.floor(rand() * items.length)];
}

function shuffle<T>(rand: () => number, items: T[]): T[] {
  const copy = items.slice();
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function buildKeyDrills(lesson: Lesson, language: LanguageId, seed: number): string {
  const rand = mulberry32(seed);
  const pack = getPack(language);
  const allowed = [...new Set(lesson.allowedKeys.replace(/\s/g, '').split(''))];
  if (!allowed.length) return 'asdf jkl;';
  const fresh = lesson.newKeys.filter((key) => allowed.includes(key));
  const lines: string[] = [];

  for (let line = 0; line < 4; line += 1) {
    const groups: string[] = [];
    const groupCount = 6 + Math.floor(rand() * 3);
    for (let g = 0; g < groupCount; g += 1) {
      const length = 2 + Math.floor(rand() * 4);
      let group = '';
      for (let c = 0; c < length; c += 1) {
        const useFresh = fresh.length > 0 && rand() < 0.5;
        group += useFresh ? pick(rand, fresh) : pick(rand, allowed);
      }
      groups.push(group);
    }
    lines.push(groups.join(' '));
  }

  const usableWords = pack.words.filter(
    (word) => [...word].every((char) => allowed.includes(char)) && word.length >= 2,
  );
  if (usableWords.length >= 5) {
    for (let line = 0; line < 2; line += 1) {
      const words: string[] = [];
      for (let w = 0; w < 8; w += 1) words.push(pick(rand, usableWords));
      lines.push(words.join(' '));
    }
  }

  return lines.join(' ');
}

function makeWords(lesson: Lesson, language: LanguageId, seed: number, count: number): string {
  const rand = mulberry32(seed);
  const pack = getPack(language);
  const allowed = new Set(lesson.allowedKeys.replace(/\s/g, '').split(''));
  const pool = pack.words.filter((word) => [...word].every((char) => allowed.has(char)));
  const source = pool.length >= 12 ? pool : pack.words.filter((word) => word.length <= 7);
  const words: string[] = [];
  let previous = '';
  for (let i = 0; i < count; i += 1) {
    let word = pick(rand, source);
    let guard = 0;
    while (word === previous && guard < 8) {
      word = pick(rand, source);
      guard += 1;
    }
    words.push(word);
    previous = word;
  }
  return words.join(' ');
}

function makeNumberGroups(seed: number, count: number, symbols: boolean, allowedDigits: string): string {
  const rand = mulberry32(seed);
  const digits = allowedDigits || '0123456789';
  const shifted = '!@#$%^&*()';
  const groups: string[] = [];
  for (let i = 0; i < count; i += 1) {
    const length = 2 + Math.floor(rand() * 4);
    let group = '';
    for (let c = 0; c < length; c += 1) {
      const useSymbol = symbols && rand() < 0.45;
      const pool = useSymbol ? shifted : digits;
      group += pool[Math.floor(rand() * pool.length)];
    }
    groups.push(group);
  }
  return groups.join(' ');
}

function capitalizeFirst(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function buildLessonText(lesson: Lesson, language: LanguageId, seed = hashString(lesson.id)): string {
  const pack = getPack(language);
  const rand = mulberry32(seed);

  if (lesson.kind === 'keys' || (!lesson.gen && lesson.kind !== 'numbers')) {
    return buildKeyDrills(lesson, language, seed);
  }

  if (lesson.gen === 'numbers' || lesson.kind === 'numbers') {
    const allowedDigits = [...lesson.allowedKeys].filter((char) => /[0-9]/.test(char)).join('');
    return makeNumberGroups(
      seed,
      18,
      lesson.newKeys.some((key) => '!@#$%^&*()'.includes(key)),
      allowedDigits,
    );
  }

  if (lesson.kind === 'capitals') {
    const base = makeWords(lesson, language, seed, 26).split(' ');
    const mixed = base.map((word, index) => (index % 4 === 0 ? capitalizeFirst(word) : word));
    return mixed.join(' ');
  }

  if (lesson.gen === 'words') {
    const count = lesson.id === 'words-1' ? 34 : 32;
    return makeWords(lesson, language, seed, count);
  }

  if (lesson.gen === 'sentences') {
    const sentences = shuffle(rand, pack.sentences).slice(0, 4);
    return sentences.join(' ');
  }

  if (lesson.gen === 'paragraphs') {
    const paragraphs = shuffle(rand, pack.paragraphs).slice(0, lesson.id === 'flow-5' ? 2 : 1);
    return paragraphs.join(' ');
  }

  return makeWords(lesson, language, seed, 30);
}

export function buildTestText(config: TestConfig, language: LanguageId, seed: number): string {
  const rand = mulberry32(seed);
  const pack = getPack(language);

  if (config.mode === 'quote') {
    const quotes = shuffle(rand, pack.quotes);
    const chosen: string[] = [];
    const target = Math.max(300, config.seconds * 7 + 200);
    let length = 0;
    for (const quote of quotes) {
      chosen.push(`"${quote.text}" - ${quote.author}`);
      length += quote.text.length;
      if (length >= target) break;
    }
    return chosen.join(' ');
  }

  const count = Math.max(30, Math.ceil(config.seconds * 3.4));
  const words: string[] = [];
  let previous = '';
  for (let i = 0; i < count; i += 1) {
    let word = pick(rand, pack.words);
    let guard = 0;
    while (word === previous && guard < 6) {
      word = pick(rand, pack.words);
      guard += 1;
    }
    previous = word;
    words.push(word);
  }

  let sentenceStart = true;
  const result = words.map((word, index) => {
    if (config.numbers && index > 3 && rand() < 0.08) {
      return String(10 + Math.floor(rand() * 9899));
    }
    if (!config.punctuation) return word;
    if (sentenceStart) {
      sentenceStart = false;
      const capitalized = capitalizeFirst(word);
      if (index > 2 && rand() < 0.18) {
        sentenceStart = true;
        return `${capitalized}${rand() < 0.25 ? '?' : '.'}`;
      }
      return capitalized;
    }
    if (index > 2 && rand() < 0.1) {
      sentenceStart = true;
      return `${word}${rand() < 0.25 ? '?' : '.'}`;
    }
    if (rand() < 0.09) return `${word},`;
    return word;
  });

  return result.join(' ');
}

export function buildWeakKeyDrill(keys: string[], language: LanguageId, seed: number): string {
  const rand = mulberry32(seed);
  const pack = getPack(language);
  const focus = keys.filter((key) => /[a-z0-9,.;'/]/.test(key));
  if (!focus.length) return buildLessonText({ ...fallbackLesson }, language, seed);

  const allowed = 'asdfghjkl;'.split('').concat(focus);
  const groups: string[] = [];
  for (let i = 0; i < 18; i += 1) {
    const length = 2 + Math.floor(rand() * 3);
    let group = '';
    for (let c = 0; c < length; c += 1) {
      group += rand() < 0.62 ? pick(rand, focus) : pick(rand, allowed);
    }
    groups.push(group);
  }
  const mentions = pack.words.filter((word) => focus.some((key) => word.includes(key))).slice(0, 40);
  const wordGroups: string[] = [];
  for (let i = 0; i < 10; i += 1) {
    if (mentions.length) {
      wordGroups.push(pick(rand, mentions));
    }
  }
  return [...groups, wordGroups.join(' ').trim()].filter(Boolean).join(' ');
}

const fallbackLesson: Lesson = {
  id: 'review-fallback',
  unitId: 'home',
  index: 0,
  title: 'Home row',
  subtitle: '',
  kind: 'keys',
  newKeys: [],
  allowedKeys: 'asdfghjkl;',
  targetWpm: 20,
  targetAccuracy: 95,
};

export function buildQuote(language: LanguageId, seed: number): { text: string; author: string } {
  const rand = mulberry32(seed);
  const quote = pick(rand, getPack(language).quotes);
  return quote;
}

export function normalizeCustomText(input: string): string {
  return input
    .replace(/\r\n/g, '\n')
    .replace(/\t/g, ' ')
    .replace(/[ \u00a0]+/g, ' ')
    .replace(/\n+/g, ' ')
    .trim();
}

/** Words that contain a given key, used for the finger guide. */
export function exampleForChar(char: string, language: LanguageId): string {
  const pack = getPack(language);
  const match = pack.words.find((word) => word.length > 3 && word.includes(char.toLowerCase()));
  return match ?? '';
}
