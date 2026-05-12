import { EMPTY, Subject, of } from 'rxjs';
import { RenewalsPage } from './renewals.page';

describe('RenewalsPage', () => {
  function makePage(role: string) {
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

    const page = new RenewalsPage(
      api,
      { events$: EMPTY } as any,
      { getCurrentUser: () => ({ role }) } as any,
      {} as any,
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
});
