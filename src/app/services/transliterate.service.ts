import { Injectable } from '@angular/core';

/**
 * English-to-Nepali (Devanagari) transliteration service.
 * Converts romanized Nepali text to Devanagari script in real time.
 *
 * Usage: transliterate('Komal Shrestha') → 'कोमल श्रेष्ठ'
 */
@Injectable({ providedIn: 'root' })
export class TransliterateService {

  // Multi-char sequences MUST come before single-char to match greedily.
  private readonly map: [string, string][] = [
    // Conjuncts / special combos (longest first)
    ['shri', 'श्री'],
    ['shr', 'श्र'],
    ['shh', 'षः'],
    ['sh', 'श'],
    ['chh', 'छ'],
    ['ch', 'च'],
    ['thh', 'ठ'],
    ['th', 'थ'],
    ['dhh', 'ढ'],
    ['dh', 'ध'],
    ['ph', 'फ'],
    ['bh', 'भ'],
    ['kh', 'ख'],
    ['gh', 'घ'],
    ['ng', 'ङ'],
    ['jh', 'झ'],
    ['ny', 'ञ'],
    ['tr', 'त्र'],
    ['gya', 'ज्ञ'],
    ['gy', 'ज्ञ'],
    ['ksh', 'क्ष'],
    ['ks', 'क्ष'],

    // Vowels (independent)
    ['aa', 'आ'],
    ['ai', 'ऐ'],
    ['au', 'औ'],
    ['ee', 'ई'],
    ['oo', 'ऊ'],
    ['ou', 'औ'],
    ['ri', 'रि'],

    // Single consonants
    ['k', 'क'],
    ['g', 'ग'],
    ['c', 'च'],
    ['j', 'ज'],
    ['t', 'त'],
    ['d', 'द'],
    ['n', 'न'],
    ['p', 'प'],
    ['b', 'ब'],
    ['m', 'म'],
    ['y', 'य'],
    ['r', 'र'],
    ['l', 'ल'],
    ['w', 'व'],
    ['v', 'व'],
    ['s', 'स'],
    ['h', 'ह'],
    ['f', 'फ'],
    ['q', 'क'],
    ['x', 'क्स'],
    ['z', 'ज'],

    // Single vowels (independent)
    ['a', 'अ'],
    ['e', 'ए'],
    ['i', 'इ'],
    ['o', 'ओ'],
    ['u', 'उ'],
  ];

  // Dependent vowel signs (used after consonants)
  private readonly vowelSigns: Record<string, string> = {
    'आ': 'ा', 'इ': 'ि', 'ई': 'ी', 'उ': 'ु', 'ऊ': 'ू',
    'ए': 'े', 'ऐ': 'ै', 'ओ': 'ो', 'औ': 'ौ',
    'अ': '',  // inherent 'a' — no sign needed
  };

  private readonly independentVowels = new Set([
    'अ', 'आ', 'इ', 'ई', 'उ', 'ऊ', 'ए', 'ऐ', 'ओ', 'औ',
  ]);

  private isConsonant(ch: string): boolean {
    const code = ch.charCodeAt(0);
    // Devanagari consonants: U+0915 – U+0939
    return code >= 0x0915 && code <= 0x0939;
  }

  private lastDevanagariChar(text: string): string | null {
    if (!text.length) return null;
    const last = text[text.length - 1];
    const code = last.charCodeAt(0);
    // Devanagari block U+0900 – U+097F
    if (code >= 0x0900 && code <= 0x097F) return last;
    return null;
  }

  /**
   * Check if the last character in output is a Devanagari consonant
   * (not followed by a vowel sign / virama).
   */
  private endsWithBareConsonant(text: string): boolean {
    if (!text.length) return false;
    const last = text[text.length - 1];
    return this.isConsonant(last);
  }

  transliterate(input: string): string {
    if (!input) return '';

    const lower = input.toLowerCase();
    let result = '';
    let i = 0;

    while (i < lower.length) {
      const ch = lower[i];

      // Pass through spaces, digits, punctuation
      if (ch === ' ' || ch === '.' || ch === ',' || ch === '-' || ch === '\'' ||
          (ch >= '0' && ch <= '9')) {
        // Add halant if the previous output ends with a bare consonant (suppress inherent 'a')
        // Actually for spaces we just pass through — inherent 'a' is kept at end of words
        result += ch;
        i++;
        continue;
      }

      // Try longest match first
      let matched = false;
      for (const [roman, devanagari] of this.map) {
        if (lower.startsWith(roman, i)) {
          if (this.independentVowels.has(devanagari) && this.endsWithBareConsonant(result)) {
            // Previous char is a consonant → use dependent vowel sign
            const sign = this.vowelSigns[devanagari];
            if (sign !== undefined) {
              result += sign;
            } else {
              result += devanagari;
            }
          } else if (!this.independentVowels.has(devanagari) && this.endsWithBareConsonant(result)) {
            // Consonant cluster → add halant + new consonant
            // But if the mapped value is multi-char starting with a consonant, add halant before it
            const first = devanagari[0];
            if (this.isConsonant(first)) {
              result += '्' + devanagari;
            } else {
              result += devanagari;
            }
          } else {
            result += devanagari;
          }
          i += roman.length;
          matched = true;
          break;
        }
      }

      if (!matched) {
        result += ch;
        i++;
      }
    }

    return result;
  }
}
