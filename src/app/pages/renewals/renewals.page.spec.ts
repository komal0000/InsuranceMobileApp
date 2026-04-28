import { EMPTY, of } from 'rxjs';
import { RenewalsPage } from './renewals.page';

describe('RenewalsPage', () => {
  function makePage(role: string) {
    const api = jasmine.createSpyObj('ApiService', ['get', 'post', 'postFormData']);
    api.get.and.returnValue(of({ success: true, data: { data: [], last_page: 1 } }));
    const router = jasmine.createSpyObj('Router', ['navigateByUrl']);

    const page = new RenewalsPage(
      api,
      { events$: EMPTY } as any,
      { getCurrentUser: () => ({ role }) } as any,
      {} as any,
      router,
      {} as any
    );

    return { page, router };
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
});
