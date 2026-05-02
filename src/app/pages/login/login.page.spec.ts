import { of } from 'rxjs';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { LoginPage } from './login.page';
import { AuthService } from '../../services/auth.service';
import { LanguageService } from '../../services/language.service';
import { ToastController } from '@ionic/angular/standalone';

describe('LoginPage', () => {
  const createLanguageService = () => ({
    currentLanguage: 'en',
    t: (key: string) => key,
    toggleLanguage: jasmine.createSpy().and.returnValue('ne'),
    setLocalLanguage: jasmine.createSpy().and.resolveTo(),
  });

  const createRoute = (params: Record<string, string> = {}) => ({
    queryParamMap: of(convertToParamMap(params)),
  });

  const createToastController = () => ({
    create: jasmine.createSpy().and.callFake(async () => ({
      present: jasmine.createSpy().and.resolveTo(),
    })),
  });

  const createAuthService = () => jasmine.createSpyObj('AuthService', [
    'login',
    'sendLoginSetupOtp',
    'verifyLoginSetupOtp',
    'createLoginSetupPassword',
  ]);

  const renderPage = async (params: Record<string, string> = {}) => {
    await TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: createAuthService() },
        { provide: ActivatedRoute, useValue: createRoute(params) },
        { provide: ToastController, useValue: createToastController() },
        { provide: LanguageService, useValue: createLanguageService() },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(LoginPage);
    fixture.detectChanges();

    return fixture;
  };

  it('keeps registration setup hidden on direct login', () => {
    const authService = createAuthService();
    const router = jasmine.createSpyObj('Router', ['navigateByUrl']);
    const page = new LoginPage(
      authService as any,
      router as any,
      createRoute() as any,
      createToastController() as any,
      createLanguageService() as any
    );

    expect(page.showRegistrationSetup).toBeFalse();
    expect(page.loginData.identifier).toBe('');
  });

  it('prefills mobile and shows setup from registration handoff', () => {
    const authService = createAuthService();
    const router = jasmine.createSpyObj('Router', ['navigateByUrl']);
    const page = new LoginPage(
      authService as any,
      router as any,
      createRoute({
        setup: 'registration',
        identifier_type: 'mobile',
        identifier: '9812345678',
      }) as any,
      createToastController() as any,
      createLanguageService() as any
    );

    expect(page.showRegistrationSetup).toBeTrue();
    expect(page.loginData.identifier_type).toBe('mobile');
    expect(page.loginData.identifier).toBe('9812345678');
  });

  it('sends OTP, verifies OTP, and creates password for registration setup', async () => {
    const authService = createAuthService();
    const router = jasmine.createSpyObj('Router', ['navigateByUrl']);
    router.navigateByUrl.and.resolveTo(true);
    const page = new LoginPage(
      authService as any,
      router as any,
      createRoute({
        setup: 'registration',
        identifier_type: 'mobile',
        identifier: '9812345678',
      }) as any,
      createToastController() as any,
      createLanguageService() as any
    );

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

  it('renders normal password login controls on direct login', async () => {
    const fixture = await renderPage();
    const element: HTMLElement = fixture.nativeElement;

    expect(element.querySelector('.login-btn')).not.toBeNull();
    expect(element.querySelector('.remember-row')).not.toBeNull();
    expect(element.textContent).toContain('login.password');
    expect(element.textContent).toContain('login.forgot_password');
  });

  it('hides normal password login controls during registration setup', async () => {
    const fixture = await renderPage({
      setup: 'registration',
      identifier_type: 'mobile',
      identifier: '9812345678',
    });
    const element: HTMLElement = fixture.nativeElement;

    expect(element.querySelector('.send-otp-btn')).not.toBeNull();
    expect(element.querySelector('.login-btn')).toBeNull();
    expect(element.querySelector('.remember-row')).toBeNull();
    expect(element.textContent).not.toContain('login.password');
    expect(element.textContent).not.toContain('login.forgot_password');
  });
});
