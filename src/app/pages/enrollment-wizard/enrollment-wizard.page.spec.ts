import { of, Subject, throwError } from 'rxjs';
import { EnrollmentWizardPage } from './enrollment-wizard.page';
import { ApiResponse } from '../../interfaces/api-response.interface';
import { AddressFormComponent } from './components/address-form.component';

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

  function servicePointResponse(data: Array<{ id: number; code: string; name: string }>): ApiResponse<Array<{ id: number; code: string; name: string }>> {
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
    router?: unknown;
    enrollmentSvc?: unknown;
    geoSvc?: unknown;
    dateService?: unknown;
    languageService?: unknown;
    authService?: unknown;
    alertCtrl?: unknown;
  } = {}) {
    const defaultGeoSvc = {
      provinces: jasmine.createSpy().and.returnValue(of(response([]))),
      districts: jasmine.createSpy().and.returnValue(of(response([]))),
      municipalities: jasmine.createSpy().and.returnValue(of(response([]))),
      wards: jasmine.createSpy().and.returnValue(of(response([]))),
      servicePoints: jasmine.createSpy().and.returnValue(of(servicePointResponse([]))),
    };
    const defaultDateService = {
      getCurrentBs: () => '2083-01-01',
      calculateAge: () => 30,
      formatForDisplay: (ad?: string, bs?: string) => bs || ad || '',
      isCitizenshipIssueDateValid: () => true,
      citizenshipIssueDateError: () => null,
      prepareFormDataForApi: (fd: FormData) => fd,
    };

    return new EnrollmentWizardPage(
      {} as any,
      (overrides.router || {}) as any,
      (overrides.enrollmentSvc || {}) as any,
      ({ ...defaultGeoSvc, ...((overrides.geoSvc || {}) as object) }) as any,
      ({ ...defaultDateService, ...((overrides.dateService || {}) as object) }) as any,
      (overrides.languageService || languageService()) as any,
      (overrides.authService || { getCurrentUser: () => null }) as any,
      toastController() as any,
      (overrides.alertCtrl || {}) as any
    );
  }

  function createAddressForm() {
    return new AddressFormComponent(languageService() as any);
  }

  function parentGrandparentNames() {
    return {
      father_first_name: 'Jit Bahadur',
      father_last_name: 'Lama',
      father_first_name_ne: 'जित बहादुर',
      father_last_name_ne: 'लामा',
      mother_first_name: 'Sharmila Maya',
      mother_last_name: 'Lama',
      mother_first_name_ne: 'शर्मिला माया',
      mother_last_name_ne: 'लामा',
      grandfather_first_name: 'Kalu Bahadur',
      grandfather_last_name: 'Lama',
      grandfather_first_name_ne: 'कालु बहादुर',
      grandfather_last_name_ne: 'लामा',
    };
  }

  function fillValidHouseholdHead(page: EnrollmentWizardPage) {
    page.enrollmentId = 4;
    page.currentStep = 1;
    page.step1 = {
      province: 'Bagmati',
      district: 'Kathmandu',
      municipality: 'Kathmandu',
      ward_number: '1',
      tole_village: '',
      full_address: '',
    };
    page.headData = {
      ...page.headData,
      ...parentGrandparentNames(),
      first_name: 'Komal',
      last_name: 'Shrestha',
      gender: 'female',
      date_of_birth: '1990-06-15',
      mobile_number: '9812345678',
      marital_status: 'married',
      citizenship_number: '311022/65843',
      citizenship_issue_date: '2066-08-04',
      citizenship_issue_district: 'Kathmandu',
    };
  }

  function relationshipOptions() {
    return [
      { value: 'spouse', label: 'Spouse' },
      { value: 'son', label: 'Son' },
      { value: 'daughter', label: 'Daughter' },
      { value: 'grandson', label: 'Grandson' },
      { value: 'granddaughter', label: 'Granddaughter' },
      { value: 'father', label: 'Father' },
      { value: 'father_in_law', label: 'Father-in-law' },
      { value: 'mother_in_law', label: 'Mother-in-law' },
      { value: 'brother_in_law', label: 'Brother-in-law' },
      { value: 'sister_in_law', label: 'Sister-in-law' },
      { value: 'son_in_law', label: 'Son-in-law' },
      { value: 'daughter_in_law', label: 'Daughter-in-law' },
      { value: 'other', label: 'Other' },
    ];
  }

  it('starts new household details behind the NID gate', () => {
    const page = createPage();

    expect(page.showNidGate2).toBeTrue();
    expect(page.showHouseholdHeadForm).toBeFalse();
    expect(page.temporarySameAsPermanent).toBeFalse();
  });

  it('submits temporary address as separate until the user opts into same-as-permanent', () => {
    const page = createPage();

    const formData = (page as any).buildHouseholdHeadFormData() as FormData;

    expect(formData.get('permanent_address_source')).toBe('citizenship');
    expect(formData.get('temporary_same_as_permanent')).toBe('0');
  });

  it('manual NID fallback reveals the form and stores a canonical NID', () => {
    const page = createPage();
    page.nidNumber2 = ' १२३-४५६-७८९-० ';
    page.nidMessage2 = 'Lookup failed.';

    page.skipNidGate2();

    expect(page.showNidGate2).toBeFalse();
    expect(page.showHouseholdHeadForm).toBeTrue();
    expect(page.headData.national_id).toBe('1234567890');
    expect(page.nidMessage2).toBe('');
    expect(page.nidLockedHeadFields.size).toBe(0);
    expect(page.verifiedNidGroups.length).toBe(0);
    expect(page.permanentAddressSource).toBe('citizenship');
  });

  it('uses complete NID permanent address as the source immediately after lookup', () => {
    const enrollmentSvc = {
      headNidLookup: jasmine.createSpy().and.returnValue(of({
        success: true,
        message: 'Verified.',
        data: {
          national_id: '1234567890',
          first_name: 'Komal',
          last_name: 'Shrestha',
          province: 'Bagamati',
          district: 'Makawanpur',
          municipality: 'Hetauda Sub-Metropolitan City',
          ward_number: '9',
          tole_village: 'Madanpath',
        },
      })),
    };
    const geoSvc = {
      districts: jasmine.createSpy().and.returnValue(of(response(['Makawanpur']))),
      municipalities: jasmine.createSpy().and.returnValue(of(response(['Hetauda Sub-Metropolitan City']))),
      wards: jasmine.createSpy().and.returnValue(of(response(['9']))),
      servicePoints: jasmine.createSpy().and.returnValue(of(servicePointResponse([]))),
    };
    const page = createPage({ enrollmentSvc, geoSvc });
    page.enrollmentId = 4;
    page.nidNumber2 = '1234567890';

    page.lookupNid2();

    expect(page.nidVerifiedHead).toBeTrue();
    expect(page.permanentAddressSource).toBe('nid');
    expect(page.nidPermanentAddress?.province).toBe('Bagamati');
    expect(page.step1.province).toBe('Bagamati');
    expect(page.step1.district).toBe('Makawanpur');
    expect(page.step1.municipality).toBe('Hetauda Sub-Metropolitan City');
    expect(page.step1.ward_number).toBe('9');
    expect(page.step1.tole_village).toBe('Madanpath');
    expect(page.isHeadFieldReadonly('province')).toBeTrue();
  });

  it('shows only the NID permanent address option in confirmed NID mode', () => {
    const form = createAddressForm();
    form.nidVerifiedHead = true;
    form.canUseNidPermanentAddress = true;
    form.permanentAddressSource = 'nid';

    expect(form.shouldShowNidAddressOption()).toBeTrue();
    expect(form.shouldShowCitizenshipAddressOption()).toBeFalse();
    expect(form.shouldShowMigrationAddressOption()).toBeFalse();
  });

  it('shows citizenship and migration permanent address options in manual mode', () => {
    const form = createAddressForm();
    form.nidVerifiedHead = false;
    form.canUseNidPermanentAddress = false;
    form.permanentAddressSource = 'citizenship';

    expect(form.shouldShowNidAddressOption()).toBeFalse();
    expect(form.shouldShowCitizenshipAddressOption()).toBeTrue();
    expect(form.shouldShowMigrationAddressOption()).toBeTrue();
  });

  it('accepts hyphenated and Nepali-digit NIDs but rejects invalid household lookup values', () => {
    const enrollmentSvc = {
      headNidLookup: jasmine.createSpy(),
    };
    const page = createPage({ enrollmentSvc });
    page.enrollmentId = 4;
    page.nidNumber2 = '12345678901';

    page.lookupNid2();

    expect(enrollmentSvc.headNidLookup).not.toHaveBeenCalled();
    expect(page.nidMessage2).toBe('wizard.nid_invalid_length');

    page.skipNidGate2();

    expect(page.showNidGate2).toBeTrue();
    expect(page.headData.national_id).toBe('');

    page.nidNumber2 = '123-ABC';
    page.lookupNid2();

    expect(enrollmentSvc.headNidLookup).not.toHaveBeenCalled();
    expect(page.nidMessage2).toBe('wizard.nid_invalid_length');

    page.nidNumber2 = '१२३-४५६-७८९-०';
    enrollmentSvc.headNidLookup.and.returnValue(of({
      success: false,
      message: 'Not found.',
    }));

    page.lookupNid2();

    expect(enrollmentSvc.headNidLookup).toHaveBeenCalledWith(4, '123-456-789-0');
  });

  it('builds grouped label-value rows for household fields verified from NID', () => {
    const page = createPage();
    page.nidVerifiedHead = true;
    page.headData = {
      ...page.headData,
      national_id: '1234567890',
      first_name: 'Komal',
      gender: 'female',
      citizenship_number: '311022/65843',
      citizenship_issue_date: '2066-08-04',
    };
    page.step1 = {
      province: 'Bagmati',
      district: 'Kathmandu',
      municipality: 'Kathmandu',
      ward_number: '1',
      tole_village: 'Dillibazar',
      full_address: 'Dillibazar, Ward 1, Kathmandu',
    };
    [
      'national_id',
      'first_name',
      'gender',
      'citizenship_number',
      'citizenship_issue_date',
      'province',
      'district',
    ].forEach(field => page.nidLockedHeadFields.add(field));

    const groups = page.verifiedNidGroups;
    const values = groups.reduce<string[]>(
      (items, group) => items.concat(group.fields.map(field => `${field.label}:${field.value}`)),
      []
    );

    expect(values).toContain('First Name:Komal');
    expect(values).toContain('Gender:Female');
    expect(values).toContain('Citizenship Number:311022/65843');
    expect(values).toContain('Province:Bagmati');
  });

  it('prefills empty household contact details from the registered user', () => {
    const page = createPage({
      authService: {
        getCurrentUser: () => ({ mobile_number: '9800980066', email: 'registered@example.com' }),
      },
    });

    (page as any).applyRegisteredContactDetails();

    expect(page.headData.mobile_number).toBe('9800980066');
    expect(page.headData.email).toBe('registered@example.com');
  });

  it('does not overwrite existing household contact details with registered user details', () => {
    const page = createPage({
      authService: {
        getCurrentUser: () => ({ mobile_number: '9800980066', email: 'registered@example.com' }),
      },
    });
    page.headData.mobile_number = '9811111111';
    page.headData.email = 'household@example.com';

    (page as any).applyRegisteredContactDetails();

    expect(page.headData.mobile_number).toBe('9811111111');
    expect(page.headData.email).toBe('household@example.com');
  });

  it('opens the generated enrollment PDF after successful submit', async () => {
    const router = { navigateByUrl: jasmine.createSpy() };
    const enrollmentSvc = {
      submit: jasmine.createSpy().and.returnValue(of({
        success: true,
        message: 'Submitted.',
        data: { id: 12, pdf_download_url: 'https://example.test/enrollment.pdf' },
        pdf_generated: true,
        pdf_download_url: 'https://example.test/enrollment.pdf',
      })),
    };
    const page = createPage({ router, enrollmentSvc });
    page.enrollmentId = 12;
    page.confirmed = true;
    spyOn(page, 'openEnrollmentPdf').and.returnValue(Promise.resolve());

    await page.submitEnrollment();
    await Promise.resolve();

    expect(enrollmentSvc.submit).toHaveBeenCalledWith(12);
    expect(page.openEnrollmentPdf).toHaveBeenCalledWith('https://example.test/enrollment.pdf');
    expect(router.navigateByUrl).toHaveBeenCalledWith('/tabs/enrollments');
  });

  it('still completes submit when no enrollment PDF URL is returned', async () => {
    const router = { navigateByUrl: jasmine.createSpy() };
    const enrollmentSvc = {
      submit: jasmine.createSpy().and.returnValue(of({
        success: true,
        message: 'Submitted.',
        data: { id: 12 },
        pdf_generated: false,
        pdf_download_url: null,
      })),
    };
    const page = createPage({ router, enrollmentSvc });
    page.enrollmentId = 12;
    page.confirmed = true;
    spyOn(page, 'openEnrollmentPdf').and.returnValue(Promise.resolve());

    await page.submitEnrollment();
    await Promise.resolve();

    expect(page.openEnrollmentPdf).toHaveBeenCalledWith(null);
    expect(router.navigateByUrl).toHaveBeenCalledWith('/tabs/enrollments');
  });

  it('prefills cascading location fields from mapped NID data', () => {
    const geoSvc = {
      districts: jasmine.createSpy().and.returnValue(of(response(['Kathmandu']))),
      municipalities: jasmine.createSpy().and.returnValue(of(response(['Kathmandu Metropolitan City']))),
      wards: jasmine.createSpy().and.returnValue(of(response(['1', '2']))),
      servicePoints: jasmine.createSpy().and.returnValue(of(servicePointResponse([]))),
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

  it('loads mapped household-head NID address as selected source with citizenship district and JPEG photo', () => {
    const enrollmentSvc = {
      headNidLookup: jasmine.createSpy().and.returnValue(of({
        success: true,
        message: 'Verified.',
        data: {
          national_id: '1234567890',
          first_name: 'Komal',
          last_name: 'Shrestha',
          father_name: 'Jit Bahadur Lama',
          father_name_ne: 'जित बहादुर लामा',
          mother_name: 'Sharmila Maya Lama',
          mother_name_ne: 'शर्मिला माया लामा',
          grandfather_name: 'Kalu Bahadur Lama',
          grandfather_name_ne: 'कालु बहादुर लामा',
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
      servicePoints: jasmine.createSpy().and.returnValue(of(servicePointResponse([]))),
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
    page.nidNumber2 = '१२३-४५६-७८९-०';
    page.lookupNid2();

    expect(page.nidPermanentAddress?.province).toBe('Bagamati');
    expect(page.nidPermanentAddress?.district).toBe('Makawanpur');
    expect(page.nidPermanentAddress?.municipality).toBe('Hetauda Sub-Metropolitan City');
    expect(page.nidPermanentAddress?.ward_number).toBe('9');
    expect(page.nidPermanentAddress?.tole_village).toBe('Madanpath');
    expect(page.step1.province).toBe('Bagamati');
    expect(page.permanentAddressSource).toBe('nid');
    expect(page.headData.citizenship_issue_district).toBe('Makawanpur');
    expect(page.headPhotoPreview).toBe('data:image/jpeg;base64,abc123');
    expect(page.headData.father_first_name).toBe('Jit Bahadur');
    expect(page.headData.father_last_name).toBe('Lama');
    expect(page.headData.grandfather_first_name_ne).toBe('कालु बहादुर');
    expect(page.headData.grandfather_last_name_ne).toBe('लामा');
    expect(page.isHeadFieldReadonly('province')).toBeTrue();
    expect(page.isHeadFieldReadonly('citizenship_issue_district')).toBeTrue();
    expect(page.isHeadFieldReadonly('father_first_name')).toBeTrue();
    expect(page.isHeadFieldReadonly('citizenship_issue_date')).toBeTrue();
    expect(page.nidVerifiedHead).toBeTrue();
    const verifiedValues = page.verifiedNidGroups.reduce<string[]>(
      (items, group) => items.concat(group.fields.map(field => field.value)),
      []
    );
    expect(verifiedValues).toContain('311022/65843');
    expect(enrollmentSvc.headNidLookup).toHaveBeenCalledWith(4, '123-456-789-0');
    expect(page.headData.national_id).toBe('1234567890');
  });

  it('requires Basai Sarai evidence for migration source before saving household head', async () => {
    const enrollmentSvc = {
      saveHouseholdHead: jasmine.createSpy().and.returnValue(of({ success: true, data: {} })),
    };
    const page = createPage({ enrollmentSvc });
    fillValidHouseholdHead(page);
    page.permanentAddressSource = 'migration';
    page.headData.photo = new Blob(['photo'], { type: 'image/jpeg' });
    page.headData.citizenship_front_image = new Blob(['front'], { type: 'image/jpeg' });
    page.headData.citizenship_back_image = new Blob(['back'], { type: 'image/jpeg' });
    spyOn<any>(page, 'showToast').and.returnValue(Promise.resolve());

    await page.nextStep();

    expect(enrollmentSvc.saveHouseholdHead).not.toHaveBeenCalled();
    expect(page['showToast']).toHaveBeenCalledWith('wizard.basai_sarai_required', 'warning');
  });

  it('does not require Basai Sarai when only the temporary address differs', async () => {
    const enrollmentSvc = {
      saveHouseholdHead: jasmine.createSpy().and.returnValue(of({
        success: true,
        message: 'Saved.',
        data: { id: 4, current_step: 2, household_head: null, family_members: [] },
      })),
      get: jasmine.createSpy().and.returnValue(of({
        success: true,
        message: 'Loaded.',
        data: { id: 4, current_step: 2, household_head: null, family_members: [] },
      })),
    };
    const page = createPage({ enrollmentSvc });
    fillValidHouseholdHead(page);
    page.permanentAddressSource = 'citizenship';
    page.temporarySameAsPermanent = false;
    page.temporaryAddress = {
      province: 'Koshi',
      district: 'Morang',
      municipality: 'Biratnagar',
      ward_number: '2',
      tole_village: 'Temporary Tole',
      full_address: 'Temporary Tole, Ward 2, Biratnagar',
    };
    page.headData.photo = new Blob(['photo'], { type: 'image/jpeg' });
    page.headData.citizenship_front_image = new Blob(['front'], { type: 'image/jpeg' });
    page.headData.citizenship_back_image = new Blob(['back'], { type: 'image/jpeg' });
    spyOn<any>(page, 'showToast').and.returnValue(Promise.resolve());

    await page.nextStep();

    expect(enrollmentSvc.saveHouseholdHead).toHaveBeenCalled();
    const submitted = enrollmentSvc.saveHouseholdHead.calls.mostRecent().args[1] as FormData;
    expect(submitted.get('permanent_address_source')).toBe('citizenship');
    expect(submitted.get('temporary_same_as_permanent')).toBe('0');
    expect(submitted.has('basai_sarai_front')).toBeFalse();
    expect(page['showToast']).not.toHaveBeenCalledWith('wizard.basai_sarai_required', 'warning');
  });

  it('shows duplicate active NID validation messages from household-head save', () => {
    const enrollmentSvc = {
      saveHouseholdHead: jasmine.createSpy().and.returnValue(throwError(() => ({
        status: 422,
        error: {
          errors: {
            national_id: ['This NID already has active insurance. Use renewal instead of a new enrollment.'],
          },
        },
      }))),
    };
    const page = createPage({ enrollmentSvc });
    page.enrollmentId = 4;
    page.currentStep = 1;
    page.step1 = {
      province: 'Bagmati',
      district: 'Kathmandu',
      municipality: 'Kathmandu',
      ward_number: '1',
      tole_village: '',
      full_address: '',
    };
    page.headData = {
      ...page.headData,
      ...parentGrandparentNames(),
      national_id: '1234567890',
      first_name: 'Komal',
      last_name: 'Shrestha',
      gender: 'female',
      date_of_birth: '1990-06-15',
      mobile_number: '9812345678',
      citizenship_number: '311022/65843',
      citizenship_issue_date: '2066-08-04',
      citizenship_issue_district: 'Kathmandu',
      marital_status: 'married',
    };
    spyOn<any>(page, 'showToast');

    page.nextStep();

    expect(enrollmentSvc.saveHouseholdHead).toHaveBeenCalled();
    expect((page as any).showToast).toHaveBeenCalledWith(
      'This NID already has active insurance. Use renewal instead of a new enrollment.',
      'danger'
    );
    expect(page.saving).toBeFalse();
  });

  it('blocks oversized household-head files before save', () => {
    const enrollmentSvc = {
      saveHouseholdHead: jasmine.createSpy(),
    };
    const page = createPage({ enrollmentSvc });
    fillValidHouseholdHead(page);
    (page as any).config = {
      upload_limits: {
        max_file_bytes: 2 * 1024 * 1024,
        max_post_bytes: 20 * 1024 * 1024,
      },
    };
    page.headData.photo = new Blob([new Uint8Array((2 * 1024 * 1024) + 1)], { type: 'image/jpeg' });
    spyOn<any>(page, 'showToast');

    page.nextStep();

    expect(enrollmentSvc.saveHouseholdHead).not.toHaveBeenCalled();
    expect((page as any).showToast).toHaveBeenCalledWith('wizard.upload_file_too_large', 'warning');
    expect(page.saving).toBeFalse();
  });

  it('blocks household-head saves whose selected files exceed the total upload limit', () => {
    const enrollmentSvc = {
      saveHouseholdHead: jasmine.createSpy(),
    };
    const page = createPage({ enrollmentSvc });
    fillValidHouseholdHead(page);
    (page as any).config = {
      upload_limits: {
        max_file_bytes: 2 * 1024 * 1024,
        max_post_bytes: 5 * 1024 * 1024,
      },
    };
    page.headData.photo = new Blob([new Uint8Array(2 * 1024 * 1024)], { type: 'image/jpeg' });
    page.headData.citizenship_front_image = new Blob([new Uint8Array(2 * 1024 * 1024)], { type: 'image/jpeg' });
    page.headData.citizenship_back_image = new Blob([new Uint8Array(2 * 1024 * 1024)], { type: 'image/jpeg' });
    spyOn<any>(page, 'showToast');

    page.nextStep();

    expect(enrollmentSvc.saveHouseholdHead).not.toHaveBeenCalled();
    expect((page as any).showToast).toHaveBeenCalledWith('wizard.upload_total_too_large', 'warning');
    expect(page.saving).toBeFalse();
  });

  it('shows backend 413 upload messages from household-head save', () => {
    const enrollmentSvc = {
      saveHouseholdHead: jasmine.createSpy().and.returnValue(throwError(() => ({
        status: 413,
        error: {
          success: false,
          message: 'The selected documents are too large. Upload smaller files and try again.',
          max_upload_bytes: 20 * 1024 * 1024,
        },
      }))),
    };
    const page = createPage({ enrollmentSvc });
    fillValidHouseholdHead(page);
    spyOn<any>(page, 'showToast');

    page.nextStep();

    expect(enrollmentSvc.saveHouseholdHead).toHaveBeenCalled();
    expect((page as any).showToast).toHaveBeenCalledWith(
      'The selected documents are too large. Upload smaller files and try again.',
      'danger'
    );
    expect(page.saving).toBeFalse();
  });

  it('saves partial household-head drafts without required fields', async () => {
    const enrollmentSvc = {
      saveHouseholdHead: jasmine.createSpy().and.returnValue(of({
        success: true,
        data: {
          id: 4,
          current_step: 1,
          step_data: {
            household_head_draft: {
              data: { first_name: 'Sunita' },
            },
          },
          household_head: null,
          family_members: [],
        },
      })),
    };
    const page = createPage({ enrollmentSvc });
    page.enrollmentId = 4;
    page.currentStep = 1;
    page.headData.first_name = 'Sunita';
    spyOn<any>(page, 'showToast').and.returnValue(Promise.resolve());

    await page.saveDraft();

    expect(enrollmentSvc.saveHouseholdHead).toHaveBeenCalled();
    const submitted = enrollmentSvc.saveHouseholdHead.calls.mostRecent().args[1] as FormData;
    expect(submitted.get('save_action')).toBe('draft');
    expect(submitted.get('first_name')).toBe('Sunita');
    expect(page['showToast']).toHaveBeenCalledWith('wizard.draft_saved', 'success');
  });

  it('restores partial household-head draft data from enrollment step data', () => {
    const page = createPage();

    (page as any).prefillFromEnrollment({
      id: 4,
      current_step: 1,
      province: '',
      district: '',
      municipality: '',
      ward_number: '',
      temporary_same_as_permanent: false,
      step_data: {
        household_head_draft: {
          data: {
            first_name: 'Sunita',
            last_name: 'Lama',
            province: 'Bagmati',
            district: 'Kathmandu',
            municipality: 'Kathmandu',
            ward_number: '1',
            permanent_address_source: 'migration',
            temporary_same_as_permanent: '0',
            temporary_province: 'Koshi',
            temporary_district: 'Morang',
          },
          files: {
            photo: { url: 'https://example.test/draft-photo.jpg' },
            basai_sarai_front: { url: 'https://example.test/draft-basai.pdf' },
          },
        },
      },
      household_head: null,
      family_members: [],
    } as any);

    expect(page.headData.first_name).toBe('Sunita');
    expect(page.headData.last_name).toBe('Lama');
    expect(page.step1.province).toBe('Bagmati');
    expect(page.step1.district).toBe('Kathmandu');
    expect(page.permanentAddressSource).toBe('migration');
    expect(page.temporarySameAsPermanent).toBeFalse();
    expect(page.temporaryAddress.province).toBe('Koshi');
    expect(page.headPhotoPreview).toBe('https://example.test/draft-photo.jpg');
    expect(page.basaiSaraiFrontPreview).toBe('https://example.test/draft-basai.pdf');
    expect(page.showNidGate2).toBeFalse();
  });

  it('restores verified household-head NID labels from a saved enrollment payload', () => {
    const geoSvc = {
      districts: jasmine.createSpy().and.returnValue(of(response(['Kathmandu']))),
      municipalities: jasmine.createSpy().and.returnValue(of(response(['Kathmandu Metropolitan City']))),
      wards: jasmine.createSpy().and.returnValue(of(response(['1']))),
    };
    const page = createPage({
      geoSvc,
      dateService: {
        formatForDisplay: (_ad?: string, bs?: string) => bs || '',
      },
    });

    (page as any).prefillFromEnrollment({
      id: 4,
      current_step: 1,
      province: 'Bagmati',
      district: 'Kathmandu',
      municipality: 'Kathmandu Metropolitan City',
      ward_number: 1,
      tole_village: 'Dillibazar',
      full_address: 'Dillibazar, Ward 1, Kathmandu',
      temporary_same_as_permanent: true,
      household_head: {
        id: 5,
        enrollment_id: 4,
        national_id: '1234567890',
        nid_verified_at: '2026-05-07T00:00:00Z',
        nid_raw_payload: {
          national_id: '1234567890',
          first_name: 'Komal',
          citizenship_issue_date_bs: '2066-08-04',
          province: 'Bagmati',
        },
        first_name: 'Komal',
        last_name: 'Shrestha',
        gender: 'female',
        date_of_birth: '1990-06-15',
        date_of_birth_bs: '2047-03-01',
        marital_status: 'married',
        mobile_number: '9812345678',
        citizenship_number: '311022/65843',
        citizenship_issue_date: '2009-11-19',
        citizenship_issue_date_bs: '2066-08-04',
        citizenship_issue_district: 'Kathmandu',
        is_target_group: false,
        documents: [],
      },
      family_members: [],
    } as any);

    expect(page.showNidGate2).toBeFalse();
    expect(page.nidVerifiedHead).toBeTrue();
    expect(page.isHeadFieldReadonly('first_name')).toBeTrue();
    expect(page.isHeadFieldReadonly('citizenship_issue_date')).toBeTrue();
    const verifiedValues = page.verifiedNidGroups.reduce<string[]>(
      (items, group) => items.concat(group.fields.map(field => field.value)),
      []
    );
    expect(verifiedValues).toContain('Komal');
  });

  it('loads member NID citizenship district and JPEG photo preview', () => {
    const enrollmentSvc = {
      nidLookup: jasmine.createSpy(),
      memberNidLookup: jasmine.createSpy().and.returnValue(of({
        success: true,
        message: 'Verified.',
        data: {
          first_name: 'Sita',
          last_name: 'Shrestha',
          gender: 'female',
          date_of_birth_bs: '2050-01-01',
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

    page.enrollmentId = 4;
    page.nidNumberMember = '१२३-४५६-७८९-०';
    page.lookupNidMember();

    expect(page.newMember.first_name).toBe('Sita');
    expect(page.newMember.citizenship_issue_district).toBe('Makawanpur');
    expect(page.memberPhotoPreview).toBe('data:image/jpeg;base64,member123');
    expect(page.nidVerifiedMember).toBeTrue();
    expect((page as any).nidLockedMemberFields.has('first_name')).toBeTrue();
    expect((page as any).nidLockedMemberFields.has('date_of_birth')).toBeTrue();
    expect((page as any).nidLockedMemberFields.has('citizenship_number')).toBeTrue();
    expect(enrollmentSvc.memberNidLookup).toHaveBeenCalledWith(4, '123-456-789-0');
    expect(enrollmentSvc.nidLookup).not.toHaveBeenCalled();
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

  it('loads service points after the permanent district changes', () => {
    const geoSvc = {
      municipalities: jasmine.createSpy().and.returnValue(of(response(['Kathmandu Metropolitan City']))),
      servicePoints: jasmine.createSpy().and.returnValue(of(servicePointResponse([
        { id: 7, code: 'H0302000', name: 'Bir Hospital' },
      ]))),
    };
    const page = createPage({ geoSvc });
    page.step1.province = 'Bagamati';
    page.step1.district = 'Kathmandu';
    page.firstServicePointId = '99';

    page.onDistrictChange();

    expect(geoSvc.municipalities).toHaveBeenCalledWith('Bagamati', 'Kathmandu');
    expect(geoSvc.servicePoints).toHaveBeenCalledWith('Bagamati', 'Kathmandu');
    expect(page.servicePointOptions).toEqual([
      { id: 7, code: 'H0302000', name: 'Bir Hospital' },
    ]);
    expect(String(page.firstServicePointId)).toBe('');
  });

  it('submits the selected service point id in the household payload', () => {
    const page = createPage();
    page.step1 = {
      province: 'Bagamati',
      district: 'Kathmandu',
      municipality: 'Kathmandu',
      ward_number: '1',
      tole_village: '',
      full_address: '',
    };
    page.firstServicePointId = 7;

    const formData = (page as any).buildHouseholdHeadFormData() as FormData;

    expect(formData.get('first_service_point_id')).toBe('7');
    expect(formData.has('first_service_point')).toBeFalse();
  });

  it('includes split parent and grandparent names in the household payload', () => {
    const page = createPage();
    page.headData = {
      ...page.headData,
      father_first_name: 'Jit Bahadur',
      father_last_name: 'Lama',
      father_first_name_ne: 'जित बहादुर',
      father_last_name_ne: 'लामा',
      mother_first_name: 'Sharmila Maya',
      mother_last_name: 'Lama',
      mother_first_name_ne: 'शर्मिला माया',
      mother_last_name_ne: 'लामा',
      grandfather_first_name: 'Kalu Bahadur',
      grandfather_last_name: 'Lama',
      grandfather_first_name_ne: 'कालु बहादुर',
      grandfather_last_name_ne: 'लामा',
    };

    const formData = (page as any).buildHouseholdHeadFormData() as FormData;

    expect(formData.get('father_first_name')).toBe('Jit Bahadur');
    expect(formData.get('father_last_name')).toBe('Lama');
    expect(formData.get('father_name')).toBe('Jit Bahadur Lama');
    expect(formData.get('mother_first_name_ne')).toBe('शर्मिला माया');
    expect(formData.get('grandfather_last_name_ne')).toBe('लामा');
    expect(formData.get('grandfather_name_ne')).toBe('कालु बहादुर लामा');
  });

  it('normalizes household-head citizenship numbers before submitting', () => {
    const page = createPage();
    page.headData = {
      ...page.headData,
      citizenship_number: '३११०२२/६५८४३',
    };

    const formData = (page as any).buildHouseholdHeadFormData() as FormData;

    expect(formData.get('citizenship_number')).toBe('31102265843');
  });

  it('allows household save when split parent and grandparent names are missing', () => {
    const enrollmentSvc = {
      saveHouseholdHead: jasmine.createSpy().and.returnValue(of({
        success: true,
        message: 'Saved.',
        data: { id: 4, current_step: 2, household_head: null, family_members: [] },
      })),
      get: jasmine.createSpy().and.returnValue(of({
        success: true,
        message: 'Loaded.',
        data: { id: 4, current_step: 2, household_head: null, family_members: [] },
      })),
    };
    const page = createPage({
      enrollmentSvc,
      dateService: {
        calculateAge: () => 35,
      },
    });
    page.enrollmentId = 4;
    page.currentStep = 1;
    page.step1 = {
      province: 'Bagmati',
      district: 'Kathmandu',
      municipality: 'Kathmandu',
      ward_number: '1',
      tole_village: '',
      full_address: '',
    };
    page.headData = {
      ...page.headData,
      first_name: 'Komal',
      last_name: 'Shrestha',
      gender: 'female',
      date_of_birth: '1990-06-15',
      mobile_number: '9812345678',
      marital_status: 'married',
      citizenship_number: '311022/65843',
      citizenship_issue_date: '2066-08-04',
      citizenship_issue_district: 'Kathmandu',
      father_first_name: '',
      father_last_name: 'Lama',
      father_first_name_ne: 'जित',
      father_last_name_ne: 'लामा',
      mother_first_name: 'Sharmila',
      mother_last_name: 'Lama',
      mother_first_name_ne: 'शर्मिला',
      mother_last_name_ne: 'लामा',
      grandfather_first_name: 'Kalu',
      grandfather_last_name: 'Lama',
      grandfather_first_name_ne: 'कालु',
      grandfather_last_name_ne: 'लामा',
    };
    spyOn<any>(page, 'showToast');

    page.nextStep();

    expect(enrollmentSvc.saveHouseholdHead).toHaveBeenCalledWith(4, jasmine.any(FormData));
    expect((page as any).showToast).not.toHaveBeenCalledWith('wizard.required_parent_names', 'warning');
  });

  it('blocks household save when citizenship issue date is before the sixteenth birthday', () => {
    const enrollmentSvc = {
      saveHouseholdHead: jasmine.createSpy().and.returnValue(of({
        success: true,
        message: 'Saved.',
        data: { id: 4, current_step: 2, household_head: null, family_members: [] },
      })),
    };
    const dateService = {
      calculateAge: () => 35,
      isCitizenshipIssueDateValid: jasmine.createSpy().and.returnValue(false),
    };
    const page = createPage({ enrollmentSvc, dateService });
    page.enrollmentId = 4;
    page.currentStep = 1;
    page.step1 = {
      province: 'Bagmati',
      district: 'Kathmandu',
      municipality: 'Kathmandu',
      ward_number: '1',
      tole_village: '',
      full_address: '',
    };
    page.headData = {
      ...page.headData,
      ...parentGrandparentNames(),
      first_name: 'Komal',
      last_name: 'Shrestha',
      gender: 'female',
      date_of_birth: '2047-09-17',
      mobile_number: '9812345678',
      marital_status: 'married',
      citizenship_number: '311022/65843',
      citizenship_issue_date: '2063-09-16',
      citizenship_issue_district: 'Kathmandu',
    };
    spyOn<any>(page, 'showToast');

    page.nextStep();

    expect(enrollmentSvc.saveHouseholdHead).not.toHaveBeenCalled();
    expect(dateService.isCitizenshipIssueDateValid).toHaveBeenCalledWith('2047-09-17', '2063-09-16', 'bs');
    expect((page as any).showToast).toHaveBeenCalledWith('wizard.citizenship_issue_age', 'warning');
  });

  it('blocks household save when English name fields use Nepali script', () => {
    const enrollmentSvc = {
      saveHouseholdHead: jasmine.createSpy().and.returnValue(of({
        success: true,
        message: 'Saved.',
        data: { id: 4, current_step: 2, household_head: null, family_members: [] },
      })),
    };
    const page = createPage({ enrollmentSvc });
    fillValidHouseholdHead(page);
    page.headData.last_name = 'श्रेष्ठ';
    spyOn<any>(page, 'showToast');

    page.nextStep();

    expect(enrollmentSvc.saveHouseholdHead).not.toHaveBeenCalled();
    expect((page as any).showToast).toHaveBeenCalledWith('wizard.english_name_format', 'warning');
  });

  it('uses specific household citizenship issue date warnings', () => {
    const enrollmentSvc = {
      saveHouseholdHead: jasmine.createSpy().and.returnValue(of({
        success: true,
        message: 'Saved.',
        data: { id: 4, current_step: 2, household_head: null, family_members: [] },
      })),
    };
    const dateService = {
      citizenshipIssueDateError: jasmine.createSpy().and.returnValue('future'),
    };
    const page = createPage({ enrollmentSvc, dateService });
    fillValidHouseholdHead(page);
    spyOn<any>(page, 'showToast');

    page.nextStep();

    expect(enrollmentSvc.saveHouseholdHead).not.toHaveBeenCalled();
    expect(dateService.citizenshipIssueDateError).toHaveBeenCalledWith('1990-06-15', '2066-08-04', 'bs');
    expect((page as any).showToast).toHaveBeenCalledWith('wizard.citizenship_issue_future', 'warning');
  });

  it('exposes household citizenship issue-date warning while editing', () => {
    const dateService = {
      citizenshipIssueDateError: jasmine.createSpy().and.returnValue('before_birth'),
    };
    const page = createPage({ dateService });
    fillValidHouseholdHead(page);
    page.headData.date_of_birth = '2050-01-01';
    page.headData.citizenship_issue_date = '2049-12-30';

    expect(page.headCitizenshipIssueDateWarning).toBe('wizard.citizenship_issue_before_birth');
    expect(dateService.citizenshipIssueDateError).toHaveBeenCalledWith('2050-01-01', '2049-12-30', 'bs');
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

  it('submits birth-certificate identity and excludes stale citizenship fields for under-16 household heads', () => {
    const page = createPage({
      dateService: {
        calculateAge: () => 10,
      },
    });
    page.step1 = {
      province: 'Bagmati',
      district: 'Kathmandu',
      municipality: 'Kathmandu',
      ward_number: '1',
      tole_village: '',
      full_address: '',
    };
    page.headData = {
      ...page.headData,
      ...parentGrandparentNames(),
      first_name: 'Nabin',
      last_name: 'Shrestha',
      gender: 'male',
      date_of_birth: '2072-01-01',
      mobile_number: '9812345678',
      marital_status: 'single',
      citizenship_number: 'STALE-CITIZENSHIP',
      citizenship_issue_date: '2079-01-01',
      citizenship_issue_district: 'Kathmandu',
      citizenship_front_image: new Blob(['front'], { type: 'image/jpeg' }),
      citizenship_back_image: new Blob(['back'], { type: 'image/jpeg' }),
      birth_certificate_number: 'BC-123',
      birth_certificate_issue_date: '2072-02-01',
      birth_certificate_front_image: new Blob(['birth'], { type: 'image/jpeg' }),
    };

    const formData = (page as any).buildHouseholdHeadFormData() as FormData;

    expect(formData.get('document_type')).toBe('birth_certificate');
    expect(formData.get('birth_certificate_number')).toBe('BC-123');
    expect(formData.get('birth_certificate_issue_date')).toBe('2072-02-01');
    expect(formData.has('birth_certificate_front_image')).toBeTrue();
    expect(formData.has('citizenship_number')).toBeFalse();
    expect(formData.has('citizenship_issue_date')).toBeFalse();
    expect(formData.has('citizenship_issue_district')).toBeFalse();
    expect(formData.has('citizenship_front_image')).toBeFalse();
    expect(formData.has('citizenship_back_image')).toBeFalse();
  });

  it('allows under-16 household heads to continue with birth-certificate details instead of citizenship details', () => {
    const enrollmentSvc = {
      saveHouseholdHead: jasmine.createSpy().and.returnValue(of({
        success: true,
        message: 'Saved.',
        data: { id: 4, current_step: 2, household_head: null, family_members: [] },
      })),
      get: jasmine.createSpy().and.returnValue(of({
        success: true,
        message: 'Loaded.',
        data: { id: 4, current_step: 2, household_head: null, family_members: [] },
      })),
    };
    const page = createPage({
      enrollmentSvc,
      dateService: {
        calculateAge: () => 10,
        formatForDisplay: (_ad?: string, bs?: string) => bs || '',
      },
    });
    page.enrollmentId = 4;
    page.currentStep = 1;
    page.step1 = {
      province: 'Bagmati',
      district: 'Kathmandu',
      municipality: 'Kathmandu',
      ward_number: '1',
      tole_village: '',
      full_address: '',
    };
    page.headData = {
      ...page.headData,
      ...parentGrandparentNames(),
      first_name: 'Nabin',
      last_name: 'Shrestha',
      gender: 'male',
      date_of_birth: '2072-01-01',
      mobile_number: '9812345678',
      marital_status: 'single',
      citizenship_number: '',
      birth_certificate_number: 'BC-123',
      birth_certificate_issue_date: '2072-02-01',
      birth_certificate_front_image: new Blob(['birth'], { type: 'image/jpeg' }),
    };
    spyOn<any>(page, 'showToast');

    page.nextStep();

    expect(enrollmentSvc.saveHouseholdHead).toHaveBeenCalled();
    const submitted = enrollmentSvc.saveHouseholdHead.calls.mostRecent().args[1] as FormData;
    expect(submitted.get('document_type')).toBe('birth_certificate');
    expect(submitted.has('citizenship_number')).toBeFalse();
    expect((page as any).showToast).not.toHaveBeenCalledWith('wizard.head_age', 'warning');
  });

  it('hides all configured invalid relationship options when household head is single', () => {
    const page = createPage();
    page.relationshipOptions = relationshipOptions();
    page.headData.marital_status = 'single';

    const values = page.availableMemberRelationshipOptions.map(option => option.value);

    expect(values).not.toContain('spouse');
    expect(values).not.toContain('son');
    expect(values).not.toContain('daughter');
    expect(values).not.toContain('grandson');
    expect(values).not.toContain('granddaughter');
    expect(values).not.toContain('father_in_law');
    expect(values).not.toContain('mother_in_law');
    expect(values).not.toContain('brother_in_law');
    expect(values).not.toContain('sister_in_law');
    expect(values).not.toContain('son_in_law');
    expect(values).not.toContain('daughter_in_law');
    expect(values).toContain('father');
    expect(values).toContain('other');
  });

  it('hides spouse-side in-laws but allows child-side in-laws for separated heads', () => {
    const page = createPage();
    page.relationshipOptions = relationshipOptions();
    page.headData.marital_status = 'separated';

    const values = page.availableMemberRelationshipOptions.map(option => option.value);

    expect(values).not.toContain('spouse');
    expect(values).not.toContain('father_in_law');
    expect(values).not.toContain('mother_in_law');
    expect(values).not.toContain('brother_in_law');
    expect(values).not.toContain('sister_in_law');
    expect(values).toContain('son_in_law');
    expect(values).toContain('daughter_in_law');
    expect(values).toContain('father');
  });

  it('hides grandchild options until a married son exists', () => {
    const page = createPage();
    page.relationshipOptions = relationshipOptions();
    page.headData.marital_status = 'married';

    let values = page.availableMemberRelationshipOptions.map(option => option.value);
    expect(values).not.toContain('grandson');
    expect(values).not.toContain('granddaughter');

    page.members = [{
      id: 21,
      enrollment_id: 4,
      first_name: 'Ram',
      last_name: 'Lama',
      gender: 'male',
      date_of_birth: '2050-01-01',
      relationship: 'son',
      marital_status: 'married',
      is_target_group: false,
    }];

    values = page.availableMemberRelationshipOptions.map(option => option.value);
    expect(values).toContain('grandson');
    expect(values).toContain('granddaughter');
  });

  it('auto-fills spouse gender and marital status from the household head', async () => {
    const enrollmentSvc = {
      addMember: jasmine.createSpy().and.returnValue(of({ success: true, message: 'Saved.', data: { id: 10 } })),
    };
    const page = createPage({ enrollmentSvc });
    spyOn<any>(page, 'showToast').and.returnValue(Promise.resolve());
    page.enrollmentId = 4;
    page.relationshipOptions = relationshipOptions();
    page.headData.gender = 'male';
    page.headData.marital_status = 'married';
    page.newMember = {
      first_name: 'Sita',
      last_name: 'Shrestha',
      gender: '',
      date_of_birth: '2050-01-01',
      relationship: 'spouse',
      marital_status: 'single',
      document_type: 'birth_certificate',
    };

    await page.saveMember();

    expect(enrollmentSvc.addMember).toHaveBeenCalled();
    const submitted = enrollmentSvc.addMember.calls.mostRecent().args[1] as FormData;
    expect(submitted.get('gender')).toBe('female');
    expect(submitted.get('marital_status')).toBe('married');
  });

  it('blocks spouse younger than twenty before saving', async () => {
    const enrollmentSvc = {
      addMember: jasmine.createSpy().and.returnValue(of({ success: true, message: 'Saved.', data: { id: 10 } })),
    };
    const page = createPage({ enrollmentSvc, dateService: { calculateAge: () => 19 } });
    spyOn<any>(page, 'showToast').and.returnValue(Promise.resolve());
    page.enrollmentId = 4;
    page.relationshipOptions = relationshipOptions();
    page.headData.gender = 'male';
    page.headData.marital_status = 'married';
    page.newMember = {
      first_name: 'Sita',
      last_name: 'Shrestha',
      gender: 'female',
      date_of_birth: '2070-01-01',
      relationship: 'spouse',
      marital_status: 'married',
      document_type: 'birth_certificate',
    };

    await page.saveMember();

    expect(enrollmentSvc.addMember).not.toHaveBeenCalled();
    expect(page['showToast']).toHaveBeenCalledWith('wizard.spouse_age_min', 'warning');
  });

  it('blocks married or divorced enrollment members under twenty', async () => {
    const enrollmentSvc = {
      addMember: jasmine.createSpy().and.returnValue(of({ success: true, message: 'Saved.', data: { id: 10 } })),
    };
    const page = createPage({ enrollmentSvc, dateService: { calculateAge: () => 19 } });
    spyOn<any>(page, 'showToast').and.returnValue(Promise.resolve());
    page.enrollmentId = 4;
    page.relationshipOptions = relationshipOptions();
    page.headData.marital_status = 'married';
    page.newMember = {
      first_name: 'Suman',
      last_name: 'Lama',
      gender: 'male',
      date_of_birth: '2070-01-01',
      relationship: 'son',
      marital_status: 'divorced',
      document_type: 'birth_certificate',
    };

    await page.saveMember();

    expect(enrollmentSvc.addMember).not.toHaveBeenCalled();
    expect(page['showToast']).toHaveBeenCalledWith('wizard.member_marital_status_age', 'warning');
  });

  it('blocks grandchild save without a married son', async () => {
    const enrollmentSvc = {
      addMember: jasmine.createSpy().and.returnValue(of({ success: true, message: 'Saved.', data: { id: 10 } })),
    };
    const page = createPage({ enrollmentSvc });
    spyOn<any>(page, 'showToast').and.returnValue(Promise.resolve());
    page.enrollmentId = 4;
    page.relationshipOptions = relationshipOptions();
    page.headData.marital_status = 'married';
    page.newMember = {
      first_name: 'Asha',
      last_name: 'Lama',
      gender: 'female',
      date_of_birth: '2075-01-01',
      relationship: 'granddaughter',
      marital_status: 'single',
      document_type: 'birth_certificate',
    };

    await page.saveMember();

    expect(enrollmentSvc.addMember).not.toHaveBeenCalled();
    expect(page['showToast']).toHaveBeenCalledWith('wizard.grandchild_requires_married_son', 'warning');
  });

  it('blocks changing the only married son when a grandchild exists', async () => {
    const enrollmentSvc = {
      updateMember: jasmine.createSpy().and.returnValue(of({ success: true, message: 'Saved.', data: { id: 21 } })),
    };
    const page = createPage({ enrollmentSvc });
    spyOn<any>(page, 'showToast').and.returnValue(Promise.resolve());
    page.enrollmentId = 4;
    page.relationshipOptions = relationshipOptions();
    page.headData.marital_status = 'married';
    page.members = [
      {
        id: 21,
        enrollment_id: 4,
        first_name: 'Ram',
        last_name: 'Lama',
        gender: 'male',
        date_of_birth: '2050-01-01',
        relationship: 'son',
        marital_status: 'married',
        is_target_group: false,
      },
      {
        id: 22,
        enrollment_id: 4,
        first_name: 'Asha',
        last_name: 'Lama',
        gender: 'female',
        date_of_birth: '2075-01-01',
        relationship: 'granddaughter',
        marital_status: 'single',
        is_target_group: false,
      },
    ];
    page.editingMemberId = 21;
    page.newMember = {
      first_name: 'Ram',
      last_name: 'Lama',
      gender: 'male',
      date_of_birth: '2050-01-01',
      relationship: 'son',
      marital_status: 'single',
      document_type: 'birth_certificate',
    };

    await page.saveMember();

    expect(enrollmentSvc.updateMember).not.toHaveBeenCalled();
    expect(page['showToast']).toHaveBeenCalledWith('wizard.married_son_required_for_grandchild', 'warning');
  });

  it('rejects stale relationship selections blocked by household head marital status', async () => {
    const enrollmentSvc = {
      addMember: jasmine.createSpy().and.returnValue(of({ success: true, message: 'Saved.', data: { id: 10 } })),
    };
    const page = createPage({ enrollmentSvc });
    spyOn<any>(page, 'showToast').and.returnValue(Promise.resolve());
    page.enrollmentId = 4;
    page.relationshipOptions = relationshipOptions();
    page.headData.marital_status = 'separated';
    page.newMember = {
      first_name: 'Suman',
      last_name: 'Lama',
      gender: 'male',
      date_of_birth: '2075-01-01',
      relationship: 'brother_in_law',
      document_type: 'birth_certificate',
    };

    await page.saveMember();

    expect(enrollmentSvc.addMember).not.toHaveBeenCalled();
    expect(page['showToast']).toHaveBeenCalledWith('wizard.relationship_marital_status_block', 'warning');
  });

  it('blocks non-Devanagari household-head Nepali names before saving step one', async () => {
    const enrollmentSvc = {
      saveHouseholdHead: jasmine.createSpy().and.returnValue(of({ success: true, data: {} })),
    };
    const page = createPage({ enrollmentSvc });
    spyOn<any>(page, 'showToast').and.returnValue(Promise.resolve());
    page.currentStep = 1;
    page.enrollmentId = 4;
    page.step1 = {
      province: 'Bagmati',
      district: 'Kathmandu',
      municipality: 'Kathmandu',
      ward_number: '1',
      tole_village: 'Dillibazar',
      full_address: 'Dillibazar, Ward 1, Kathmandu',
    } as any;
    page.headData = {
      ...page.headData,
      first_name: 'Sita',
      last_name: 'Lama',
      first_name_ne: 'Sita',
      last_name_ne: 'लामा',
      gender: 'female',
      date_of_birth: '2047-03-01',
      mobile_number: '9812345678',
      marital_status: 'married',
      document_type: 'birth_certificate',
      birth_certificate_number: 'BC-1',
      birth_certificate_issue_date: '2070-01-01',
      birth_certificate_front_image: new Blob(['fake'], { type: 'image/png' }),
    };

    await page.nextStep();

    expect(enrollmentSvc.saveHouseholdHead).not.toHaveBeenCalled();
    expect(page['showToast']).toHaveBeenCalledWith('wizard.nepali_name_format', 'warning');
  });

  it('blocks non-Devanagari enrollment member Nepali names before saving', async () => {
    const enrollmentSvc = {
      addMember: jasmine.createSpy().and.returnValue(of({ success: true, message: 'Saved.', data: { id: 10 } })),
    };
    const page = createPage({ enrollmentSvc });
    spyOn<any>(page, 'showToast').and.returnValue(Promise.resolve());
    page.enrollmentId = 4;
    page.relationshipOptions = relationshipOptions();
    page.newMember = {
      first_name: 'Suman',
      last_name: 'Lama',
      first_name_ne: 'Suman',
      last_name_ne: 'लामा',
      gender: 'male',
      date_of_birth: '2075-01-01',
      relationship: 'son',
      document_type: 'birth_certificate',
    };

    await page.saveMember();

    expect(enrollmentSvc.addMember).not.toHaveBeenCalled();
    expect(page['showToast']).toHaveBeenCalledWith('wizard.nepali_name_format', 'warning');
  });

  it('blocks enrollment member save when English name fields use Nepali script', async () => {
    const enrollmentSvc = {
      addMember: jasmine.createSpy().and.returnValue(of({ success: true, message: 'Saved.', data: { id: 10 } })),
    };
    const page = createPage({ enrollmentSvc });
    spyOn<any>(page, 'showToast').and.returnValue(Promise.resolve());
    page.enrollmentId = 4;
    page.relationshipOptions = relationshipOptions();
    page.headData.marital_status = 'married';
    page.newMember = {
      first_name: 'Suman',
      last_name: 'लामा',
      gender: 'male',
      date_of_birth: '2075-01-01',
      relationship: 'son',
      document_type: 'birth_certificate',
    };

    await page.saveMember();

    expect(enrollmentSvc.addMember).not.toHaveBeenCalled();
    expect(page['showToast']).toHaveBeenCalledWith('wizard.english_name_format', 'warning');
  });

  it('blocks enrollment member save when citizenship issue date is before the sixteenth birthday', async () => {
    const enrollmentSvc = {
      addMember: jasmine.createSpy().and.returnValue(of({ success: true, message: 'Saved.', data: { id: 10 } })),
    };
    const dateService = {
      getCurrentBs: () => '2083-01-01',
      calculateAge: () => 30,
      isCitizenshipIssueDateValid: jasmine.createSpy().and.returnValue(false),
    };
    const page = createPage({ enrollmentSvc, dateService });
    spyOn<any>(page, 'showToast').and.returnValue(Promise.resolve());
    page.enrollmentId = 4;
    page.relationshipOptions = relationshipOptions();
    page.headData.marital_status = 'married';
    page.newMember = {
      first_name: 'Sita',
      last_name: 'Shrestha',
      gender: 'female',
      date_of_birth: '2050-01-01',
      relationship: 'spouse',
      marital_status: 'married',
      document_type: 'citizenship',
      citizenship_number: 'CIT-001',
      citizenship_issue_date: '2065-12-30',
      citizenship_issue_district: 'Kathmandu',
    };

    await page.saveMember();

    expect(enrollmentSvc.addMember).not.toHaveBeenCalled();
    expect(dateService.isCitizenshipIssueDateValid).toHaveBeenCalledWith('2050-01-01', '2065-12-30', 'bs');
    expect(page['showToast']).toHaveBeenCalledWith('wizard.citizenship_issue_age', 'warning');
  });

  it('uses specific enrollment member citizenship issue date warnings', async () => {
    const enrollmentSvc = {
      addMember: jasmine.createSpy().and.returnValue(of({ success: true, message: 'Saved.', data: { id: 10 } })),
    };
    const dateService = {
      getCurrentBs: () => '2083-01-01',
      calculateAge: () => 30,
      citizenshipIssueDateError: jasmine.createSpy().and.returnValue('before_birth'),
    };
    const page = createPage({ enrollmentSvc, dateService });
    spyOn<any>(page, 'showToast').and.returnValue(Promise.resolve());
    page.enrollmentId = 4;
    page.relationshipOptions = relationshipOptions();
    page.headData.marital_status = 'married';
    page.newMember = {
      first_name: 'Sita',
      last_name: 'Shrestha',
      gender: 'female',
      date_of_birth: '2050-01-01',
      relationship: 'spouse',
      marital_status: 'married',
      document_type: 'citizenship',
      citizenship_number: 'CIT-001',
      citizenship_issue_date: '2049-12-30',
      citizenship_issue_district: 'Kathmandu',
    };

    await page.saveMember();

    expect(enrollmentSvc.addMember).not.toHaveBeenCalled();
    expect(dateService.citizenshipIssueDateError).toHaveBeenCalledWith('2050-01-01', '2049-12-30', 'bs');
    expect(page['showToast']).toHaveBeenCalledWith('wizard.citizenship_issue_before_birth', 'warning');
  });

  it('exposes member citizenship issue-date warning only after issue date is filled', () => {
    const dateService = {
      citizenshipIssueDateError: jasmine.createSpy().and.returnValue('too_soon'),
    };
    const page = createPage({ dateService });
    page.newMember = {
      date_of_birth: '2050-01-01',
      document_type: 'citizenship',
      citizenship_issue_date: '',
    };

    expect(page.memberCitizenshipIssueDateWarning).toBe('');
    expect(dateService.citizenshipIssueDateError).not.toHaveBeenCalled();

    page.newMember.citizenship_issue_date = '2065-12-30';

    expect(page.memberCitizenshipIssueDateWarning).toBe('wizard.citizenship_issue_age');
    expect(dateService.citizenshipIssueDateError).toHaveBeenCalledWith('2050-01-01', '2065-12-30', 'bs');
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
      first_service_point_id: 7,
      first_service_point: 'Bir Hospital',
      occupation: 'Agriculture',
      document_type: 'citizenship',
      citizenship_number: '३११०२२/६५८४३',
    };

    await page.saveMember();

    expect(enrollmentSvc.addMember).toHaveBeenCalled();
    const submitted = enrollmentSvc.addMember.calls.mostRecent().args[1] as FormData;
    expect(submitted.has('first_name')).toBeTrue();
    expect(submitted.has('last_name')).toBeTrue();
    expect(submitted.get('first_service_point_id')).toBe('7');
    expect(submitted.get('occupation')).toBe('Agriculture');
    expect(submitted.get('citizenship_number')).toBe('31102265843');
    expect(submitted.has('first_service_point')).toBeFalse();
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
      first_service_point_id: 7,
      first_service_point: 'Bir Hospital',
      occupation: 'Salaried',
    };

    await page.saveMember();

    expect(enrollmentSvc.updateMember).toHaveBeenCalledWith(4, 9, jasmine.any(FormData));
    const submitted = enrollmentSvc.updateMember.calls.mostRecent().args[2] as FormData;
    expect(submitted.get('first_service_point_id')).toBe('7');
    expect(submitted.get('occupation')).toBe('Salaried');
    expect(submitted.has('first_service_point')).toBeFalse();
    expect(submitted.has('middle_name')).toBeFalse();
    expect(submitted.has('middle_name_ne')).toBeFalse();
  });

  it('preselects a saved member first service point when editing', () => {
    const page = createPage({
      dateService: {
        getCurrentBs: () => '2083-01-01',
        formatForDisplay: (ad?: string) => ad || '',
      },
    });

    page.editMember({
      id: 9,
      enrollment_id: 4,
      first_name: 'Sita',
      last_name: 'Shrestha',
      gender: 'female',
      date_of_birth: '2050-01-01',
      relationship: 'spouse',
      is_target_group: false,
      first_service_point_id: 7,
      first_service_point: 'Bir Hospital',
    } as any);

    expect(page.newMember.first_service_point_id).toBe(7);
  });

  it('submits a blank first service point so edits can clear a saved member value', async () => {
    const enrollmentSvc = {
      updateMember: jasmine.createSpy().and.returnValue(of({
        success: true,
        data: { id: 9, first_name: 'Sita', last_name: 'Shrestha' },
      })),
    };
    const page = createPage({ enrollmentSvc });
    page.enrollmentId = 4;
    page.editingMemberId = 9;
    page.newMember = {
      first_name: 'Sita',
      last_name: 'Shrestha',
      gender: 'female',
      date_of_birth: '2050-01-01',
      relationship: 'spouse',
      first_service_point_id: '',
      first_service_point: 'Bir Hospital',
    };

    await page.saveMember();

    const submitted = enrollmentSvc.updateMember.calls.mostRecent().args[2] as FormData;
    expect(submitted.get('first_service_point_id')).toBe('');
    expect(submitted.has('first_service_point')).toBeFalse();
  });

  it('shows backend validation messages when member save fails', async () => {
    const enrollmentSvc = {
      addMember: jasmine.createSpy().and.returnValue(throwError(() => ({
        error: {
          message: 'Relationship grandfather requires member age to be higher than father age.',
          errors: {
            date_of_birth: ['Relationship grandfather requires member age to be higher than father age.'],
          },
        },
      }))),
    };
    const page = createPage({
      enrollmentSvc,
      dateService: {
        getCurrentBs: () => '2083-01-01',
        calculateAge: () => 30,
      },
    });
    spyOn<any>(page, 'showToast').and.returnValue(Promise.resolve());
    page.enrollmentId = 4;
    page.newMember = {
      first_name: 'Kalu',
      last_name: 'Shrestha',
      gender: 'male',
      date_of_birth: '2027-01-01',
      relationship: 'grandfather',
    };

    await page.saveMember();

    expect(page['showToast']).toHaveBeenCalledWith(
      'Relationship grandfather requires member age to be higher than father age.',
      'danger'
    );
    expect(page.savingMember).toBeFalse();
  });

  it('keeps the add-member form hidden until the add action is selected', () => {
    const page = createPage({
      dateService: {
        getCurrentBs: () => '2083-01-01',
      },
    });
    page.showMemberForm = false;

    page.showAddMember();

    expect(page.showMemberForm).toBeTrue();
    expect(page.newMember.date_of_birth).toBe('2083-01-01');
  });

  it('removes unapproved enrollment members without selecting a death/removal document', async () => {
    const enrollmentSvc = {
      removeMember: jasmine.createSpy().and.returnValue(of({ success: true, message: 'Removed.' })),
    };
    const presentedAlert = { present: jasmine.createSpy().and.returnValue(Promise.resolve()) };
    const alertCtrl = {
      create: jasmine.createSpy().and.callFake(async (options: any) => {
        options.buttons[1].handler();
        return presentedAlert;
      }),
    };
    const page = createPage({ enrollmentSvc, alertCtrl });
    page.enrollmentId = 4;
    page.enrollment = { status: 'draft' } as any;
    page.members = [{ id: 9, first_name: 'Sita', last_name: 'Shrestha', member_status: 'pending_verification' } as any];
    (page as any).selectRemovalDocument = jasmine.createSpy().and.returnValue(Promise.resolve(null));

    await page.removeMember(page.members[0]);
    await Promise.resolve();

    expect((page as any).selectRemovalDocument).not.toHaveBeenCalled();
    expect(enrollmentSvc.removeMember).toHaveBeenCalledWith(4, 9, undefined);
    expect(page.members).toEqual([]);
    expect(presentedAlert.present).toHaveBeenCalled();
  });

  it('requires and submits a death/removal document when removing an approved enrollment member', async () => {
    const deathDocument = new File(['proof'], 'death-proof.pdf', { type: 'application/pdf' });
    const enrollmentSvc = {
      removeMember: jasmine.createSpy().and.returnValue(of({ success: true, message: 'Removed.' })),
    };
    const presentedAlert = { present: jasmine.createSpy().and.returnValue(Promise.resolve()) };
    const alertCtrl = {
      create: jasmine.createSpy().and.callFake(async (options: any) => {
        options.buttons[1].handler();
        return presentedAlert;
      }),
    };
    const page = createPage({ enrollmentSvc, alertCtrl });
    page.enrollmentId = 4;
    page.enrollment = { status: 'active' } as any;
    page.members = [{ id: 9, first_name: 'Sita', last_name: 'Shrestha', member_status: 'approved' } as any];
    (page as any).selectRemovalDocument = jasmine.createSpy().and.returnValue(Promise.resolve(deathDocument));

    await page.removeMember(page.members[0]);
    await Promise.resolve();

    expect(enrollmentSvc.removeMember).toHaveBeenCalledWith(4, 9, deathDocument);
    expect(page.members).toEqual([]);
    expect(presentedAlert.present).toHaveBeenCalled();
  });

  it('requires and submits a death/removal document for active enrollment members with stale status', async () => {
    const deathDocument = new File(['proof'], 'death-proof.pdf', { type: 'application/pdf' });
    const enrollmentSvc = {
      removeMember: jasmine.createSpy().and.returnValue(of({ success: true, message: 'Removed.' })),
    };
    const presentedAlert = { present: jasmine.createSpy().and.returnValue(Promise.resolve()) };
    const alertCtrl = {
      create: jasmine.createSpy().and.callFake(async (options: any) => {
        options.buttons[1].handler();
        return presentedAlert;
      }),
    };
    const page = createPage({ enrollmentSvc, alertCtrl });
    page.enrollmentId = 4;
    page.enrollment = { status: 'active' } as any;
    page.members = [{ id: 9, first_name: 'Sita', last_name: 'Shrestha', member_status: 'pending_verification' } as any];
    (page as any).selectRemovalDocument = jasmine.createSpy().and.returnValue(Promise.resolve(deathDocument));

    await page.removeMember(page.members[0]);
    await Promise.resolve();

    expect((page as any).selectRemovalDocument).toHaveBeenCalled();
    expect(enrollmentSvc.removeMember).toHaveBeenCalledWith(4, 9, deathDocument);
    expect(page.members).toEqual([]);
    expect(presentedAlert.present).toHaveBeenCalled();
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
      servicePoints: jasmine.createSpy().and.returnValue(of(servicePointResponse([]))),
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
