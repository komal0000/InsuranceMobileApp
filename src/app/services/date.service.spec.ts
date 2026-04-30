import { DateService } from './date.service';

describe('DateService', () => {
  function createService(language = 'en') {
    return new DateService({
      currentLanguage: language,
      localizeDigits: (value: string | number | null | undefined) => {
        const source = value == null ? '' : String(value);
        return language === 'ne'
          ? source.replace(/\d/g, (digit) => '०१२३४५६७८९'[Number(digit)] ?? digit)
          : source;
      },
    } as any);
  }

  it('localizes bs display digits in Nepali mode', () => {
    const service = createService('ne');

    expect(service.formatForDisplay(undefined, '2083-01-15')).toBe('२०८३-०१-१५');
  });

  it('localizes time digits in Nepali mode', () => {
    const service = createService('ne');

    expect(service.formatDateTimeForDisplay('2026-04-30 08:09:10', '2083-01-18', false)).toBe('२०८३-०१-१८ ०८:०९');
  });
});
