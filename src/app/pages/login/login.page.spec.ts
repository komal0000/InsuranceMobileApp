import { BehaviorSubject, of } from 'rxjs';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { LoginPage } from './login.page';
import { AuthService } from '../../services/auth.service';
import { LanguageService } from '../../services/language.service';
import { ToastController } from '@ionic/angular/standalone';

describe('LoginPage', () => {
  const createLanguageService = () => {
    const languageSubject = new BehaviorSubject<'en' | 'ne'>('en');
    const translations: Record<'en' | 'ne', Record<string, string>> = {
      en: {
        'login.enter_mobile_number': 'Enter mobile number',
        'login.enter_hib_number': 'Enter HIB number',
      },
      ne: {
        'login.enter_mobile_number': 'मोबाइल नम्बर लेख्नुहोस्',
        'login.enter_hib_number': 'HIB नम्बर लेख्नुहोस्',
      },
    };
    const languageService = {
      currentLanguage: 'en' as 'en' | 'ne',
      languageSubject,
      language$: languageSubject.asObservable(),
      t: (key: string) => translations[languageService.currentLanguage][key] ?? key,
      toggleLanguage: jasmine.createSpy().and.callFake(() => languageService.currentLanguage === 'en' ? 'ne' : 'en'),
      setLocalLanguage: jasmine.createSpy().and.callFake(async (language: 'en' | 'ne') => {
        languageService.currentLanguage = language;
        languageSubject.next(language);
      }),
    };

    return languageService;
  };

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

  const createPage = (
    authService: unknown = createAuthService(),
    router: unknown = jasmine.createSpyObj('Router', ['navigateByUrl']),
    params: Record<string, string> = {},
    toastCtrl: unknown = createToastController(),
    languageService: unknown = createLanguageService()
  ) => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: createRoute(params) },
        { provide: ToastController, useValue: toastCtrl },
        { provide: LanguageService, useValue: languageService },
      ],
    });

    return TestBed.runInInjectionContext(() => new LoginPage());
  };

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
    const page = createPage(authService, router);

    expect(page.showRegistrationSetup).toBeFalse();
    expect(page.loginData.identifier).toBe('');
  });

  it('prefills mobile and shows setup from registration handoff', () => {
    const authService = createAuthService();
    const router = jasmine.createSpyObj('Router', ['navigateByUrl']);
    const page = createPage(authService, router, {
      setup: 'registration',
      identifier_type: 'mobile',
      identifier: '9812345678',
    });

    expect(page.showRegistrationSetup).toBeTrue();
    expect(page.loginData.identifier_type).toBe('mobile');
    expect(page.loginData.identifier).toBe('9812345678');
  });

  it('recomputes the identifier placeholder when the language changes', () => {
    const authService = createAuthService();
    const router = jasmine.createSpyObj('Router', ['navigateByUrl']);
    const languageService = createLanguageService();
    const page = createPage(authService, router, {}, createToastController(), languageService);

    expect(page.identifierPlaceholder).toBe('Enter mobile number');

    languageService.currentLanguage = 'ne';
    languageService.languageSubject.next('ne');

    expect(page.identifierPlaceholder).toBe('मोबाइल नम्बर लेख्नुहोस्');
  });

  it('sends OTP, verifies OTP, and creates password for registration setup', async () => {
    const authService = createAuthService();
    const router = jasmine.createSpyObj('Router', ['navigateByUrl']);
    router.navigateByUrl.and.resolveTo(true);
    const page = createPage(authService, router, {
      setup: 'registration',
      identifier_type: 'mobile',
      identifier: '9812345678',
    });

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

    page.setupPassword = 'Password123!';
    page.setupPasswordConfirmation = 'Password123!';
    await page.createSetupPassword();
    await Promise.resolve();
    await Promise.resolve();

    expect(authService.createLoginSetupPassword).toHaveBeenCalledWith({
      identifier_type: 'mobile',
      identifier: '9812345678',
      otp: '123456',
      password: 'Password123!',
      password_confirmation: 'Password123!',
      remember: false,
    });
    expect(router.navigateByUrl).toHaveBeenCalledWith('/tabs/dashboard', { replaceUrl: true });
  });

  it('blocks weak setup passwords before creating registration password', async () => {
    const authService = createAuthService();
    const router = jasmine.createSpyObj('Router', ['navigateByUrl']);
    const toastCtrl = createToastController();
    const page = createPage(authService, router, {
      setup: 'registration',
      identifier_type: 'mobile',
      identifier: '9812345678',
    }, toastCtrl);

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

    page.setupOtp = '123456';
    page.setupPassword = 'Password123';
    page.setupPasswordConfirmation = 'Password123';

    await page.createSetupPassword();

    expect(authService.createLoginSetupPassword).not.toHaveBeenCalled();
    expect(toastCtrl.create).toHaveBeenCalledWith(jasmine.objectContaining({
      message: 'auth.password_policy',
      color: 'warning',
    }));
  });

  it('toggles each login password field independently', () => {
    const authService = createAuthService();
    const router = jasmine.createSpyObj('Router', ['navigateByUrl']);
    const page = createPage(authService, router);

    expect(page.passwordInputType('login')).toBe('password');
    expect(page.passwordInputType('setup')).toBe('password');
    expect(page.passwordInputType('setupConfirmation')).toBe('password');

    page.togglePasswordVisibility('setup');

    expect(page.passwordInputType('login')).toBe('password');
    expect(page.passwordInputType('setup')).toBe('text');
    expect(page.passwordInputType('setupConfirmation')).toBe('password');

    page.togglePasswordVisibility('login');

    expect(page.passwordInputType('login')).toBe('text');
    expect(page.passwordInputType('setup')).toBe('text');
    expect(page.passwordInputType('setupConfirmation')).toBe('password');

  });

  it('renders normal password login controls on direct login', async () => {
    const fixture = await renderPage();
    const element: HTMLElement = fixture.nativeElement;

    expect(element.textContent).not.toContain('legacy_import.heading');
    expect(element.querySelector('.legacy-panel')).toBeNull();
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
