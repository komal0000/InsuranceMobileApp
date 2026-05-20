import { EMPTY, Subject, of } from 'rxjs';
import { RenewalsPage } from './renewals.page';

describe('RenewalsPage', () => {
  function makePage(role: string, overrides: { dateService?: Record<string, unknown> } = {}) {
    const api = jasmine.createSpyObj('ApiService', ['get', 'post', 'postFormData']);
    api.get.and.returnValue(of({ success: true, data: { data: [], last_page: 1 } }));
    const router = jasmine.createSpyObj('Router', ['navigateByUrl']);
    const toast = { present: jasmine.createSpy().and.returnValue(Promise.resolve()) };
    const toastCtrl = {
      create: jasmine.createSpy().and.returnValue(Promise.resolve(toast)),
    };
    const languageService = {
      t: (key: string) => key,
      label: (_namespace: string, value: string) => value,
      formatNumber: (value: unknown) => String(value ?? 0),
      translateText: (value?: string) => value || '',
    };
    const dateService = {
      getCurrentBs: () => '2083-01-01',
      calculateAge: () => 30,
      isCitizenshipIssueDateValid: () => true,
      prepareFormDataForApi: (fd: FormData) => fd,
      ...overrides.dateService,
    };

    const page = new RenewalsPage(
      api,
      { events$: EMPTY } as any,
      { getCurrentUser: () => ({ role }) } as any,
      dateService as any,
      router,
      toastCtrl as any,
      languageService as any
    );

    return { page, router, api, toastCtrl };
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

  it('hides renewal initiation for admin management roles', () => {
    const { page, router } = makePage('admin');

    page.ngOnInit();
    page.goToSearch();

    expect(page.canInitiateRenewal).toBeFalse();
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it('allows enrollment assistants to open renewal search', () => {
    const { page, router } = makePage('enrollment_assistant');

    page.ngOnInit();
    page.goToSearch();

    expect(page.canInitiateRenewal).toBeTrue();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/renewal-search');
  });

  it('loads service point options when opening the direct add-member form', () => {
    const { page, api } = makePage('beneficiary');
    api.get.and.callFake((path: string) => {
      if (path === '/geo/service-points/Bagamati/Kathmandu') {
        return of({
          success: true,
          data: [{ id: 7, code: 'H0302000', name: 'Bir Hospital' }],
        });
      }

      return of({ success: true, data: { data: [], last_page: 1 } });
    });
    page.canInitiateRenewal = true;
    page.enrollment = {
      id: 7,
      status: 'active',
      province: 'Bagamati',
      district: 'Kathmandu',
      household_head: { marital_status: 'married' },
    } as any;

    page.showAddMemberForm();

    expect(api.get).toHaveBeenCalledWith('/geo/service-points/Bagamati/Kathmandu');
    expect((page as any).servicePointOptions).toEqual([
      { id: 7, code: 'H0302000', name: 'Bir Hospital' },
    ]);
  });

  it('initiates beneficiary renewal only after consent is accepted', async () => {
    const { page, api, toastCtrl, router } = makePage('beneficiary');
    api.post.and.returnValue(of({ success: true, data: { id: 42 } }));
    page.canInitiateRenewal = true;
    page.enrollment = { id: 7, status: 'active' };

    page.initiateRenewal();

    expect(api.post).not.toHaveBeenCalled();
    expect(toastCtrl.create).toHaveBeenCalledWith(jasmine.objectContaining({
      message: 'consent.required',
      color: 'warning',
    }));

    page.consentAccepted = true;
    page.initiateRenewal();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(api.post).toHaveBeenCalledWith('/renewals/initiate', {
      enrollment_id: 7,
      consent_accepted: true,
    });
    expect(router.navigateByUrl).toHaveBeenCalledWith('/renewal-detail/42');
  });

  it('shows full loading during the first renewal list load', () => {
    const { page, api } = makePage('admin');
    const pending = new Subject<any>();
    api.get.and.returnValue(pending.asObservable());

    page.ngOnInit();

    expect(page.loading).toBeTrue();
  });

  it('refreshes renewal list silently on tab re-entry when cached renewals exist', () => {
    const { page, api } = makePage('admin');
    const pending = new Subject<any>();
    api.get.and.returnValue(pending.asObservable());
    page.renewals = [{ id: 12, status: 'draft' } as any];

    page.ionViewWillEnter();
    page.ionViewWillEnter();

    expect(page.loading).toBeFalse();
    expect(page.renewals).toEqual([{ id: 12, status: 'draft' } as any]);
  });

  it('refreshes beneficiary enrollment silently on tab re-entry when cached enrollment exists', () => {
    const { page, api } = makePage('beneficiary');
    const pending = new Subject<any>();
    api.get.and.returnValue(pending.asObservable());
    page.isBeneficiary = true;
    page.enrollment = { id: 7, status: 'active', household_head: {} };
    page.renewals = [{ id: 15, status: 'completed' } as any];

    page.ionViewWillEnter();
    page.ionViewWillEnter();

    expect(page.enrollmentLoading).toBeFalse();
    expect(page.loading).toBeFalse();
    expect(page.enrollment).toEqual({ id: 7, status: 'active', household_head: {} });
    expect(page.renewals).toEqual([{ id: 15, status: 'completed' } as any]);
  });

  it('applies relationship gender map to the inline new member form', () => {
    const { page } = makePage('beneficiary');
    page.relationshipGenderMap = { son: 'male', daughter: 'female' };
    page.newMember.gender = '';

    page.onNewMemberRelationshipChange('son');

    expect(page.newMember.relationship).toBe('son');
    expect(page.newMember.gender).toBe('male');
    expect(page.isNewMemberGenderLocked).toBeTrue();

    page.onNewMemberRelationshipChange('spouse');

    expect(page.newMember.relationship).toBe('spouse');
    expect(page.newMember.gender).toBe('male');
    expect(page.isNewMemberGenderLocked).toBeFalse();
  });

  it('auto-fills spouse gender and marital status when the head gender is binary', () => {
    const { page } = makePage('beneficiary');
    page.enrollment = { household_head: { marital_status: 'married', gender: 'female' } };
    page.newMember = { relationship: '', gender: '', marital_status: 'single' };

    page.onNewMemberRelationshipChange('spouse');

    expect(page.newMember.gender).toBe('male');
    expect(page.newMember.marital_status).toBe('married');
    expect(page.isNewMemberGenderLocked).toBeTrue();
    expect(page.isNewMemberSpouse).toBeTrue();
  });

  it('hides grandchild options until a married son exists on renewal add-member', () => {
    const { page } = makePage('beneficiary');
    page.enrollment = { household_head: { marital_status: 'married' }, family_members: [] };
    page.relationshipOptions = relationshipOptions();

    let values = page.availableMemberRelationshipOptions.map(option => option.value);
    expect(values).not.toContain('grandson');
    expect(values).not.toContain('granddaughter');

    page.enrollment.family_members = [{
      id: 21,
      relationship: 'son',
      marital_status: 'married',
    }];

    values = page.availableMemberRelationshipOptions.map(option => option.value);
    expect(values).toContain('grandson');
    expect(values).toContain('granddaughter');
  });

  it('blocks renewal add-member spouse younger than twenty', async () => {
    const { page, api, toastCtrl } = makePage('beneficiary', {
      dateService: { calculateAge: () => 19 },
    });
    page.canInitiateRenewal = true;
    page.consentAccepted = true;
    page.enrollment = { id: 7, status: 'active', household_head: { marital_status: 'married', gender: 'male' } };
    page.relationshipOptions = relationshipOptions();
    page.newMember = {
      first_name: 'Sita',
      last_name: 'Lama',
      gender: 'female',
      date_of_birth: '2070-01-01',
      relationship: 'spouse',
      marital_status: 'married',
      document_type: 'birth_certificate',
    };

    await page.addNewMember();

    expect(api.post).not.toHaveBeenCalled();
    expect(api.postFormData).not.toHaveBeenCalled();
    expect(toastCtrl.create).toHaveBeenCalledWith(jasmine.objectContaining({
      message: 'wizard.spouse_age_min',
      color: 'warning',
    }));
  });

  it('blocks renewal add-member married or divorced status under twenty', async () => {
    const { page, api, toastCtrl } = makePage('beneficiary', {
      dateService: { calculateAge: () => 19 },
    });
    page.canInitiateRenewal = true;
    page.consentAccepted = true;
    page.enrollment = { id: 7, status: 'active', household_head: { marital_status: 'married' } };
    page.relationshipOptions = relationshipOptions();
    page.newMember = {
      first_name: 'Suman',
      last_name: 'Lama',
      gender: 'male',
      date_of_birth: '2070-01-01',
      relationship: 'son',
      marital_status: 'married',
      document_type: 'birth_certificate',
    };

    await page.addNewMember();

    expect(api.post).not.toHaveBeenCalled();
    expect(api.postFormData).not.toHaveBeenCalled();
    expect(toastCtrl.create).toHaveBeenCalledWith(jasmine.objectContaining({
      message: 'wizard.member_marital_status_age',
      color: 'warning',
    }));
  });

  it('does not show renewal under-twenty marital warning when status is blank or single', () => {
    const { page } = makePage('beneficiary', {
      dateService: { calculateAge: () => 19 },
    });
    page.newMember = {
      relationship: 'daughter',
      date_of_birth: '2075-01-01',
      marital_status: '',
    };

    expect(page.newMemberRelationshipWarning).toBe('');

    page.newMember.marital_status = 'single';

    expect(page.newMemberRelationshipWarning).toBe('');
  });

  it('blocks renewal add-member grandchild without a married son', async () => {
    const { page, api, toastCtrl } = makePage('beneficiary');
    page.canInitiateRenewal = true;
    page.consentAccepted = true;
    page.enrollment = { id: 7, status: 'active', household_head: { marital_status: 'married' }, family_members: [] };
    page.relationshipOptions = relationshipOptions();
    page.newMember = {
      first_name: 'Asha',
      last_name: 'Lama',
      gender: 'female',
      date_of_birth: '2075-01-01',
      relationship: 'granddaughter',
      marital_status: 'single',
      document_type: 'birth_certificate',
    };

    await page.addNewMember();

    expect(api.post).not.toHaveBeenCalled();
    expect(api.postFormData).not.toHaveBeenCalled();
    expect(toastCtrl.create).toHaveBeenCalledWith(jasmine.objectContaining({
      message: 'wizard.grandchild_requires_married_son',
      color: 'warning',
    }));
  });

  it('hides all configured invalid relationships when the enrollee is single', () => {
    const { page } = makePage('beneficiary');
    page.enrollment = { household_head: { marital_status: 'single' } };
    page.relationshipOptions = relationshipOptions();

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

  it('hides spouse-side in-laws but allows child-side in-laws when the enrollee is separated', () => {
    const { page } = makePage('beneficiary');
    page.enrollment = { household_head: { marital_status: 'separated' } };
    page.relationshipOptions = relationshipOptions();

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

  it('rejects stale relationship selections blocked by household head marital status', async () => {
    const { page, api, toastCtrl } = makePage('beneficiary');
    page.canInitiateRenewal = true;
    page.consentAccepted = true;
    page.enrollment = { id: 7, status: 'active', household_head: { marital_status: 'separated' } };
    page.relationshipOptions = relationshipOptions();
    page.newMember = {
      first_name: 'Suman',
      last_name: 'Lama',
      gender: 'male',
      date_of_birth: '2075-01-01',
      relationship: 'father_in_law',
      document_type: 'birth_certificate',
    };

    await page.addNewMember();

    expect(api.post).not.toHaveBeenCalled();
    expect(api.postFormData).not.toHaveBeenCalled();
    expect(toastCtrl.create).toHaveBeenCalledWith(jasmine.objectContaining({
      message: 'wizard.relationship_marital_status_block',
      color: 'warning',
    }));
  });

  it('blocks non-Devanagari Nepali names before direct add-member submit', async () => {
    const { page, api, toastCtrl } = makePage('beneficiary');
    page.canInitiateRenewal = true;
    page.consentAccepted = true;
    page.enrollment = { id: 7, status: 'active', household_head: { marital_status: 'married' } };
    page.relationshipOptions = relationshipOptions();
    page.newMember = {
      first_name: 'Sita',
      last_name: 'Lama',
      first_name_ne: 'Sita',
      last_name_ne: 'लामा',
      gender: 'female',
      date_of_birth: '2050-01-01',
      relationship: 'spouse',
      document_type: 'birth_certificate',
    };

    await page.addNewMember();

    expect(api.post).not.toHaveBeenCalled();
    expect(api.postFormData).not.toHaveBeenCalled();
    expect(toastCtrl.create).toHaveBeenCalledWith(jasmine.objectContaining({
      message: 'wizard.nepali_name_format',
      color: 'warning',
    }));
  });

  it('submits selected first service point from the direct add-member form and opens renewal detail', async () => {
    const { page, api, router } = makePage('beneficiary');
    api.postFormData.and.returnValue(of({ success: true, data: {} }));
    page.canInitiateRenewal = true;
    page.consentAccepted = true;
    page.enrollment = { id: 7, status: 'active', household_head: { marital_status: 'married' } };
    page.renewals = [{ id: 42, status: 'draft' }] as any;
    page.relationshipOptions = relationshipOptions();
    page.newMember = {
      first_name: 'Sita',
      last_name: 'Lama',
      gender: 'female',
      date_of_birth: '2050-01-01',
      relationship: 'spouse',
      document_type: 'citizenship',
      citizenship_number: '३११०२२/६५८४३',
      first_service_point_id: 7,
      first_service_point: 'Bir Hospital',
      occupation: 'Agriculture',
    };

    await page.addNewMember();

    expect(api.postFormData).toHaveBeenCalledWith('/renewals/42/members', jasmine.any(FormData));
    const submitted = api.postFormData.calls.mostRecent().args[1] as FormData;
    expect(submitted.get('first_service_point_id')).toBe('7');
    expect(submitted.get('occupation')).toBe('Agriculture');
    expect(submitted.get('citizenship_number')).toBe('31102265843');
    expect(submitted.has('first_service_point')).toBeFalse();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/renewal-detail/42');
  });

  it('submits birth-certificate identity for under-sixteen direct add members when the birth date is filled', async () => {
    const { page, api, toastCtrl } = makePage('beneficiary', {
      dateService: { calculateAge: (value: string) => String(value).startsWith('207') ? 10 : 33 },
    });
    api.postFormData.and.returnValue(of({ success: true, data: {} }));
    page.canInitiateRenewal = true;
    page.consentAccepted = true;
    page.enrollment = { id: 7, status: 'active', household_head: { marital_status: 'married' } };
    page.renewals = [{ id: 42, status: 'draft' }] as any;
    page.relationshipOptions = relationshipOptions();
    page.newMember = {
      first_name: 'Anita',
      last_name: 'Lama',
      gender: 'female',
      date_of_birth: '2075-01-01',
      relationship: 'daughter',
      marital_status: 'single',
      document_type: 'citizenship',
      citizenship_number: 'STALE-CIT',
      birth_certificate_number: 'BC-123',
    };

    await page.addNewMember();

    expect(api.postFormData).toHaveBeenCalledWith('/renewals/42/members', jasmine.any(FormData));
    const submitted = api.postFormData.calls.mostRecent().args[1] as FormData;
    expect(submitted.get('document_type')).toBe('birth_certificate');
    expect(submitted.get('birth_certificate_number')).toBe('BC-123');
    expect(submitted.has('citizenship_number')).toBeFalse();
    expect(toastCtrl.create).not.toHaveBeenCalledWith(jasmine.objectContaining({
      message: 'wizard.member_age_citizenship',
      color: 'warning',
    }));
  });

  it('submits a blank first service point from direct add-member form when none is selected', async () => {
    const { page, api } = makePage('beneficiary');
    api.postFormData.and.returnValue(of({ success: true, data: {} }));
    page.canInitiateRenewal = true;
    page.consentAccepted = true;
    page.enrollment = { id: 7, status: 'active', household_head: { marital_status: 'married' } };
    page.renewals = [{ id: 42, status: 'draft' }] as any;
    page.relationshipOptions = relationshipOptions();
    page.newMember = {
      first_name: 'Sita',
      last_name: 'Lama',
      gender: 'female',
      date_of_birth: '2050-01-01',
      relationship: 'spouse',
      document_type: 'birth_certificate',
      first_service_point_id: '',
    };

    await page.addNewMember();

    const submitted = api.postFormData.calls.mostRecent().args[1] as FormData;
    expect(submitted.get('first_service_point_id')).toBe('');
  });

  it('blocks add-member when citizenship issue date is before the sixteenth birthday', async () => {
    const isCitizenshipIssueDateValid = jasmine.createSpy().and.returnValue(false);
    const { page, api, toastCtrl } = makePage('beneficiary', {
      dateService: { isCitizenshipIssueDateValid },
    });
    page.canInitiateRenewal = true;
    page.consentAccepted = true;
    page.enrollment = { id: 7, status: 'active', household_head: { marital_status: 'married' } };
    page.relationshipOptions = relationshipOptions();
    page.newMember = {
      first_name: 'Sita',
      last_name: 'Lama',
      gender: 'female',
      date_of_birth: '2050-01-01',
      relationship: 'spouse',
      marital_status: 'married',
      document_type: 'citizenship',
      citizenship_number: 'CIT-001',
      citizenship_issue_date: '2065-12-30',
      citizenship_issue_district: 'Kathmandu',
    };

    await page.addNewMember();

    expect(api.post).not.toHaveBeenCalled();
    expect(api.postFormData).not.toHaveBeenCalled();
    expect(isCitizenshipIssueDateValid).toHaveBeenCalledWith('2050-01-01', '2065-12-30', 'bs');
    expect(toastCtrl.create).toHaveBeenCalledWith(jasmine.objectContaining({
      message: 'wizard.citizenship_issue_age',
      color: 'warning',
    }));
  });
});
