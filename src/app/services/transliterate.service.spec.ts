import { TransliterateService } from './transliterate.service';

describe('TransliterateService', () => {
  let service: TransliterateService;

  beforeEach(() => {
    service = new TransliterateService();
  });

  it('converts common romanized Nepali name examples to Devanagari', () => {
    expect(service.transliterate('Komal Shrestha')).toBe(
      '\u0915\u094b\u092e\u0932 \u0936\u094d\u0930\u0947\u0937\u094d\u0920'
    );
    expect(service.transliterate('Ram')).toBe('\u0930\u093e\u092e');
    expect(service.transliterate('Shrestha')).toBe('\u0936\u094d\u0930\u0947\u0937\u094d\u0920');
  });

  it('leaves existing Devanagari text unchanged', () => {
    const devanagari = '\u0915\u094b\u092e\u0932 \u0936\u094d\u0930\u0947\u0937\u094d\u0920';

    expect(service.transliterate(devanagari)).toBe(devanagari);
  });
});
