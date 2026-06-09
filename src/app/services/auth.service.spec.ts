import { of } from 'rxjs';
import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { ApiResponse } from '../interfaces/api-response.interface';
import { AffiliationCompleteData, AffiliationPasswordData, AffiliationSyncData, AuthData, PendingRegistrationData, RegisterRequest } from '../interfaces/user.interface';
import { ApiService } from './api.service';
import { LanguageService } from './language.service';

describe('AuthService', () => {
  let api: jasmine.SpyObj<{ post: (...args: unknown[]) => unknown; get: (...args: unknown[]) => unknown }>;
  let languageService: jasmine.SpyObj<{ useUserPreference: (...args: unknown[]) => void; setLanguage: (...args: unknown[]) => unknown }>;
  let service: AuthService;

  beforeEach(() => {
    TestBed.resetTestingModule();
    api = jasmine.createSpyObj('ApiService', ['post', 'get']);
    languageService = jasmine.createSpyObj('LanguageService', ['useUserPreference', 'setLanguage']);
    TestBed.configureTestingModule({
      providers: [
        { provide: ApiService, useValue: api },
        { provide: LanguageService, useValue: languageService },
      ],
    });
    service = TestBed.inject(AuthService);
  });

  it('posts beneficiary registration details to /register', (done) => {
    const payload: RegisterRequest = {
      name: 'Komal Shrestha',
      name_ne: 'कोमल श्रेष्ठ',
      mobile_number: '9812345678',
      email: 'komal@example.com',
    };

    const response: ApiResponse<PendingRegistrationData> = {
      success: true,
      message: 'Registration started successfully.',
      data: {
        registration_status: 'pending_otp',
        mobile_number: payload.mobile_number,
        email: payload.email,
      },
    };

    api.post.and.returnValue(of(response));

    service.registerBeneficiary(payload).subscribe((result) => {
      expect(result).toEqual(response);
      expect(api.post).toHaveBeenCalledWith('/register', payload);
      done();
    });
  });

  it('posts registration password setup to /register/set-password', (done) => {
    const payload = {
      mobile_number: '9812345678',
      otp: '123456',
      password: 'Password123',
      password_confirmation: 'Password123',
    };

    api.post.and.returnValue(of({
      success: true,
      message: 'Password set successfully.',
      data: {
        registration_status: 'active',
        mobile_number: payload.mobile_number,
      },
    }));

    service.setRegistrationPassword(payload).subscribe(() => {
      expect(api.post).toHaveBeenCalledWith('/register/set-password', payload);
      done();
    });
  });

  it('posts login setup OTP requests to /login/otp/send', (done) => {
    const payload = {
      identifier_type: 'mobile' as const,
      identifier: '9812345678',
    };

    api.post.and.returnValue(of({
      success: true,
      message: 'OTP sent successfully.',
      data: {
        registration_status: 'pending_otp',
        mobile_number: payload.identifier,
      },
    }));

    service.sendLoginSetupOtp(payload).subscribe(() => {
      expect(api.post).toHaveBeenCalledWith('/login/otp/send', payload);
      done();
    });
  });

  it('posts login setup password creation and stores the session', (done) => {
    const payload = {
      identifier_type: 'mobile' as const,
      identifier: '9812345678',
      otp: '123456',
      password: 'Password123',
      password_confirmation: 'Password123',
      remember: false,
    };

    const response: ApiResponse<AuthData> = {
      success: true,
      message: 'Password created successfully.',
      data: {
        token: 'token-123',
        user: {
          id: 1,
          name: 'Komal Shrestha',
          mobile_number: payload.identifier,
          preferred_language: 'ne',
          role: 'beneficiary',
          permissions: [],
        },
      },
    };

    api.post.and.returnValue(of(response));

    service.createLoginSetupPassword(payload).subscribe((result) => {
      expect(result).toEqual(response);
      expect(api.post).toHaveBeenCalledWith('/login/password/create', payload);
      expect(service.getToken()).toBe('token-123');
      expect(languageService.useUserPreference).toHaveBeenCalledWith('ne');
      done();
    });
  });

  it('posts affiliation sync details with household head and member HIB numbers', (done) => {
    const payload = {
      household_head_hib_number: 'HH001',
      member_hib_number: 'M002',
    };
    const response: ApiResponse<AffiliationSyncData> = {
      success: true,
      message: 'Legacy household matched.',
      data: {
        verification_token: 'verification-token-123',
        redirect_to: '/affiliation/sync',
        household_head_chfid: 'HH001',
        member_chfid: 'M002',
      },
    };

    api.post.and.returnValue(of(response));

    service.affiliationSync(payload).subscribe((result) => {
      expect(result).toEqual(response);
      expect(api.post).toHaveBeenCalledWith('/affiliation/sync', {
        household_head_hib_number: 'HH001',
        member_hib_number: 'M002',
      });
      done();
    });
  });

  it('posts affiliation OTP phone details', (done) => {
    const payload = {
      verification_token: 'verification-token-123',
      mobile_number: '9822222222',
    };
    const response: ApiResponse<{ mobile_number: string; expires_at?: string }> = {
      success: true,
      message: 'OTP sent successfully.',
      data: {
        mobile_number: '9822222222',
        expires_at: '2026-06-09T10:00:00+05:45',
      },
    };

    api.post.and.returnValue(of(response));

    service.affiliationSendOtp(payload).subscribe((result) => {
      expect(result).toEqual(response);
      expect(api.post).toHaveBeenCalledWith('/affiliation/otp/send', payload);
      done();
    });
  });

  it('posts affiliation completion details and stores the returned session', (done) => {
    const payload = {
      verification_token: 'verification-token-123',
      otp: '123456',
      password: 'Password123!',
      password_confirmation: 'Password123!',
      remember: false,
    };
    const response: ApiResponse<AffiliationCompleteData> = {
      success: true,
      message: 'Legacy IMIS household synced successfully.',
      data: {
        token: 'legacy-token-123',
        redirect_to: '/kyc',
        kyc_required: true,
        kyc_submitted: false,
        user: {
          id: 2,
          name: 'Sita Sharma',
          mobile_number: '9800000000',
          hib_number: 'HH001',
          preferred_language: 'en',
          role: 'beneficiary',
          permissions: [],
          kyc_required: true,
          kyc_submitted: false,
        },
      },
    };

    api.post.and.returnValue(of(response));

    service.affiliationComplete(payload).subscribe((result) => {
      expect(result).toEqual(response);
      expect(api.post).toHaveBeenCalledWith('/affiliation/complete', {
        verification_token: 'verification-token-123',
        otp: '123456',
        password: 'Password123!',
        password_confirmation: 'Password123!',
        remember: false,
      });
      expect(service.getToken()).toBe('legacy-token-123');
      expect(service.getCurrentUser()?.kyc_required).toBeTrue();
      expect(languageService.useUserPreference).toHaveBeenCalledWith('en');
      done();
    });
  });

  it('posts affiliation password setup details and stores the returned session', (done) => {
    const payload = {
      setup_token: 'setup-token-123',
      password: 'Password123!',
      password_confirmation: 'Password123!',
      remember: true,
    };
    const response: ApiResponse<AffiliationPasswordData> = {
      success: true,
      message: 'Password created successfully.',
      data: {
        token: 'password-token-123',
        redirect_to: '/kyc',
        kyc_required: true,
        kyc_submitted: false,
        user: {
          id: 2,
          name: 'Sita Sharma',
          mobile_number: '9800000000',
          hib_number: 'HH001',
          preferred_language: 'en',
          role: 'beneficiary',
          permissions: [],
          kyc_required: true,
          kyc_submitted: false,
        },
      },
    };

    api.post.and.returnValue(of(response));

    service.affiliationPassword(payload).subscribe((result) => {
      expect(result).toEqual(response);
      expect(api.post).toHaveBeenCalledWith('/affiliation/password', {
        setup_token: 'setup-token-123',
        password: 'Password123!',
        password_confirmation: 'Password123!',
        remember: true,
      });
      expect(service.getToken()).toBe('password-token-123');
      done();
    });
  });

  it('posts beneficiary email recovery to /password/email', (done) => {
    const payload = { mobile_number: '9812345678' };

    api.post.and.returnValue(of({
      success: true,
      message: 'Password reset email sent successfully.',
      data: undefined,
    }));

    service.sendPasswordResetEmail(payload).subscribe(() => {
      expect(api.post).toHaveBeenCalledWith('/password/email', payload);
      done();
    });
  });
});
