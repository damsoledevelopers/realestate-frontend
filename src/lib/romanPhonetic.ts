/** How English layout names sound in Devanagari — not meaning translations. */
const LAYOUT_NAME_PHONETIC: Record<string, string> = {
  example: 'एक्झाम्पल',
};

const LETTER_MAP: Record<string, string> = {
  a: 'ए',
  b: 'बी',
  c: 'सी',
  d: 'डी',
  e: 'ई',
  f: 'एफ',
  g: 'जी',
  h: 'एच',
  i: 'आय',
  j: 'जे',
  k: 'के',
  l: 'एल',
  m: 'एम',
  n: 'एन',
  o: 'ओ',
  p: 'पी',
  q: 'क्यू',
  r: 'आर',
  s: 'एस',
  t: 'टी',
  u: 'यू',
  v: 'वी',
  w: 'डब्ल्यू',
  x: 'एक्स',
  y: 'वाय',
  z: 'झेड',
};

const PHONETIC_RULES: [string, string][] = [
  ['sch', 'श'],
  ['tion', 'शन'],
  ['ough', 'ॉ'],
  ['igh', 'ाई'],
  ['sh', 'श'],
  ['ch', 'च'],
  ['th', 'थ'],
  ['ph', 'फ'],
  ['gh', 'ग'],
  ['ck', 'क'],
  ['qu', 'क्व'],
  ['wh', 'व्ह'],
  ['ex', 'एक्स'],
  ['ee', 'ी'],
  ['oo', 'ू'],
  ['ea', 'ी'],
  ['ou', 'ाउ'],
  ['ai', 'ाई'],
  ['ay', 'े'],
  ['ey', 'े'],
  ['x', 'क्स'],
  ['a', 'अ'],
  ['e', 'े'],
  ['i', 'ि'],
  ['o', 'ो'],
  ['u', 'ु'],
  ['y', 'य'],
  ['b', 'ब'],
  ['c', 'क'],
  ['d', 'ड'],
  ['f', 'फ'],
  ['g', 'ग'],
  ['h', 'ह'],
  ['j', 'ज'],
  ['k', 'क'],
  ['l', 'ल'],
  ['m', 'म'],
  ['n', 'न'],
  ['p', 'प'],
  ['q', 'क'],
  ['r', 'र'],
  ['s', 'स'],
  ['t', 'ट'],
  ['v', 'व'],
  ['w', 'व'],
  ['z', 'झ'],
];

const sortedPhoneticRules = [...PHONETIC_RULES].sort((a, b) => b[0].length - a[0].length);

/** Phonetic rules tuned for layout names (sound-as-is, not meaning). */
const LAYOUT_NAME_RULES: [string, string][] = [
  ...PHONETIC_RULES.filter(([key]) => key !== 'ex'),
  ['ex', 'एक्झ'],
];
const sortedLayoutNameRules = [...LAYOUT_NAME_RULES].sort((a, b) => b[0].length - a[0].length);

function hasDevanagari(text: string): boolean {
  return /[\u0900-\u097F]/.test(text);
}

function spellOutLetters(text: string): string {
  return text
    .toLowerCase()
    .split('')
    .filter((char) => /[a-z]/.test(char))
    .map((char) => LETTER_MAP[char] || char)
    .join(' ');
}

function transliterateWithRules(word: string, rules: [string, string][]): string {
  let index = 0;
  let result = '';
  const source = word.toLowerCase();

  while (index < source.length) {
    let matched = false;
    for (const [from, to] of rules) {
      if (source.startsWith(from, index)) {
        result += to;
        index += from.length;
        matched = true;
        break;
      }
    }
    if (!matched) {
      index += 1;
    }
  }

  return result || word;
}

function transliterateEnglishWord(word: string): string {
  const lower = word.toLowerCase();
  if (/^[a-z]{1,3}$/.test(lower)) return spellOutLetters(lower);
  return transliterateWithRules(lower, sortedPhoneticRules);
}

function transliterateLayoutNameWord(word: string): string {
  const lower = word.toLowerCase();
  if (LAYOUT_NAME_PHONETIC[lower]) return LAYOUT_NAME_PHONETIC[lower];
  if (/^[a-z]{1,3}$/.test(lower)) return spellOutLetters(lower);
  return transliterateWithRules(lower, sortedLayoutNameRules);
}

/** Approximate English → Devanagari for addresses and general text. */
export function phoneticLatinToMarathi(text: string): string {
  if (!text.trim() || hasDevanagari(text) || !/[a-zA-Z]/.test(text)) {
    return text;
  }

  return text
    .split(/(\s+|[-_/]+)/)
    .map((part) => {
      if (!/[a-zA-Z]/.test(part)) return part;
      return transliterateEnglishWord(part);
    })
    .join('');
}

/** Layout names: phonetic Devanagari only — no meaning translation. */
export function phoneticLayoutNameToMarathi(text: string): string {
  if (!text.trim() || hasDevanagari(text) || !/[a-zA-Z]/.test(text)) {
    return text;
  }

  return text
    .split(/(\s+|[-_/]+)/)
    .map((part) => {
      if (!/[a-zA-Z]/.test(part)) return part;
      return transliterateLayoutNameWord(part);
    })
    .join('');
}
