import { of, Subject } from 'rxjs';
import { EnrollmentWizardPage } from './enrollment-wizard.page';
import { ApiResponse } from '../../interfaces/api-response.interface';

describe('EnrollmentWizardPage', () => {
  function languageService(language = 'en') {
    return {
      currentLanguage: language,
      language$: of(language),
      t: (key: string) => key,
      translateText: (value?: string) => value || '',
      label: (_namespace: string, _value?: string, fallback?: string) => fallback || '',
      formatNumber: (value?: string | number) => String(value ?? ''),
      localizeDigits: (value?: string | number) => String(value ?? ''),
    };
  }

  function response(data: string[]): ApiResponse<string[]> {
    return {
      success: true,
      message: 'Loaded.',
      data,
    };
  }

  function toastController() {
    return {
      create: jasmine.createSpy().and.returnValue(Promise.resolve({
        present: jasmine.createSpy().and.returnValue(Promise.resolve()),
      })),
    };
  }

  function createPage(overrides: {
    enrollmentSvc?: unknown;
    geoSvc?: unknown;
    dateService?: unknown;
    languageService?: unknown;
    authService?: unknown;
  } = {}) {
    return new EnrollmentWizardPage(
      {} as any,
      {} as any,
      (overrides.enrollmentSvc || {}) as any,
      (overrides.geoSvc || {}) as any,
      (overrides.dateService || {}) as any,
      (overrides.languageService || languageService()) as any,
      (overrides.authService || { getCurrentUser: () => null }) as any,
      toastController() as any,
      {} as any
    );
  }

  it('starts new household details behind the NID gate', () => {
    const page = createPage();

    expect(page.showNidGate2).toBeTrue();
    expect(page.showHouseholdHeadForm).toBeFalse();
  });

  it('manual NID fallback reveals the form and preserves the typed NID', () => {
    const page = createPage();
    page.nidNumber2 = ' 123456789 ';
    page.nidMessage2 = 'Lookup failed.';

    page.skipNidGate2();

    expect(page.showNidGate2).toBeFalse();
    expect(page.showHouseholdHeadForm).toBeTrue();
    expect(page.headData.national_id).toBe('123456789');
    expect(page.nidMessage2).toBe('');
    expect(page.nidLockedHeadFields.size).toBe(0);
  });

  it('prefills empty household mobile number from the registered user', () => {
    const page = createPage({
      authService: {
        getCurrentUser: () => ({ mobile_number: '9800980066' }),
      },
    });

    (page as any).applyRegisteredMobileNumber();

    expect(page.headData.mobile_number).toBe('9800980066');
  });

  it('does not overwrite an existing household mobile number with the registered user mobile', () => {
    const page = createPage({
      authService: {
        getCurrentUser: () => ({ mobile_number: '9800980066' }),
      },
    });
    page.headData.mobile_number = '9811111111';

    (page as any).applyRegisteredMobileNumber();

    expect(page.headData.mobile_number).toBe('9811111111');
  });

  it('prefills cascading location fields from mapped NID data', () => {
    const geoSvc = {
      districts: jasmine.createSpy().and.returnValue(of(response(['Kathmandu']))),
      municipalities: jasmine.createSpy().and.returnValue(of(response(['Kathmandu Metropolitan City']))),
      wards: jasmine.createSpy().and.returnValue(of(response(['1', '2']))),
    };

    const page = new EnrollmentWizardPage(
      {} as any,
      {} as any,
      {} as any,
      geoSvc as any,
      {} as any,
      languageService() as any,
      { getCurrentUser: () => null } as any,
      {} as any,
      {} as any
    );

    (page as any).applyNidLocation({
      province: 'Bagamati',
      district: 'Kathmandu',
      municipality: 'Kathmandu Metropolitan City',
    });

    expect(page.step1.province).toBe('Bagamati');
    expect(page.step1.district).toBe('Kathmandu');
    expect(page.step1.municipality).toBe('Kathmandu Metropolitan City');
    expect(page.districts).toEqual(['Kathmandu']);
    expect(page.municipalities).toEqual(['Kathmandu Metropolitan City']);
    expect(page.wards).toEqual(['1', '2']);
    expect(geoSvc.districts).toHaveBeenCalledWith('Bagamati');
    expect(geoSvc.municipalities).toHaveBeenCalledWith('Bagamati', 'Kathmandu');
    expect(geoSvc.wards).toHaveBeenCalledWith('Bagamati', 'Kathmandu', 'Kathmandu Metropolitan City');
  });

  it('loads mapped household-head NID address, citizenship district, and JPEG photo', () => {
    const enrollmentSvc = {
      headNidLookup: jasmine.createSpy().and.returnValue(of({
        success: true,
        message: 'Verified.',
        data: {
          national_id: '123456789',
          first_name: 'Komal',
          last_name: 'Shrestha',
          citizenship_number: '311022/65843',
          citizenship_issue_date_bs: '2066-08-04',
          citizenship_issue_district: 'Makawanpur',
          province: 'Bagamati',
          district: 'Makawanpur',
          municipality: 'Hetauda Sub-Metropolitan City',
          ward_number: '9',
          tole_village: 'Madanpath',
          photo_url: 'data:image/jpeg;base64,abc123',
        },
      })),
    };
    const geoSvc = {
      districts: jasmine.createSpy().and.returnValue(of(response(['Makawanpur']))),
      municipalities: jasmine.createSpy().and.returnValue(of(response(['Hetauda Sub-Metropolitan City']))),
      wards: jasmine.createSpy().and.returnValue(of(response(['9', '10']))),
    };

    const page = new EnrollmentWizardPage(
      {} as any,
      {} as any,
      enrollmentSvc as any,
      geoSvc as any,
      { formatForDisplay: (_ad?: string, bs?: string) => bs || '' } as any,
      languageService() as any,
      { getCurrentUser: () => null } as any,
      toastController() as any,
      {} as any
    );

    page.enrollmentId = 4;
    page.nidNumber2 = '123456789';
    page.lookupNid2();

    expect(page.step1.province).toBe('Bagamati');
    expect(page.step1.district).toBe('Makawanpur');
    expect(page.step1.municipality).toBe('Hetauda Sub-Metropolitan City');
    expect(page.step1.ward_number).toBe('9');
    expect(page.step1.tole_village).toBe('Madanpath');
    expect(page.headData.citizenship_issue_district).toBe('Makawanpur');
    expect(page.headPhotoPreview).toBe('data:image/jpeg;base64,abc123');
    expect(page.isHeadFieldReadonly('citizenship_issue_district')).toBeTrue();
    expect(enrollmentSvc.headNidLookup).toHaveBeenCalledWith(4, '123456789');
  });

  it('loads member NID citizenship district and JPEG photo preview', () => {
    const enrollmentSvc = {
      nidLookup: jasmine.createSpy().and.returnValue(of({
        success: true,
        message: 'Verified.',
        data: {
          first_name: 'Sita',
          last_name: 'Shrestha',
          citizenship_number: '98765',
          citizenship_issue_date_bs: '2070-01-02',
          citizenship_issue_district: 'Makawanpur',
          photo_url: 'data:image/jpeg;base64,member123',
        },
      })),
    };

    const page = new EnrollmentWizardPage(
      {} as any,
      {} as any,
      enrollmentSvc as any,
      {} as any,
      { formatForDisplay: (_ad?: string, bs?: string) => bs || '' } as any,
      languageService() as any,
      { getCurrentUser: () => null } as any,
      toastController() as any,
      {} as any
    );

    page.nidNumberMember = '123456789';
    page.lookupNidMember();

    expect(page.newMember.citizenship_issue_district).toBe('Makawanpur');
    expect(page.memberPhotoPreview).toBe('data:image/jpeg;base64,member123');
    expect(page.nidVerifiedMember).toBeTrue();
    expect(enrollmentSvc.nidLookup).toHaveBeenCalledWith('123456789');
  });

  it('localizes step titles from the language service', () => {
    const localizedLanguageService = {
      currentLanguage: 'ne',
      language$: of('ne'),
      t: (key: string) => `translated:${key}`,
      translateText: (value?: string) => value || '',
      label: (_namespace: string, _value?: string, fallback?: string) => fallback || '',
      formatNumber: (value?: string | number) => String(value ?? ''),
      localizeDigits: (value?: string | number) => String(value ?? ''),
    };

    const page = createPage({ languageService: localizedLanguageService });

    expect(page.stepTitles).toEqual([
      'translated:wizard.step1',
      'translated:wizard.step2',
      'translated:wizard.step3',
    ]);
  });

  it('excludes stale household middle-name fields from the household payload', () => {
    const page = createPage();
    page.headData = {
      first_name: 'Komal',
      middle_name: 'Ignored',
      last_name: 'Shrestha',
      first_name_ne: 'कोमल',
      middle_name_ne: 'इग्नोर',
      last_name_ne: 'श्रेष्ठ',
    };

    const formData = (page as any).buildHouseholdHeadFormData() as FormData;

    expect(formData.has('first_name')).toBeTrue();
    expect(formData.has('last_name')).toBeTrue();
    expect(formData.has('middle_name')).toBeFalse();
    expect(formData.has('middle_name_ne')).toBeFalse();
  });

  it('excludes stale member middle-name fields from add-member payloads', async () => {
    const enrollmentSvc = {
      addMember: jasmine.createSpy().and.returnValue(of({ success: true, message: 'Saved.', data: { id: 10 } })),
    };
    const page = createPage({
      enrollmentSvc,
      dateService: {
        getCurrentBs: () => '2083-01-01',
        calculateAge: () => 30,
      },
    });
    page.enrollmentId = 4;
    page.newMember = {
      first_name: 'Sita',
      middle_name: 'Ignored',
      last_name: 'Shrestha',
      first_name_ne: 'सीता',
      middle_name_ne: 'इग्नोर',
      last_name_ne: 'श्रेष्ठ',
      gender: 'female',
      date_of_birth: '2050-01-01',
      relationship: 'spouse',
    };

    await page.saveMember();

    expect(enrollmentSvc.addMember).toHaveBeenCalled();
    const submitted = enrollmentSvc.addMember.calls.mostRecent().args[1] as FormData;
    expect(submitted.has('first_name')).toBeTrue();
    expect(submitted.has('last_name')).toBeTrue();
    expect(submitted.has('middle_name')).toBeFalse();
    expect(submitted.has('middle_name_ne')).toBeFalse();
  });

  it('excludes stale member middle-name fields from edit-member payloads', async () => {
    const enrollmentSvc = {
      updateMember: jasmine.createSpy().and.returnValue(of({ success: true, message: 'Saved.', data: { id: 9 } })),
    };
    const page = createPage({
      enrollmentSvc,
      dateService: {
        getCurrentBs: () => '2083-01-01',
        calculateAge: () => 30,
      },
    });
    page.enrollmentId = 4;
    page.editingMemberId = 9;
    page.newMember = {
      first_name: 'Sita',
      middle_name: 'Ignored',
      last_name: 'Shrestha',
      first_name_ne: 'सीता',
      middle_name_ne: 'इग्नोर',
      last_name_ne: 'श्रेष्ठ',
      gender: 'female',
      date_of_birth: '2050-01-01',
      relationship: 'spouse',
    };

    await page.saveMember();

    expect(enrollmentSvc.updateMember).toHaveBeenCalledWith(4, 9, jasmine.any(FormData));
    const submitted = enrollmentSvc.updateMember.calls.mostRecent().args[2] as FormData;
    expect(submitted.has('middle_name')).toBeFalse();
    expect(submitted.has('middle_name_ne')).toBeFalse();
  });

  it('stops listening to language changes when destroyed', () => {
    const languageChanges = new Subject<string>();
    let prefix = 'initial';
    const localizedLanguageService = {
      currentLanguage: 'en',
      language$: languageChanges.asObservable(),
      t: (key: string) => `${prefix}:${key}`,
      translateText: (value?: string) => value || '',
      label: (_namespace: string, _value?: string, fallback?: string) => fallback || '',
      formatNumber: (value?: string | number) => String(value ?? ''),
      localizeDigits: (value?: string | number) => String(value ?? ''),
    };
    const enrollmentSvc = {
      getConfig: jasmine.createSpy().and.returnValue(of({ success: true, message: 'Loaded.', data: {} })),
      get: jasmine.createSpy().and.returnValue(of({ success: true, message: 'Loaded.', data: {} })),
    };
    const geoSvc = {
      provinces: jasmine.createSpy().and.returnValue(of(response([]))),
    };
    const dateService = {
      getCurrentBs: () => '2083-01-01',
      formatForDisplay: (_ad?: string, bs?: string) => bs || '',
    };
    const page = new EnrollmentWizardPage(
      { snapshot: { paramMap: { get: () => '7' } } } as any,
      {} as any,
      enrollmentSvc as any,
      geoSvc as any,
      dateService as any,
      localizedLanguageService as any,
      { getCurrentUser: () => null } as any,
      toastController() as any,
      {} as any
    );

    page.ngOnInit();
    prefix = 'changed';
    languageChanges.next('ne');

    expect(page.stepTitles[0]).toBe('changed:wizard.step1');

    page.ngOnDestroy();
    prefix = 'after-destroy';
    languageChanges.next('en');

    expect(page.stepTitles[0]).toBe('changed:wizard.step1');
  });
});
