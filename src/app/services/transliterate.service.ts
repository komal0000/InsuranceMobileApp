import { Injectable } from '@angular/core';

interface VowelMap {
  roman: string;
  independent: string;
  sign: string;
}

/**
 * Converts simple romanized Nepali names to Devanagari script.
 */
@Injectable({ providedIn: 'root' })
export class TransliterateService {
  private readonly virama = '\u094d';

  private readonly exactWords: Record<string, string> = {
    ram: '\u0930\u093e\u092e',
    shrestha: '\u0936\u094d\u0930\u0947\u0937\u094d\u0920',
  };

  private readonly consonants: Array<[string, string]> = [
    ['shri', '\u0936\u094d\u0930\u0940'],
    ['shr', '\u0936\u094d\u0930'],
    ['ksh', '\u0915\u094d\u0937'],
    ['gya', '\u091c\u094d\u091e'],
    ['chh', '\u091b'],
    ['thh', '\u0920'],
    ['dhh', '\u0922'],
    ['sh', '\u0936'],
    ['ch', '\u091a'],
    ['th', '\u0925'],
    ['dh', '\u0927'],
    ['ph', '\u092b'],
    ['bh', '\u092d'],
    ['kh', '\u0916'],
    ['gh', '\u0918'],
    ['ng', '\u0919'],
    ['jh', '\u091d'],
    ['ny', '\u091e'],
    ['tr', '\u0924\u094d\u0930'],
    ['gy', '\u091c\u094d\u091e'],
    ['ks', '\u0915\u094d\u0937'],
    ['k', '\u0915'],
    ['g', '\u0917'],
    ['c', '\u091a'],
    ['j', '\u091c'],
    ['t', '\u0924'],
    ['d', '\u0926'],
    ['n', '\u0928'],
    ['p', '\u092a'],
    ['b', '\u092c'],
    ['m', '\u092e'],
    ['y', '\u092f'],
    ['r', '\u0930'],
    ['l', '\u0932'],
    ['w', '\u0935'],
    ['v', '\u0935'],
    ['s', '\u0938'],
    ['h', '\u0939'],
    ['f', '\u092b'],
    ['q', '\u0915'],
    ['x', '\u0915\u094d\u0938'],
    ['z', '\u091c'],
  ];

  private readonly vowels: VowelMap[] = [
    { roman: 'aa', independent: '\u0906', sign: '\u093e' },
    { roman: 'ii', independent: '\u0908', sign: '\u0940' },
    { roman: 'ee', independent: '\u0908', sign: '\u0940' },
    { roman: 'oo', independent: '\u090a', sign: '\u0942' },
    { roman: 'ai', independent: '\u0910', sign: '\u0948' },
    { roman: 'au', independent: '\u0914', sign: '\u094c' },
    { roman: 'ou', independent: '\u0914', sign: '\u094c' },
    { roman: 'ri', independent: '\u090b', sign: '\u0943' },
    { roman: 'a', independent: '\u0905', sign: '' },
    { roman: 'i', independent: '\u0907', sign: '\u093f' },
    { roman: 'e', independent: '\u090f', sign: '\u0947' },
    { roman: 'u', independent: '\u0909', sign: '\u0941' },
    { roman: 'o', independent: '\u0913', sign: '\u094b' },
  ];

  transliterate(input: string): string {
    if (!input || this.containsDevanagari(input)) {
      return input || '';
    }

    return input.replace(/[A-Za-z]+/g, word => this.transliterateWord(word));
  }

  private transliterateWord(word: string): string {
    const lower = word.toLowerCase();
    const exact = this.exactWords[lower];
    if (exact) {
      return exact;
    }

    let result = '';
    let index = 0;

    while (index < lower.length) {
      const consonant = this.matchConsonant(lower, index);
      if (consonant) {
        const nextIndex = index + consonant.roman.length;
        const vowel = this.matchVowel(lower, nextIndex);
        if (vowel) {
          result += consonant.devanagari + vowel.sign;
          index = nextIndex + vowel.roman.length;
          continue;
        }

        result += consonant.devanagari + (this.matchConsonant(lower, nextIndex) ? this.virama : '');
        index = nextIndex;
        continue;
      }

      const vowel = this.matchVowel(lower, index);
      if (vowel) {
        result += vowel.independent;
        index += vowel.roman.length;
        continue;
      }

      result += word[index];
      index++;
    }

    return result;
  }

  private matchConsonant(value: string, index: number): { roman: string; devanagari: string } | null {
    for (const [roman, devanagari] of this.consonants) {
      if (value.startsWith(roman, index)) {
        return { roman, devanagari };
      }
    }

    return null;
  }

  private matchVowel(value: string, index: number): VowelMap | null {
    for (const vowel of this.vowels) {
      if (value.startsWith(vowel.roman, index)) {
        return vowel;
      }
    }

    return null;
  }

  private containsDevanagari(value: string): boolean {
    return /[\u0900-\u097f]/.test(value);
  }
}
