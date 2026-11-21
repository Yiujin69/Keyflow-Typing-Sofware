import { getLayout } from './layouts';
import type { LayoutId } from './types';

/**
 * Some languages use characters that a physical layout cannot produce — German
 * umlauts on a US keyboard, for example. Rather than dead-ending the lesson,
 * fall back to the closest ASCII spelling while keeping the exercise complete.
 */
const SIMPLIFY: Record<string, string> = {
  'á': 'a', 'à': 'a', 'â': 'a', 'ä': 'a', 'ã': 'a', 'å': 'a', 'Á': 'A', 'À': 'A', 'Â': 'A', 'Ä': 'A', 'Ã': 'A', 'Å': 'A',
  'é': 'e', 'è': 'e', 'ê': 'e', 'ë': 'e', 'É': 'E', 'È': 'E', 'Ê': 'E', 'Ë': 'E',
  'í': 'i', 'ì': 'i', 'î': 'i', 'ï': 'i', 'Í': 'I', 'Ì': 'I', 'Î': 'I', 'Ï': 'I',
  'ó': 'o', 'ò': 'o', 'ô': 'o', 'ö': 'o', 'õ': 'o', 'ø': 'o', 'Ó': 'O', 'Ò': 'O', 'Ô': 'O', 'Ö': 'O', 'Õ': 'O', 'Ø': 'O',
  'ú': 'u', 'ù': 'u', 'û': 'u', 'ü': 'u', 'Ú': 'U', 'Ù': 'U', 'Û': 'U', 'Ü': 'U',
  'ñ': 'n', 'Ñ': 'N', 'ç': 'c', 'Ç': 'C', 'ý': 'y', 'ÿ': 'y', 'Ý': 'Y', 'ß': 'ss',
  'œ': 'oe', 'Œ': 'OE', 'æ': 'ae', 'Æ': 'AE',
  '’': "'", '‘': "'", '“': '"', '”': '"', '–': '-', '—': '-', '…': '...',
};

export interface TypeableResult {
  text: string;
  simplified: number;
  missing: string[];
}

export function makeTypeable(text: string, layoutId: LayoutId): TypeableResult {
  const map = getLayout(layoutId).charMap;
  let simplified = 0;
  const missing = new Set<string>();
  let output = '';

  for (const char of text) {
    if (char === '\n' || map[char]) {
      output += char;
      continue;
    }
    const replacement = SIMPLIFY[char];
    if (replacement && [...replacement].every((piece) => piece === ' ' || map[piece])) {
      output += replacement;
      simplified += 1;
    } else {
      output += char;
      missing.add(char);
    }
  }

  return { text: output, simplified, missing: [...missing] };
}
