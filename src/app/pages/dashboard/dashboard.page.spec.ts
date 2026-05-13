import { of, Subject } from 'rxjs';
import { DashboardPage } from './dashboard.page';

describe('DashboardPage', () => {
  function languageService() {
    return {
      t: (key: string) => key,
      formatNumber: (value: number) => String(value),
      translateText: (value?: string) => value || '',
    };
  }

  function makePage(overrides: { dashboardData?: unknown; router?: unknown } = {}): DashboardPage {
    return new DashboardPage(
      {} as any,
      {} as any,
      (overrides.router || {}) as any,
      { events$: new Subject() } as any,
      (overrides.dashboardData || {}) as any,
      languageService() as any
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

  it('shows the insurance checker only for beneficiary dashboards', () => {
    const page = makePage();

    page.isBeneficiary = true;
    expect(page.showInsuranceChecker).toBeTrue();

    page.isBeneficiary = false;
    expect(page.showInsuranceChecker).toBeFalse();
  });

  it('validates NID before sending the insurance checker request', () => {
    const dashboardData = {
      checkInsurance: jasmine.createSpy(),
    };
    const page = makePage({ dashboardData });
    page.insuranceCheckNid = '123-ABC';

    page.checkInsurance();

    expect(dashboardData.checkInsurance).not.toHaveBeenCalled();
    expect(page.insuranceCheckMessage).toBe('dashboard.insurance_check_invalid_nid');
  });

  it('stores a successful insurance checker result', () => {
    const checkerResult = {
      national_id: '1234567890',
      has_active_insurance: true,
      can_enroll: false,
      message: 'This NID already has active insurance.',
      summary: {
        enrollment_number: 'HIB-2026-000001',
        status: 'active',
        policy_start_date: '2026-05-10',
        policy_end_date: '2027-05-09',
      },
    };
    const dashboardData = {
      checkInsurance: jasmine.createSpy().and.returnValue(of({
        success: true,
        data: checkerResult,
      })),
    };
    const page = makePage({ dashboardData });
    page.insuranceCheckNid = '१२३-४५६-७८९-०';

    page.checkInsurance();

    expect(dashboardData.checkInsurance).toHaveBeenCalledWith('१२३-४५६-७८९-०');
    expect(page.insuranceCheckResult).toEqual(checkerResult);
    expect(page.insuranceCheckMessage).toBe('This NID already has active insurance.');
    expect(page.insuranceCheckLoading).toBeFalse();
  });

  it('navigates to the KYC demo page from the dashboard action', () => {
    const router = jasmine.createSpyObj('Router', ['navigateByUrl']);
    const page = makePage({ router });

    page.openKycDemo();

    expect(router.navigateByUrl).toHaveBeenCalledOnceWith('/kyc-demo');
  });
});
