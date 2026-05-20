import { TestBed } from '@angular/core/testing';
import { HouseholdHeadFormComponent } from './household-head-form.component';
import { LanguageService } from '../../../services/language.service';
import { DateService } from '../../../services/date.service';
import { addIcons } from 'ionicons';
import {
  cameraOutline,
  cardOutline,
  checkmarkCircleOutline,
  documentTextOutline,
  locationOutline,
  peopleOutline,
  personOutline,
} from 'ionicons/icons';

describe('HouseholdHeadFormComponent', () => {
  const languageService = {
    currentLanguage: 'en',
    t: (key: string) => key,
    label: (_namespace: string, value?: string) => value || '',
  };

  beforeEach(async () => {
    addIcons({
      cameraOutline,
      cardOutline,
      checkmarkCircleOutline,
      documentTextOutline,
      locationOutline,
      peopleOutline,
      personOutline,
    });

    await TestBed.configureTestingModule({
      imports: [HouseholdHeadFormComponent],
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

  it('does not render household English or Nepali middle-name controls', () => {
    const fixture = TestBed.createComponent(HouseholdHeadFormComponent);
    fixture.componentInstance.headData = {
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
    expect(labels).not.toContain('Middle Name (नेपाली)');
  });

  it('groups split parent and grandparent name controls by relationship', () => {
    const fixture = TestBed.createComponent(HouseholdHeadFormComponent);
    fixture.componentInstance.headData = {};
    fixture.detectChanges();

    const groupTitles = Array.from(
      fixture.nativeElement.querySelectorAll('[data-parent-name-group-title]') as NodeListOf<HTMLElement>,
    ).map((element) => element.textContent?.trim());
    const labels = Array.from(
      fixture.nativeElement.querySelectorAll('[data-parent-name-group] ion-input') as NodeListOf<HTMLIonInputElement>,
    ).map((element) => element.label);
    const groups = Array.from(
      fixture.nativeElement.querySelectorAll('[data-parent-name-group]') as NodeListOf<HTMLElement>,
    );

    expect(groupTitles).toEqual(['Father', 'Mother', 'Grandfather']);
    expect(groups.every((element) => element.classList.contains('parent-name-group--compact'))).toBeTrue();
    expect(labels.filter((label) => label === 'First Name').length).toBe(3);
    expect(labels.filter((label) => label === 'Last Name').length).toBe(3);
    expect(labels.filter((label) => label === 'First Name (नेपाली)').length).toBe(3);
    expect(labels.filter((label) => label === 'Last Name (नेपाली)').length).toBe(3);
  });

  it('renders household citizenship issue-date warning below the date picker', () => {
    const fixture = TestBed.createComponent(HouseholdHeadFormComponent);
    const component = fixture.componentInstance;
    component.headData = {
      date_of_birth: '2050/01/01',
      citizenship_issue_date: '2049/12/30',
      citizenship_issue_district: 'Kathmandu',
      citizenship_number: '12345',
    };
    component.usesBirthCertificate = false;
    (component as any).citizenshipIssueDateErrorMessage = 'Citizenship issue date must be after date of birth.';

    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Citizenship issue date must be after date of birth.');
  });
});
