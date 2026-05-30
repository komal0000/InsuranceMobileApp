import { TestBed } from '@angular/core/testing';
import { addIcons } from 'ionicons';
import { arrowBackOutline, cardOutline, checkmarkCircleOutline, createOutline } from 'ionicons/icons';
import { DateService } from '../../../services/date.service';
import { LanguageService } from '../../../services/language.service';
import { ReviewSubmitComponent } from './review-submit.component';

describe('ReviewSubmitComponent', () => {
  const translations: Record<string, string> = {
    'wizard.basai_sarai_permanent_address_changed': 'Basai Sarai (permanent address is changed)',
  };

  const languageService = {
    t: (key: string) => translations[key] ?? key,
    label: (_namespace: string, value?: string, fallback?: string) => value || fallback || '',
    formatNumber: (value: string | number | null | undefined) => String(value ?? 0),
    translateText: (value: string) => value,
  };

  beforeEach(async () => {
    addIcons({ arrowBackOutline, cardOutline, checkmarkCircleOutline, createOutline });

    await TestBed.configureTestingModule({
      imports: [ReviewSubmitComponent],
      providers: [
        { provide: LanguageService, useValue: languageService },
        {
          provide: DateService,
          useValue: {
            calculateAgeFromDates: () => 33,
            formatForDisplay: (adDate?: string | null, bsDate?: string | null) => bsDate || adDate || '',
          },
        },
      ],
    }).compileComponents();
  });

  it('shows Basai Sarai permanent-address change evidence in review', () => {
    const fixture = TestBed.createComponent(ReviewSubmitComponent);
    const component = fixture.componentInstance;
    component.enrollment = {
      id: 1,
      enrollment_number: 'HIB-TEST',
      permanent_address_source: 'migration',
      documents: [
        { id: 10, enrollment_id: 1, document_type: 'basai_sarai_front', file_path: '', url: 'https://example.test/front.pdf' },
        { id: 11, enrollment_id: 1, document_type: 'basai_sarai_back', file_path: '', url: 'https://example.test/back.pdf' },
      ],
    } as any;
    component.step1 = {
      province: 'Koshi',
      district: 'Morang',
      municipality: 'Biratnagar',
      ward_number: '1',
      tole_village: 'Main Tole',
      full_address: 'Main Tole, Biratnagar',
    } as any;
    component.headData = {
      first_name: 'Sunita',
      last_name: 'Lama',
      gender: 'female',
      date_of_birth: '2050/01/01',
      mobile_number: '9812345678',
      marital_status: 'married',
    };
    component.householdHead = { first_name: 'Sunita', last_name: 'Lama' } as any;
    (component as any).basaiSaraiFrontPreview = 'https://example.test/front.pdf';
    (component as any).basaiSaraiBackPreview = 'https://example.test/back.pdf';

    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Basai Sarai (permanent address is changed)');
    expect(text).toContain('Basai Sarai Front');
    expect(text).toContain('Basai Sarai Back');
    expect(fixture.nativeElement.querySelector('img[src="https://example.test/front.pdf"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('img[src="https://example.test/back.pdf"]')).toBeTruthy();
  });
});
