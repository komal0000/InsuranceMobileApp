import { TestBed } from '@angular/core/testing';
import { MemberFormComponent } from './member-form.component';
import { LanguageService } from '../../services/language.service';
import { DateService } from '../../services/date.service';
import { addIcons } from 'ionicons';
import { cameraOutline } from 'ionicons/icons';

describe('MemberFormComponent', () => {
  const languageService = {
    currentLanguage: 'en',
    t: (key: string) => key,
    label: (_namespace: string, value?: string) => value || '',
  };

  beforeEach(async () => {
    addIcons({ cameraOutline });

    await TestBed.configureTestingModule({
      imports: [MemberFormComponent],
      providers: [
        { provide: LanguageService, useValue: languageService },
        {
          provide: DateService,
          useValue: {
            getCurrentBs: () => '2083-01-01',
            adToBs: () => '2083-01-01',
            bsToAd: () => '2026-04-14',
          },
        },
      ],
    }).compileComponents();
  });

  it('does not render English or Nepali middle-name controls', () => {
    const fixture = TestBed.createComponent(MemberFormComponent);
    fixture.componentInstance.member = {
      first_name: '',
      middle_name: 'Stale',
      last_name: '',
      first_name_ne: '',
      middle_name_ne: 'पुरानो',
      last_name_ne: '',
    };
    fixture.detectChanges();

    const labels = Array.from(
      fixture.nativeElement.querySelectorAll('ion-input') as NodeListOf<HTMLIonInputElement>,
    ).map((element) => element.label);

    expect(labels).not.toContain('Middle Name');
    expect(labels).not.toContain('Middle Name Nepali');
  });
});
