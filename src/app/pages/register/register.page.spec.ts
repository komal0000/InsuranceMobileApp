import { of } from 'rxjs';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular/standalone';
import { RegisterPage } from './register.page';
import { AuthService } from '../../services/auth.service';
import { LanguageService } from '../../services/language.service';

describe('RegisterPage', () => {
  const createLanguageService = () => ({
    currentLanguage: 'en',
    t: (key: string) => key,
    toggleLanguage: jasmine.createSpy().and.returnValue('ne'),
    setLocalLanguage: jasmine.createSpy().and.resolveTo(),
  });

  const createToastController = () => ({
    create: jasmine.createSpy().and.callFake(async () => ({
      present: jasmine.createSpy().and.resolveTo(),
    })),
  });

  const createPage = (
    authService: unknown,
    router: unknown,
    toastCtrl: unknown,
    languageService: unknown = createLanguageService()
  ) => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router },
        { provide: ToastController, useValue: toastCtrl },
        { provide: LanguageService, useValue: languageService },
      ],
    });

    return TestBed.runInInjectionContext(() => new RegisterPage());
  };

  it('toggles the local language using the next language', () => {
    const authService = jasmine.createSpyObj('AuthService', ['registerBeneficiary']);
    const router = jasmine.createSpyObj('Router', ['navigate']);
    const toastCtrl = createToastController();
    const languageService = createLanguageService();

    const page = createPage(authService, router, toastCtrl, languageService);

    const toggleLang = (page as any).toggleLang;
    expect(toggleLang).toEqual(jasmine.any(Function));
    if (typeof toggleLang === 'function') {
      toggleLang.call(page);
    }

    expect(languageService.toggleLanguage).toHaveBeenCalled();
    expect(languageService.setLocalLanguage).toHaveBeenCalledWith('ne');
  });

  it('submits beneficiary details and navigates to login setup', async () => {
    const authService = jasmine.createSpyObj('AuthService', ['registerBeneficiary']);
    const router = jasmine.createSpyObj('Router', ['navigate']);
    router.navigate.and.resolveTo(true);
    const toastCtrl = createToastController();

    authService.registerBeneficiary.and.returnValue(of({
      success: true,
      message: 'Registration started successfully.',
      data: {
        registration_status: 'pending_otp',
        mobile_number: '9812345678',
        email: 'komal@example.com',
      },
    }));

    const page = createPage(authService, router, toastCtrl);
    page.formData = {
      name: 'Komal Shrestha',
      name_ne: 'कोमल श्रेष्ठ',
      mobile_number: '9812345678',
      email: 'komal@example.com',
    };

    await page.register();
    await Promise.resolve();
    await Promise.resolve();

    expect(authService.registerBeneficiary).toHaveBeenCalledWith(page.formData);
    expect(router.navigate).toHaveBeenCalledWith(['/login'], {
      replaceUrl: true,
      queryParams: {
        identifier_type: 'mobile',
        identifier: '9812345678',
        setup: 'registration',
      },
    });
  });

  it('blocks single-word English names before registration submit', async () => {
    const authService = jasmine.createSpyObj('AuthService', ['registerBeneficiary']);
    const router = jasmine.createSpyObj('Router', ['navigate']);
    const toastCtrl = createToastController();

    authService.registerBeneficiary.and.returnValue(of({
      success: true,
      message: 'Registration started successfully.',
      data: {
        registration_status: 'pending_otp',
        mobile_number: '9812345678',
      },
    }));

    const page = createPage(authService, router, toastCtrl);
    page.formData = {
      name: 'Komal',
      name_ne: 'कोमल श्रेष्ठ',
      mobile_number: '9812345678',
      email: '',
    };

    await page.register();

    expect(authService.registerBeneficiary).not.toHaveBeenCalled();
    expect(toastCtrl.create).toHaveBeenCalledWith(jasmine.objectContaining({
      message: 'register.full_name_format',
      color: 'warning',
    }));
  });

  it('blocks non-Devanagari Nepali names before registration submit', async () => {
    const authService = jasmine.createSpyObj('AuthService', ['registerBeneficiary']);
    const router = jasmine.createSpyObj('Router', ['navigate']);
    const toastCtrl = createToastController();

    authService.registerBeneficiary.and.returnValue(of({
      success: true,
      message: 'Registration started successfully.',
      data: {
        registration_status: 'pending_otp',
        mobile_number: '9812345678',
      },
    }));

    const page = createPage(authService, router, toastCtrl);
    page.formData = {
      name: 'Komal Shrestha',
      name_ne: 'Komal Shrestha',
      mobile_number: '9812345678',
      email: '',
    };

    await page.register();

    expect(authService.registerBeneficiary).not.toHaveBeenCalled();
    expect(toastCtrl.create).toHaveBeenCalledWith(jasmine.objectContaining({
      message: 'register.full_name_ne_format',
      color: 'warning',
    }));
  });
});
