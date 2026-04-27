import { of } from 'rxjs';
import { AuthService } from './auth.service';
import { ApiResponse } from '../interfaces/api-response.interface';
import { AuthData, PendingRegistrationData, RegisterRequest } from '../interfaces/user.interface';

describe('AuthService', () => {
  let api: jasmine.SpyObj<{ post: (...args: unknown[]) => unknown; get: (...args: unknown[]) => unknown }>;
  let service: AuthService;

  beforeEach(() => {
    api = jasmine.createSpyObj('ApiService', ['post', 'get']);
    service = new AuthService(api as any);
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
