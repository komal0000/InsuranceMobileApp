import { DateService } from './date.service';

describe('DateService', () => {
  function createService(language = 'en') {
    return new DateService({
      currentLanguage: language,
      localizeDigits: (value: string | number | null | undefined) => {
        const source = value == null ? '' : String(value);
        return language === 'ne' ? `localized:${source}` : source;
      },
    } as any);
  }

  it('formats BS dates for display with slash separators', () => {
    const service = createService('en');

    expect(service.formatForDisplay(undefined, '2083-01-15')).toBe('2083/01/15');
  });

  it('localizes slash-separated date and time display values in Nepali mode', () => {
    const service = createService('ne');

    expect(service.formatDateTimeForDisplay('2026-04-30 08:09:10', '2083-01-18', false))
      .toBe('localized:2083/01/18 localized:08:09');
  });

  it('accepts typed slash-separated BS dates for API payloads', () => {
    const service = createService('en');
    const hyphenApiDate = service.toApiDate('2083-01-15', 'bs');

    expect(service.toApiDate('2083/01/15', 'bs')).toBe(hyphenApiDate);

    const formData = new FormData();
    formData.append('date_of_birth', '2083/01/15');
    const prepared = service.prepareFormDataForApi(formData, ['date_of_birth']);

    expect(prepared.get('date_of_birth')).toBe(hyphenApiDate);
    expect(prepared.get('date_of_birth_bs')).toBe('2083-01-15');
  });
});
