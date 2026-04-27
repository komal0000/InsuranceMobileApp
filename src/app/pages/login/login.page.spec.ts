import { of } from 'rxjs';
import { convertToParamMap } from '@angular/router';
import { LoginPage } from './login.page';

describe('LoginPage', () => {
  const createRoute = (params: Record<string, string> = {}) => ({
    queryParamMap: of(convertToParamMap(params)),
  });

  const createToastController = () => ({
    create: jasmine.createSpy().and.callFake(async () => ({
      present: jasmine.createSpy().and.resolveTo(),
    })),
  });

  it('keeps registration setup hidden on direct login', () => {
    const authService = jasmine.createSpyObj('AuthService', [
      'login',
      'sendLoginSetupOtp',
      'verifyLoginSetupOtp',
      'createLoginSetupPassword',
    ]);
    const router = jasmine.createSpyObj('Router', ['navigateByUrl']);
    const page = new LoginPage(authService as any, router as any, createRoute() as any, createToastController() as any);

    expect(page.showRegistrationSetup).toBeFalse();
    expect(page.loginData.identifier).toBe('');
  });

  it('prefills mobile and shows setup from registration handoff', () => {
    const authService = jasmine.createSpyObj('AuthService', [
      'login',
      'sendLoginSetupOtp',
      'verifyLoginSetupOtp',
      'createLoginSetupPassword',
    ]);
    const router = jasmine.createSpyObj('Router', ['navigateByUrl']);
    const page = new LoginPage(authService as any, router as any, createRoute({
      setup: 'registration',
      identifier_type: 'mobile',
      identifier: '9812345678',
    }) as any, createToastController() as any);

    expect(page.showRegistrationSetup).toBeTrue();
    expect(page.loginData.identifier_type).toBe('mobile');
    expect(page.loginData.identifier).toBe('9812345678');
  });

  it('sends OTP, verifies OTP, and creates password for registration setup', async () => {
    const authService = jasmine.createSpyObj('AuthService', [
      'login',
      'sendLoginSetupOtp',
      'verifyLoginSetupOtp',
      'createLoginSetupPassword',
    ]);
    const router = jasmine.createSpyObj('Router', ['navigateByUrl']);
    router.navigateByUrl.and.resolveTo(true);
    const page = new LoginPage(authService as any, router as any, createRoute({
      setup: 'registration',
      identifier_type: 'mobile',
      identifier: '9812345678',
    }) as any, createToastController() as any);

    authService.sendLoginSetupOtp.and.returnValue(of({
      success: true,
      message: 'OTP sent successfully.',
      data: {
        registration_status: 'pending_otp',
        mobile_number: '9812345678',
      },
    }));

    authService.verifyLoginSetupOtp.and.returnValue(of({
      success: true,
      message: 'OTP verified successfully.',
      data: {
        registration_status: 'pending_password',
        mobile_number: '9812345678',
      },
    }));

    authService.createLoginSetupPassword.and.returnValue(of({
      success: true,
      message: 'Password created successfully.',
      data: {
        token: 'token-123',
        user: {
          id: 1,
          name: 'Komal Shrestha',
          mobile_number: '9812345678',
          role: 'beneficiary',
          permissions: [],
        },
      },
    }));

    await page.sendSetupOtp();
    expect(authService.sendLoginSetupOtp).toHaveBeenCalledWith({
      identifier_type: 'mobile',
      identifier: '9812345678',
    });
    expect(page.otpSent).toBeTrue();

    page.setupOtp = '123456';
    await page.verifySetupOtp();
    expect(authService.verifyLoginSetupOtp).toHaveBeenCalledWith({
      identifier_type: 'mobile',
      identifier: '9812345678',
      otp: '123456',
    });
    expect(page.otpVerified).toBeTrue();

    page.setupPassword = 'Password123';
    page.setupPasswordConfirmation = 'Password123';
    await page.createSetupPassword();
    await Promise.resolve();
    await Promise.resolve();

    expect(authService.createLoginSetupPassword).toHaveBeenCalledWith({
      identifier_type: 'mobile',
      identifier: '9812345678',
      otp: '123456',
      password: 'Password123',
      password_confirmation: 'Password123',
      remember: false,
    });
    expect(router.navigateByUrl).toHaveBeenCalledWith('/tabs/dashboard', { replaceUrl: true });
  });
});
