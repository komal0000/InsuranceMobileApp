import { TestBed } from '@angular/core/testing';
import { MemberFormComponent } from './member-form.component';
import { LanguageService } from '../../services/language.service';
import { DateService } from '../../services/date.service';
import { GeoService } from '../../services/geo.service';
import { of } from 'rxjs';
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
            calculateAge: (value: string) => String(value).startsWith('207') ? 10 : 33,
          },
        },
        {
          provide: GeoService,
          useValue: {
            allDistricts: () => of({ success: true, data: ['Kathmandu', 'Lalitpur'] }),
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
    expect(labels).not.toContain('Middle Name (नेपाली)');
  });

  it('does not render the relationship filtering helper text', () => {
    const fixture = TestBed.createComponent(MemberFormComponent);
    const component = fixture.componentInstance;
    component.member = { relationship: '', gender: '' };
    component.relationshipOptions = [{ value: 'son', label: 'Son' }];
    component.showRelationshipConstraintNotice = true;
    component.isHeadSingle = true;

    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;
    expect(text).not.toContain('wizard.relationship_marital_status_notice');
    expect(text).not.toContain('Some relationships are hidden');
  });

  it('normalizes member birth certificate number input to digits', () => {
    const fixture = TestBed.createComponent(MemberFormComponent);
    const component = fixture.componentInstance;
    component.member = { document_type: 'birth_certificate', birth_certificate_number: '' };

    component.normalizeBirthCertificateNumber(new CustomEvent('ionInput', {
      detail: { value: 'BC-१२३' },
    }));

    expect(component.member.birth_certificate_number).toBe('123');
  });

  it('renders optional first service point choices for members', () => {
    const fixture = TestBed.createComponent(MemberFormComponent);
    const component = fixture.componentInstance;
    component.member = { relationship: '', gender: '', first_service_point_id: '' };
    (component as any).servicePointOptions = [
      { id: 7, code: 'H0302000', name: 'Bir Hospital' },
    ];

    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;

    expect(text).toContain('Bir Hospital');
  });

  it('renders occupation choices from profession options for members', () => {
    const fixture = TestBed.createComponent(MemberFormComponent);
    const component = fixture.componentInstance;
    component.member = { relationship: '', gender: '', occupation: 'Agriculture' };
    component.professionOptions = [
      { id: 1, label: 'Government' },
      { id: 5, label: 'Agriculture' },
    ];

    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;
    const selects = Array.from(
      fixture.nativeElement.querySelectorAll('ion-select') as NodeListOf<HTMLIonSelectElement>,
    );

    expect(text).toContain('Agriculture');
    expect(selects.some((select) => select.label === 'Occupation')).toBeTrue();
  });

  it('detects district values outside the standard issue-district list', () => {
    const fixture = TestBed.createComponent(MemberFormComponent);
    const component = fixture.componentInstance;
    component.member = { relationship: '', gender: '' };
    fixture.detectChanges();

    expect(component.hasDistrictOption('Kathmandu')).toBeTrue();
    expect(component.hasDistrictOption('Legacy District')).toBeFalse();
  });

  it('renders NID-locked member fields visible but readonly', () => {
    const fixture = TestBed.createComponent(MemberFormComponent);
    const component = fixture.componentInstance;
    component.member = {
      first_name: 'Sita',
      last_name: 'Shrestha',
      gender: 'female',
      date_of_birth: '2050-01-01',
    };
    (component as any).lockedFields = new Set(['first_name', 'gender', 'date_of_birth']);

    fixture.detectChanges();

    const inputs = Array.from(
      fixture.nativeElement.querySelectorAll('ion-input') as NodeListOf<HTMLIonInputElement>,
    );
    const selects = Array.from(
      fixture.nativeElement.querySelectorAll('ion-select') as NodeListOf<HTMLIonSelectElement>,
    );
    const firstNameInput = inputs.find((input) => input.label === 'First Name *');
    const genderSelect = selects.find((select) => select.label === 'Gender *');

    expect(firstNameInput).toBeTruthy();
    expect(Boolean(firstNameInput?.readonly || firstNameInput?.disabled)).toBeTrue();
    expect(genderSelect).toBeTruthy();
    expect(Boolean(genderSelect?.disabled || genderSelect?.hasAttribute('disabled'))).toBeTrue();
    expect(component.member.first_name).toBe('Sita');
  });

  it('renders relationship before member name controls', () => {
    const fixture = TestBed.createComponent(MemberFormComponent);
    const component = fixture.componentInstance;
    component.member = { relationship: '', first_name: '', last_name: '', gender: '' };
    component.relationshipOptions = [{ value: 'father', label: 'Father' }];

    fixture.detectChanges();

    const controls = Array.from(
      fixture.nativeElement.querySelectorAll('ion-select, ion-input') as NodeListOf<HTMLElement>,
    ).map((element: any) => element.label);

    expect(controls.indexOf('Relationship to Head *')).toBeLessThan(controls.indexOf('First Name *'));
  });

  it('fills parent names from the household head when a parent relationship is selected', () => {
    const fixture = TestBed.createComponent(MemberFormComponent);
    const component = fixture.componentInstance;
    component.member = { relationship: '', first_name: '', last_name: '', first_name_ne: '', last_name_ne: '', gender: '' };
    (component as any).relationshipNameAutofill = {
      father: {
        first_name: 'Jit',
        last_name: 'Lama',
        first_name_ne: 'जित',
        last_name_ne: 'लामा',
      },
    };

    component.onRelationshipChange('father');

    expect(component.member.first_name).toBe('Jit');
    expect(component.member.last_name).toBe('Lama');
    expect(component.member.first_name_ne).toBe('जित');
    expect(component.member.last_name_ne).toBe('लामा');
  });

  it('does not overwrite manually entered or NID-locked names during parent relationship autofill', () => {
    const fixture = TestBed.createComponent(MemberFormComponent);
    const component = fixture.componentInstance;
    component.member = {
      relationship: '',
      first_name: 'NID First',
      last_name: '',
      first_name_ne: 'Manual Nepali',
      last_name_ne: '',
      gender: '',
    };
    component.lockedFields = new Set(['first_name']);
    (component as any).relationshipNameAutofill = {
      mother: {
        first_name: 'Sharmila',
        last_name: 'Lama',
        first_name_ne: 'शर्मिला',
        last_name_ne: 'लामा',
      },
    };

    component.onRelationshipChange('mother');

    expect(component.member.first_name).toBe('NID First');
    expect(component.member.last_name).toBe('Lama');
    expect(component.member.first_name_ne).toBe('Manual Nepali');
    expect(component.member.last_name_ne).toBe('लामा');
  });

  it('renders member citizenship issue-date warning when issue date is filled', () => {
    const fixture = TestBed.createComponent(MemberFormComponent);
    const component = fixture.componentInstance;
    component.member = {
      first_name: 'Sita',
      last_name: 'Shrestha',
      gender: 'female',
      date_of_birth: '2050/01/01',
      document_type: 'citizenship',
      citizenship_issue_date: '2049/12/30',
    };
    (component as any).citizenshipIssueDateErrorMessage = 'Citizenship issue date must be after date of birth.';

    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Citizenship issue date must be after date of birth.');
  });

  it('does not render member citizenship issue-date warning when issue date is blank', () => {
    const fixture = TestBed.createComponent(MemberFormComponent);
    const component = fixture.componentInstance;
    component.member = {
      first_name: 'Sita',
      last_name: 'Shrestha',
      gender: 'female',
      date_of_birth: '2050/01/01',
      document_type: 'citizenship',
      citizenship_issue_date: '',
    };
    (component as any).citizenshipIssueDateErrorMessage = 'Citizenship issue date must be after date of birth.';

    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).not.toContain('Citizenship issue date must be after date of birth.');
  });

  it('sets male gender and locks the field when son is selected', () => {
    const fixture = TestBed.createComponent(MemberFormComponent);
    const component = fixture.componentInstance;
    component.member = { relationship: '', gender: '' };
    component.relationshipGenderMap = { son: 'male', daughter: 'female' };

    component.onRelationshipChange('son');

    expect(component.member.gender).toBe('male');
    expect(component.isGenderLocked).toBeTrue();
  });

  it('sets female gender and locks the field when daughter is selected', () => {
    const fixture = TestBed.createComponent(MemberFormComponent);
    const component = fixture.componentInstance;
    component.member = { relationship: '', gender: '' };
    component.relationshipGenderMap = { son: 'male', daughter: 'female' };

    component.onRelationshipChange('daughter');

    expect(component.member.gender).toBe('female');
    expect(component.isGenderLocked).toBeTrue();
  });

  it('sets sibling-in-law gender from the configured relationship map', () => {
    const fixture = TestBed.createComponent(MemberFormComponent);
    const component = fixture.componentInstance;
    component.member = { relationship: '', gender: '' };
    component.relationshipGenderMap = {
      brother_in_law: 'male',
      sister_in_law: 'female',
    };

    component.onRelationshipChange('brother_in_law');

    expect(component.member.gender).toBe('male');
    expect(component.isGenderLocked).toBeTrue();

    component.onRelationshipChange('sister_in_law');

    expect(component.member.gender).toBe('female');
    expect(component.isGenderLocked).toBeTrue();
  });

  it('keeps spouse gender manual and unlocked', () => {
    const fixture = TestBed.createComponent(MemberFormComponent);
    const component = fixture.componentInstance;
    component.member = { relationship: '', gender: 'female' };
    component.relationshipGenderMap = { son: 'male', daughter: 'female' };

    component.onRelationshipChange('spouse');

    expect(component.member.gender).toBe('female');
    expect(component.isGenderLocked).toBeFalse();
  });

  it('sets spouse marital status and opposite gender when household head gender is binary', () => {
    const fixture = TestBed.createComponent(MemberFormComponent);
    const component = fixture.componentInstance;
    component.member = { relationship: '', gender: '', marital_status: 'single' };
    component.headGender = 'male';

    component.onRelationshipChange('spouse');

    expect(component.member.gender).toBe('female');
    expect(component.member.marital_status).toBe('married');
    expect(component.isGenderLocked).toBeTrue();
    expect(component.isSpouseMaritalStatusLocked).toBeTrue();
  });

  it('clears married and divorced options for members under twenty', () => {
    const fixture = TestBed.createComponent(MemberFormComponent);
    const component = fixture.componentInstance;
    component.member = {
      relationship: 'son',
      gender: 'male',
      date_of_birth: '2075-01-01',
      marital_status: 'married',
    };

    component.syncMaritalStatusForAge();

    expect(component.member.marital_status).toBe('');
    expect(component.isMaritalOptionDisabled('married')).toBeTrue();
    expect(component.isMaritalOptionDisabled('divorced')).toBeTrue();
  });

  it('switches under-sixteen members to birth-certificate identity when birth date changes', () => {
    const fixture = TestBed.createComponent(MemberFormComponent);
    const component = fixture.componentInstance;
    component.member = {
      relationship: 'daughter',
      gender: 'female',
      date_of_birth: '2075-01-01',
      marital_status: 'single',
      document_type: 'citizenship',
      citizenship_number: 'STALE-CIT',
      citizenship_issue_date: '2080-01-01',
      citizenship_issue_district: 'Kathmandu',
    };

    component.syncMaritalStatusForAge();

    expect(component.member.document_type).toBe('birth_certificate');
    expect(component.member.citizenship_number).toBe('');
    expect(component.member.citizenship_issue_date).toBe('');
    expect(component.member.citizenship_issue_district).toBe('');
  });

  it('switches adult members to citizenship identity when birth date changes', () => {
    const fixture = TestBed.createComponent(MemberFormComponent);
    const component = fixture.componentInstance;
    component.member = {
      relationship: 'daughter',
      gender: 'female',
      date_of_birth: '2050-01-01',
      marital_status: 'single',
      document_type: 'birth_certificate',
      birth_certificate_number: 'STALE-BC',
      birth_certificate_issue_date: '2070-01-01',
    };

    component.syncMaritalStatusForAge();

    expect(component.member.document_type).toBe('citizenship');
    expect(component.member.birth_certificate_number).toBe('');
    expect(component.member.birth_certificate_issue_date).toBe('');
  });

  it('does not show under-twenty marital warning when status is blank or single', () => {
    const fixture = TestBed.createComponent(MemberFormComponent);
    const component = fixture.componentInstance;
    component.member = {
      relationship: 'daughter',
      gender: 'female',
      date_of_birth: '2075-01-01',
      marital_status: '',
    };

    expect(component.memberRelationshipWarning).toBe('');

    component.member.marital_status = 'single';

    expect(component.memberRelationshipWarning).toBe('');
  });
});
