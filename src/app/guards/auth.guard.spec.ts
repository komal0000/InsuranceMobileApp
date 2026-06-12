import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { authGuard } from './auth.guard';

describe('authGuard', () => {
  const runGuard = (authService: unknown, url: string) => {
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
      result: TestBed.runInInjectionContext(() => authGuard({} as any, { url } as any)),
    };
  };

  it('redirects imported users to KYC before dashboard access', async () => {
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

    const { router, result } = runGuard(authService, '/tabs/dashboard');

    expect(await result).toBeFalse();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/kyc', { replaceUrl: true });
  });

  it('allows imported users to open KYC while gated', async () => {
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

    const { router, result } = runGuard(authService, '/kyc');

    expect(await result).toBeTrue();
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it('redirects older persisted KYC-required users when KYC eligibility is missing', async () => {
    const authService = {
      init: jasmine.createSpy('init').and.resolveTo(),
      isAuthenticated: jasmine.createSpy('isAuthenticated').and.returnValue(true),
      getCurrentUser: jasmine.createSpy('getCurrentUser').and.returnValue({
        role: 'beneficiary',
        kyc_required: true,
        kyc_submitted: false,
      }),
    };

    const { router, result } = runGuard(authService, '/tabs/dashboard');

    expect(await result).toBeFalse();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/kyc', { replaceUrl: true });
  });

  it('allows dashboard access when KYC is required but enrollment is not eligible for KYC', async () => {
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

    const { router, result } = runGuard(authService, '/tabs/dashboard');

    expect(await result).toBeTrue();
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });
});
