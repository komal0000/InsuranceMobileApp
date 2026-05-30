import { of } from 'rxjs';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular/standalone';
import { ForgotPasswordPage } from './forgot-password.page';
import { AuthService } from '../../services/auth.service';
import { LanguageService } from '../../services/language.service';

describe('ForgotPasswordPage', () => {
  const createToastController = () => ({
    create: jasmine.createSpy().and.callFake(async () => ({
      present: jasmine.createSpy().and.resolveTo(),
    })),
  });
  const languageService = {
    t: (key: string) => key,
    translateText: (value?: string) => value || '',
  };

  const createPage = (authService: unknown, router: unknown, toastCtrl: unknown) => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router },
        { provide: ToastController, useValue: toastCtrl },
        { provide: LanguageService, useValue: languageService },
      ],
    });

    return TestBed.runInInjectionContext(() => new ForgotPasswordPage());
  };

  it('moves to OTP verification after sending a password reset OTP', async () => {
    const authService = jasmine.createSpyObj('AuthService', [
      'sendPasswordOtp',
      'verifyPasswordOtp',
      'resetPasswordWithOtp',
      'sendPasswordResetEmail',
    ]);
    const router = jasmine.createSpyObj('Router', ['navigateByUrl']);
    const toastCtrl = createToastController();

    authService.sendPasswordOtp.and.returnValue(of({
      success: true,
      message: 'Password reset OTP sent successfully.',
      data: {
        mobile_number: '9812345678',
      },
    }));

    const page = createPage(authService, router, toastCtrl);
    page.mobileNumber = '9812345678';

    await page.sendOtp();

    expect(authService.sendPasswordOtp).toHaveBeenCalledWith({ mobile_number: '9812345678' });
    expect(page.otpStep).toBe(2);
  });

  it('sends a reset email using the linked beneficiary email address', async () => {
    const authService = jasmine.createSpyObj('AuthService', [
      'sendPasswordOtp',
      'verifyPasswordOtp',
      'resetPasswordWithOtp',
      'sendPasswordResetEmail',
    ]);
    const router = jasmine.createSpyObj('Router', ['navigateByUrl']);
    const toastCtrl = createToastController();

    authService.sendPasswordResetEmail.and.returnValue(of({
      success: true,
      message: 'Password reset email sent successfully.',
      data: undefined,
    }));

    const page = createPage(authService, router, toastCtrl);
    page.setRecoveryMethod('email');
    page.mobileNumber = '9812345678';

    await page.sendResetEmail();

    expect(authService.sendPasswordResetEmail).toHaveBeenCalledWith({ mobile_number: '9812345678' });
  });

  it('blocks weak passwords before resetting with OTP', async () => {
    const authService = jasmine.createSpyObj('AuthService', [
      'sendPasswordOtp',
      'verifyPasswordOtp',
      'resetPasswordWithOtp',
      'sendPasswordResetEmail',
    ]);
    const router = jasmine.createSpyObj('Router', ['navigateByUrl']);
    const toastCtrl = createToastController();

    authService.resetPasswordWithOtp.and.returnValue(of({
      success: true,
      message: 'Password reset successful.',
      data: undefined,
    }));

    const page = createPage(authService, router, toastCtrl);
    page.mobileNumber = '9812345678';
    page.otp = '123456';
    page.password = 'Password123';
    page.passwordConfirmation = 'Password123';

    await page.resetPassword();

    expect(authService.resetPasswordWithOtp).not.toHaveBeenCalled();
    expect(toastCtrl.create).toHaveBeenCalledWith(jasmine.objectContaining({
      message: 'auth.password_policy',
      color: 'warning',
    }));
  });

  it('toggles reset password fields independently', () => {
    const authService = jasmine.createSpyObj('AuthService', [
      'sendPasswordOtp',
      'verifyPasswordOtp',
      'resetPasswordWithOtp',
      'sendPasswordResetEmail',
    ]);
    const router = jasmine.createSpyObj('Router', ['navigateByUrl']);
    const toastCtrl = createToastController();
    const page = createPage(authService, router, toastCtrl);

    expect(page.passwordInputType('password')).toBe('password');
    expect(page.passwordInputType('confirmation')).toBe('password');

    page.togglePasswordVisibility('confirmation');

    expect(page.passwordInputType('password')).toBe('password');
    expect(page.passwordInputType('confirmation')).toBe('text');
  });
});
