import { Subject } from 'rxjs';
import { DashboardPage } from './dashboard.page';

describe('DashboardPage', () => {
  function makePage(): DashboardPage {
    return new DashboardPage(
      {} as any,
      {} as any,
      {} as any,
      { events$: new Subject() } as any,
      {} as any
    );
  }

  it('does not allow admin management roles to create enrollments', () => {
    const page = makePage() as any;

    expect(page.canRoleCreateEnrollment('admin')).toBeFalse();
    expect(page.canRoleCreateEnrollment('super_admin')).toBeFalse();
    expect(page.canRoleCreateEnrollment('province')).toBeFalse();
    expect(page.canRoleCreateEnrollment('district_eo')).toBeFalse();
  });

  it('allows beneficiaries and enrollment assistants to create enrollments', () => {
    const page = makePage() as any;

    expect(page.canRoleCreateEnrollment('beneficiary')).toBeTrue();
    expect(page.canRoleCreateEnrollment('enrollment_assistant')).toBeTrue();
  });
});
