import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { guestGuard } from './guest.guard';

describe('guestGuard', () => {
  const runGuard = (authService: unknown) => {
    const router = jasmine.createSpyObj('Router', ['navigateByUrl']);

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router },
      ],
    });

    return {
      router,
      result: TestBed.runInInjectionContext(() => guestGuard({} as any, { url: '/login' } as any)),
    };
  };

  it('redirects authenticated imported users from login to KYC', async () => {
    const authService = {
      init: jasmine.createSpy('init').and.resolveTo(),
      isAuthenticated: jasmine.createSpy('isAuthenticated').and.returnValue(true),
      getCurrentUser: jasmine.createSpy('getCurrentUser').and.returnValue({
        role: 'beneficiary',
        kyc_required: true,
        kyc_submitted: false,
        can_perform_kyc: true,
      }),
    };

    const { router, result } = runGuard(authService);

    expect(await result).toBeFalse();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/kyc', { replaceUrl: true });
  });

  it('redirects older persisted KYC-required users from login to KYC when KYC eligibility is missing', async () => {
    const authService = {
      init: jasmine.createSpy('init').and.resolveTo(),
      isAuthenticated: jasmine.createSpy('isAuthenticated').and.returnValue(true),
      getCurrentUser: jasmine.createSpy('getCurrentUser').and.returnValue({
        role: 'beneficiary',
        kyc_required: true,
        kyc_submitted: false,
      }),
    };

    const { router, result } = runGuard(authService);

    expect(await result).toBeFalse();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/kyc', { replaceUrl: true });
  });

  it('redirects authenticated imported users from login to dashboard when they cannot perform KYC yet', async () => {
    const authService = {
      init: jasmine.createSpy('init').and.resolveTo(),
      isAuthenticated: jasmine.createSpy('isAuthenticated').and.returnValue(true),
      getCurrentUser: jasmine.createSpy('getCurrentUser').and.returnValue({
        role: 'beneficiary',
        kyc_required: true,
        kyc_submitted: false,
        can_perform_kyc: false,
      }),
    };

    const { router, result } = runGuard(authService);

    expect(await result).toBeFalse();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/tabs/dashboard', { replaceUrl: true });
  });
});
