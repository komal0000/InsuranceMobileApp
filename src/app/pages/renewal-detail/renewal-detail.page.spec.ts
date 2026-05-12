import { EMPTY, of } from 'rxjs';
import { RenewalDetailPage } from './renewal-detail.page';

describe('RenewalDetailPage', () => {
  function makePage() {
    const api = jasmine.createSpyObj('ApiService', ['get', 'postFormData']);
    api.get.and.returnValue(of({ success: true, data: {} }));
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

    const page = new RenewalDetailPage(
      { snapshot: { paramMap: { get: () => '12' } } } as any,
      jasmine.createSpyObj('Router', ['navigateByUrl']) as any,
      api,
      { events$: EMPTY } as any,
      { getCurrentBs: () => '2083-01-01', calculateAge: () => 30, prepareFormDataForApi: (fd: FormData) => fd } as any,
      toastCtrl as any,
      {} as any,
      languageService as any,
    );

    return { page, api, toastCtrl };
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
});
