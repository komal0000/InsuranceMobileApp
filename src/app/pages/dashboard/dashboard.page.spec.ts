import { of, Subject } from 'rxjs';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { DashboardPage } from './dashboard.page';
import { ApiService } from '../../services/api.service';
import { AppSyncService } from '../../services/app-sync.service';
import { AuthService } from '../../services/auth.service';
import { DashboardDataService } from '../../services/dashboard-data.service';
import { LanguageService } from '../../services/language.service';

describe('DashboardPage', () => {
  function languageService() {
    return {
      t: (key: string) => key,
      label: (_namespace: string, value?: string) => value || '',
      formatNumber: (value: number) => String(value),
      translateText: (value?: string) => value || '',
    };
  }

  function makePage(overrides: { dashboardData?: unknown; router?: unknown } = {}): DashboardPage {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        { provide: ApiService, useValue: {} },
        { provide: AuthService, useValue: {} },
        { provide: Router, useValue: overrides.router || {} },
        { provide: AppSyncService, useValue: { events$: new Subject() } },
        { provide: DashboardDataService, useValue: overrides.dashboardData || {} },
        { provide: LanguageService, useValue: languageService() },
      ],
    });

    return TestBed.runInInjectionContext(() => new DashboardPage());
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

  it('navigates to the KYC page from the dashboard action', () => {
    const router = jasmine.createSpyObj('Router', ['navigateByUrl']);
    const page = makePage({ router });

    page.openKycDemo();

    expect(router.navigateByUrl).toHaveBeenCalledOnceWith('/kyc');
  });

  it('navigates to the HIB Profile page from the dashboard action', () => {
    const router = jasmine.createSpyObj('Router', ['navigateByUrl']);
    const page = makePage({ router });

    page.openHibProfile();

    expect(router.navigateByUrl).toHaveBeenCalledOnceWith('/tabs/hib-profile');
  });

  it('exposes beneficiary profile details for the dashboard template', () => {
    const page = makePage();
    page.stats = {
      profile: {
        enrollment: {
          id: 10,
          enrollment_number: 'HIB-DASH-000001',
        },
        household_head: {
          id: 1,
          name: 'Sunita Lama',
          hib_number: 'HIB-HH-001',
          photo_url: null,
        },
        members: [
          {
            id: 2,
            name: 'Amit Lama',
            relationship: 'son',
            member_number: 'HIB-DASH-000001-02',
          },
        ],
      },
    };

    expect(page.beneficiaryProfile?.household_head?.hib_number).toBe('HIB-HH-001');
    expect(page.profileMembers.length).toBe(1);
    expect(page.memberHibNumber(page.profileMembers[0])).toBe('HIB-DASH-000001-02');
    expect(page.profileInitial('Sunita Lama')).toBe('S');
  });

  it('uses KYC quick action labels while keeping the primary KYC route', () => {
    const router = jasmine.createSpyObj('Router', ['navigateByUrl']);
    const page = makePage({ router });

    expect(page.kycActionTitleKey).toBe('dashboard.kyc');
    expect(page.kycActionHelpKey).toBe('dashboard.kyc_help');

    page.openKycDemo();

    expect(router.navigateByUrl).toHaveBeenCalledOnceWith('/kyc');
  });
});
