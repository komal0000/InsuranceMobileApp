import { of } from 'rxjs';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular/standalone';
import { AuthService } from '../../services/auth.service';
import { LanguageService } from '../../services/language.service';
import { AffiliationSyncPage } from './affiliation-sync.page';

describe('AffiliationSyncPage', () => {
  const languageService = {
    t: (key: string) => key,
  };
  const toastCtrl = {
    create: jasmine.createSpy().and.resolveTo({ present: jasmine.createSpy().and.resolveTo() }),
  };

  it('matches HIB numbers, sends OTP, completes import, and routes to KYC', async () => {
    const authService = jasmine.createSpyObj('AuthService', [
      'affiliationSync',
      'affiliationSendOtp',
      'affiliationComplete',
      'storeAffiliationSetup',
      'getAffiliationSetup',
      'clearAffiliationSetup',
    ]);
    const router = jasmine.createSpyObj('Router', ['navigateByUrl']);
    authService.getAffiliationSetup.and.returnValue(null);
    authService.affiliationSync.and.returnValue(of({
      success: true,
      message: 'Matched.',
      data: {
        verification_token: 'verification-token-123',
        household_head_chfid: 'HH001',
        member_chfid: 'M002',
        redirect_to: '/affiliation/sync',
      },
    }));
    authService.affiliationSendOtp.and.returnValue(of({
      success: true,
      message: 'OTP sent.',
      data: {
        mobile_number: '9822222222',
        expires_at: '2026-06-09T10:00:00+05:45',
      },
    }));
    authService.affiliationComplete.and.returnValue(of({
      success: true,
      message: 'Synced.',
      data: {
        token: 'mobile-token',
        redirect_to: '/kyc',
        user: {
          id: 2,
          name: 'Sita Sharma',
          mobile_number: '9822222222',
          role: 'beneficiary',
          permissions: [],
          kyc_required: true,
          kyc_submitted: false,
        },
      },
    }));

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router },
        { provide: ToastController, useValue: toastCtrl },
        { provide: LanguageService, useValue: languageService },
      ],
    });

    const page = TestBed.runInInjectionContext(() => new AffiliationSyncPage());
    page.householdHeadHibNumber = ' HH001 ';
    page.memberHibNumber = ' M002 ';

    await page.matchHousehold();
    await Promise.resolve();
    await Promise.resolve();

    expect(authService.affiliationSync).toHaveBeenCalledWith({
      household_head_hib_number: 'HH001',
      member_hib_number: 'M002',
    });
    expect(authService.storeAffiliationSetup).toHaveBeenCalledWith(jasmine.objectContaining({
      verification_token: 'verification-token-123',
    }));
    expect(page.step).toBe('phone');

    page.mobileNumber = '9822222222';
    await page.sendOtp();
    await Promise.resolve();
    await Promise.resolve();

    expect(authService.affiliationSendOtp).toHaveBeenCalledWith({
      verification_token: 'verification-token-123',
      mobile_number: '9822222222',
    });
    expect(page.step).toBe('password');

    page.otp = '123456';
    page.password = 'Password123!';
    page.passwordConfirmation = 'Password123!';
    await page.complete();
    await Promise.resolve();
    await Promise.resolve();

    expect(authService.affiliationComplete).toHaveBeenCalledWith({
      verification_token: 'verification-token-123',
      otp: '123456',
      password: 'Password123!',
      password_confirmation: 'Password123!',
      remember: true,
    });
    expect(authService.clearAffiliationSetup).toHaveBeenCalled();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/kyc', { replaceUrl: true });
  });
});
