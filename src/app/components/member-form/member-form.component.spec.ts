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
});
