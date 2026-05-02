import { of } from 'rxjs';
import { Preferences } from '@capacitor/preferences';
import { LanguageService } from './language.service';

describe('LanguageService', () => {
  let api: jasmine.SpyObj<{ patch: (...args: unknown[]) => unknown }>;
  let service: LanguageService;

  beforeEach(() => {
    api = jasmine.createSpyObj('ApiService', ['patch']);
    spyOn(Preferences, 'set').and.returnValue(Promise.resolve());
    service = new LanguageService(api as any);
  });

  it('translates keyed and phrase-based text in Nepali mode', async () => {
    await service.setLocalLanguage('ne');

    expect(service.t('dashboard.title')).toBe('ड्यासबोर्ड');
    expect(service.t('Dashboard')).toBe('ड्यासबोर्ड');
    expect(service.t('Unmapped phrase')).toBe('Unmapped phrase');
  });

  it('translates enrollment search and status filter labels in Nepali mode', async () => {
    await service.setLocalLanguage('ne');

    expect(service.t('enrollments.search_placeholder')).toBe('नाम वा नामांकन नं. बाट खोज्नुहोस्...');
    expect(service.t('enrollments.all')).toBe('सबै');
    expect(service.t('enrollments.draft')).toBe('मस्यौदा');
    expect(service.t('enrollments.verified')).toBe('प्रमाणित');
    expect(service.t('enrollments.approved')).toBe('स्वीकृत');
    expect(service.t('enrollments.rejected')).toBe('अस्वीकृत');
  });

  it('localizes digits and formatted numbers in Nepali mode', async () => {
    await service.setLocalLanguage('ne');

    expect(service.localizeDigits('2083-01-15')).toBe('२०८३-०१-१५');
    expect(service.formatNumber(3500.5, 2)).toBe('३,५००.५०');
  });

  it('persists the authenticated language preference through the backend', (done) => {
    api.patch.and.returnValue(of({
      success: true,
      message: 'Updated.',
      data: {
        id: 1,
        name: 'Komal Shrestha',
        mobile_number: '9812345678',
        preferred_language: 'ne',
        role: 'beneficiary',
        permissions: [],
      },
    }));

    service.setLanguage('ne').subscribe(user => {
      expect(api.patch).toHaveBeenCalledWith('/user/language', { preferred_language: 'ne' });
      expect(user.preferred_language).toBe('ne');
      done();
    });
  });

  it('leaves DOM text alone until a legacy translation root is opted in', async () => {
    const host = document.createElement('div');
    host.textContent = 'Dashboard';
    document.body.appendChild(host);

    try {
      await service.setLocalLanguage('ne');

      expect(host.textContent).toBe('Dashboard');

      service.startDomTranslator(host);

      expect(host.textContent).toBe(service.t('Dashboard'));
    } finally {
      host.remove();
    }
  });
});
