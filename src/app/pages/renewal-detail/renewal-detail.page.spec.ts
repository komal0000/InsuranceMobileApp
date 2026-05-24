import { EMPTY, of } from 'rxjs';
import { RenewalDetailPage } from './renewal-detail.page';

describe('RenewalDetailPage', () => {
  function makePage(overrides: { dateService?: Record<string, unknown>; alertCtrl?: unknown } = {}) {
    const api = jasmine.createSpyObj('ApiService', ['get', 'post', 'postFormData']);
    api.get.and.returnValue(of({ success: true, data: {} }));
    api.post.and.returnValue(of({ success: true, data: {} }));
    api.postFormData.and.returnValue(of({ success: true, data: {} }));
    const toast = { present: jasmine.createSpy().and.returnValue(Promise.resolve()) };
    const toastCtrl = {
      create: jasmine.createSpy().and.returnValue(Promise.resolve(toast)),
    };
    const languageService = {
      t: (key: string) => key,
      label: (_namespace: string, value: string) => value,
      translateText: (value?: string) => value || '',
    };
    const dateService = {
      getCurrentBs: () => '2083-01-01',
      calculateAge: () => 30,
      isCitizenshipIssueDateValid: () => true,
      prepareFormDataForApi: (fd: FormData) => fd,
      ...overrides.dateService,
    };

    const router = jasmine.createSpyObj('Router', ['navigate', 'navigateByUrl']);
    const page = new RenewalDetailPage(
      { snapshot: { paramMap: { get: () => '12' } } } as any,
      router as any,
      api,
      { events$: EMPTY } as any,
      dateService as any,
      toastCtrl as any,
      (overrides.alertCtrl || {}) as any,
      languageService as any,
    );

    return { page, api, router, toastCtrl };
  }

  function relationshipOptions() {
    return [
      { value: 'spouse', label: 'Spouse' },
      { value: 'father_in_law', label: 'Father-in-law' },
      { value: 'mother_in_law', label: 'Mother-in-law' },
      { value: 'brother_in_law', label: 'Brother-in-law' },
      { value: 'sister_in_law', label: 'Sister-in-law' },
      { value: 'son_in_law', label: 'Son-in-law' },
      { value: 'daughter_in_law', label: 'Daughter-in-law' },
      { value: 'father', label: 'Father' },
      { value: 'other', label: 'Other' },
    ];
  }

  it('hides spouse-side in-laws but allows child-side in-laws when the head is separated', () => {
    const { page } = makePage();
    page.renewal = { enrollment: { household_head: { marital_status: 'separated' } } } as any;
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

  it('loads service point options from the renewal enrollment location', () => {
    const { page, api } = makePage();
    page.renewalId = 12;
    api.get.and.callFake((path: string) => {
      if (path === '/renewals/12') {
        return of({
          success: true,
          data: {
            renewal: {
              id: 12,
              enrollment: {
                province: 'Bagamati',
                district: 'Kathmandu',
                household_head: { marital_status: 'married' },
              },
            },
          },
        });
      }

      if (path === '/geo/service-points/Bagamati/Kathmandu') {
        return of({
          success: true,
          data: [{ id: 7, code: 'H0302000', name: 'Bir Hospital' }],
        });
      }

      return of({ success: true, data: {} });
    });

    page.loadDetail();

    expect(api.get).toHaveBeenCalledWith('/geo/service-points/Bagamati/Kathmandu');
    expect((page as any).servicePointOptions).toEqual([
      { id: 7, code: 'H0302000', name: 'Bir Hospital' },
    ]);
  });

  it('submits selected first service point for renewal member saves', async () => {
    const { page, api } = makePage();
    page.renewalId = 12;
    page.renewal = { enrollment: { household_head: { marital_status: 'married' } } } as any;
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

    await page.saveMember();

    expect(api.postFormData).toHaveBeenCalledWith('/renewals/12/members', jasmine.any(FormData));
    const submitted = api.postFormData.calls.mostRecent().args[1] as FormData;
    expect(submitted.get('first_service_point_id')).toBe('7');
    expect(submitted.get('occupation')).toBe('Agriculture');
    expect(submitted.get('citizenship_number')).toBe('31102265843');
    expect(submitted.has('first_service_point')).toBeFalse();
  });

  it('normalizes birth certificate numbers before renewal member saves', async () => {
    const { page, api } = makePage({
      dateService: { calculateAge: (value: string) => String(value).startsWith('207') ? 10 : 33 },
    });
    page.renewalId = 12;
    page.renewal = { enrollment: { household_head: { marital_status: 'married' } } } as any;
    page.relationshipOptions = [{ value: 'daughter', label: 'Daughter' }];
    page.newMember = {
      first_name: 'Anita',
      last_name: 'Lama',
      gender: 'female',
      date_of_birth: '2075-01-01',
      relationship: 'daughter',
      marital_status: 'single',
      document_type: 'birth_certificate',
      birth_certificate_number: 'BC-१२३',
    };

    await page.saveMember();

    expect(api.postFormData).toHaveBeenCalledWith('/renewals/12/members', jasmine.any(FormData));
    const submitted = api.postFormData.calls.mostRecent().args[1] as FormData;
    expect(submitted.get('document_type')).toBe('birth_certificate');
    expect(submitted.get('birth_certificate_number')).toBe('123');
    expect(submitted.has('citizenship_number')).toBeFalse();
  });

  it('uses renewal members with staged add and removal badges before enrollment fallback', () => {
    const { page } = makePage();
    const added = { id: 9, first_name: 'Mina', pending_renewal_addition: true };
    const removed = { id: 10, first_name: 'Rita', pending_renewal_removal: true };
    page.renewal = {
      members_added: [9],
      members_removed: [10],
      members: [added, removed],
      enrollment: {
        family_members: [{ id: 11, first_name: 'Public' }],
      },
    } as any;

    expect(page.renewalMembers).toEqual([added, removed]);
    expect(page.isRenewalAddedMember(added)).toBeTrue();
    expect(page.isRenewalRemovedMember(removed)).toBeTrue();
  });

  it('submits a blank first service point so renewal edits can clear a saved member value', async () => {
    const { page, api } = makePage();
    page.renewalId = 12;
    page.renewal = { enrollment: { household_head: { marital_status: 'married' } } } as any;
    page.relationshipOptions = relationshipOptions();
    page.editingMemberId = 5;
    page.newMember = {
      first_name: 'Sita',
      last_name: 'Lama',
      gender: 'female',
      date_of_birth: '2050-01-01',
      relationship: 'spouse',
      document_type: 'birth_certificate',
      first_service_point_id: '',
      first_service_point: 'Bir Hospital',
    };

    await page.saveMember();

    expect(api.postFormData).toHaveBeenCalledWith('/renewals/12/members/5', jasmine.any(FormData));
    const submitted = api.postFormData.calls.mostRecent().args[1] as FormData;
    expect(submitted.get('first_service_point_id')).toBe('');
    expect(submitted.has('first_service_point')).toBeFalse();
  });

  it('rejects stale relationship selections blocked by household head marital status', async () => {
    const { page, api, toastCtrl } = makePage();
    page.renewalId = 12;
    page.renewal = { enrollment: { household_head: { marital_status: 'separated' } } } as any;
    page.relationshipOptions = relationshipOptions();
    page.newMember = {
      first_name: 'Suman',
      last_name: 'Lama',
      gender: 'male',
      date_of_birth: '2075-01-01',
      relationship: 'brother_in_law',
      document_type: 'birth_certificate',
    };

    await page.saveMember();

    expect(api.postFormData).not.toHaveBeenCalled();
    expect(toastCtrl.create).toHaveBeenCalledWith(jasmine.objectContaining({
      message: 'wizard.relationship_marital_status_block',
      color: 'warning',
    }));
  });

  it('blocks non-Devanagari Nepali names before renewal member save', async () => {
    const { page, api, toastCtrl } = makePage();
    page.renewalId = 12;
    page.renewal = { enrollment: { household_head: { marital_status: 'married' } } } as any;
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

    await page.saveMember();

    expect(api.postFormData).not.toHaveBeenCalled();
    expect(toastCtrl.create).toHaveBeenCalledWith(jasmine.objectContaining({
      message: 'wizard.nepali_name_format',
      color: 'warning',
    }));
  });

  it('blocks member save when citizenship issue date is before the sixteenth birthday', async () => {
    const isCitizenshipIssueDateValid = jasmine.createSpy().and.returnValue(false);
    const { page, api, toastCtrl } = makePage({
      dateService: { isCitizenshipIssueDateValid },
    });
    page.renewalId = 12;
    page.renewal = { enrollment: { household_head: { marital_status: 'married' } } } as any;
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

    await page.saveMember();

    expect(api.postFormData).not.toHaveBeenCalled();
    expect(isCitizenshipIssueDateValid).toHaveBeenCalledWith('2050-01-01', '2065-12-30', 'bs');
    expect(toastCtrl.create).toHaveBeenCalledWith(jasmine.objectContaining({
      message: 'wizard.citizenship_issue_age',
      color: 'warning',
    }));
  });

  it('routes paid eligible renewals directly to payment instead of submit API', async () => {
    const { page, api, router } = makePage();
    page.renewalId = 12;
    page.consentAccepted = true;
    page.renewal = {
      id: 12,
      status: 'eligible',
      final_amount: 3500,
      renewal_number: 'RNW-0001',
    } as any;

    await page.submitRenewal();

    expect(api.post).not.toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledOnceWith(['/payment'], {
      queryParams: {
        renewalId: 12,
        amount: 3500,
        type: 'renewal',
        policyNumber: 'RNW-0001',
      },
    });
  });

  it('keeps zero-pay renewals on the submit-to-review API path', async () => {
    const { page, api, router } = makePage();
    page.renewalId = 12;
    page.consentAccepted = true;
    page.renewal = {
      id: 12,
      status: 'eligible',
      final_amount: 0,
      renewal_number: 'RNW-FREE',
    } as any;

    await page.submitRenewal();

    expect(api.post).toHaveBeenCalledOnceWith('/renewals/12/submit', {
      consent_accepted: true,
    });
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('removes newly added renewal members without selecting a death/removal document', async () => {
    const presentedAlert = { present: jasmine.createSpy().and.returnValue(Promise.resolve()) };
    const alertCtrl = {
      create: jasmine.createSpy().and.callFake(async (options: any) => {
        options.buttons[1].handler();
        return presentedAlert;
      }),
    };
    const { page, api } = makePage({ alertCtrl });
    page.renewalId = 12;
    page.renewal = {
      members_added: [9],
      enrollment: { status: 'active' },
    } as any;
    (page as any).selectRemovalDocument = jasmine.createSpy().and.returnValue(Promise.resolve(null));

    await page.removeMember({
      id: 9,
      first_name: 'New',
      last_name: 'Member',
      member_status: 'pending_verification',
    });
    await Promise.resolve();

    expect((page as any).selectRemovalDocument).not.toHaveBeenCalled();
    expect(api.postFormData).toHaveBeenCalledWith('/renewals/12/members/9', jasmine.any(FormData));
    const submitted = api.postFormData.calls.mostRecent().args[1] as FormData;
    expect(submitted.get('_method')).toBe('DELETE');
    expect(submitted.has('death_document')).toBeFalse();
    expect(presentedAlert.present).toHaveBeenCalled();
  });

  it('requires a death/removal document for approved renewal members', async () => {
    const deathDocument = new File(['proof'], 'death-proof.pdf', { type: 'application/pdf' });
    const presentedAlert = { present: jasmine.createSpy().and.returnValue(Promise.resolve()) };
    const alertCtrl = {
      create: jasmine.createSpy().and.callFake(async (options: any) => {
        options.buttons[1].handler();
        return presentedAlert;
      }),
    };
    const { page, api } = makePage({ alertCtrl });
    page.renewalId = 12;
    page.renewal = { enrollment: { status: 'active' } } as any;
    (page as any).selectRemovalDocument = jasmine.createSpy().and.returnValue(Promise.resolve(deathDocument));

    await page.removeMember({
      id: 10,
      first_name: 'Approved',
      last_name: 'Member',
      member_status: 'approved',
    });
    await Promise.resolve();

    expect((page as any).selectRemovalDocument).toHaveBeenCalled();
    expect(api.postFormData).toHaveBeenCalledWith('/renewals/12/members/10', jasmine.any(FormData));
    const submitted = api.postFormData.calls.mostRecent().args[1] as FormData;
    expect(submitted.get('_method')).toBe('DELETE');
    expect(submitted.has('death_document')).toBeTrue();
    expect(presentedAlert.present).toHaveBeenCalled();
  });

  it('requires a death/removal document for existing active renewal members with stale status', async () => {
    const deathDocument = new File(['proof'], 'death-proof.pdf', { type: 'application/pdf' });
    const presentedAlert = { present: jasmine.createSpy().and.returnValue(Promise.resolve()) };
    const alertCtrl = {
      create: jasmine.createSpy().and.callFake(async (options: any) => {
        options.buttons[1].handler();
        return presentedAlert;
      }),
    };
    const { page, api } = makePage({ alertCtrl });
    page.renewalId = 12;
    page.renewal = {
      members_added: [],
      enrollment: { status: 'active' },
    } as any;
    (page as any).selectRemovalDocument = jasmine.createSpy().and.returnValue(Promise.resolve(deathDocument));

    await page.removeMember({
      id: 11,
      first_name: 'Existing',
      last_name: 'Member',
      member_status: 'pending_verification',
    });
    await Promise.resolve();

    expect((page as any).selectRemovalDocument).toHaveBeenCalled();
    expect(api.postFormData).toHaveBeenCalledWith('/renewals/12/members/11', jasmine.any(FormData));
    const submitted = api.postFormData.calls.mostRecent().args[1] as FormData;
    expect(submitted.get('_method')).toBe('DELETE');
    expect(submitted.has('death_document')).toBeTrue();
    expect(presentedAlert.present).toHaveBeenCalled();
  });
});
