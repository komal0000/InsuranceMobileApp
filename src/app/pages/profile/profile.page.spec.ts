import { of } from 'rxjs';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ActionSheetController, AlertController, ToastController } from '@ionic/angular/standalone';
import { ProfilePage } from './profile.page';
import { DateService } from '../../services/date.service';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { LanguageService } from '../../services/language.service';

describe('ProfilePage', () => {
  const createToastController = () => ({
    create: jasmine.createSpy().and.callFake(async () => ({
      present: jasmine.createSpy().and.resolveTo(),
    })),
  });

  const createPage = (user: Record<string, unknown> | null = null) => {
    const authService = jasmine.createSpyObj('AuthService', ['getCurrentUser', 'fetchProfile']);
    const api = jasmine.createSpyObj('ApiService', ['put', 'postFormData']);
    const languageService = {
      t: (key: string) => key,
      translateText: (value?: string) => value || '',
      currentLanguage: 'en',
      localizeDigits: (value: string | number | null | undefined) => value == null ? '' : String(value),
    };
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [{ provide: LanguageService, useValue: languageService }],
    });
    const realDateService = TestBed.inject(DateService);
    const dateService = jasmine.createSpyObj('DateService', ['getCurrentBs', 'formatForDisplay', 'preparePayloadForApi']);
    const router = jasmine.createSpyObj('Router', ['navigateByUrl']);
    const toastCtrl = createToastController();
    const alertCtrl = jasmine.createSpyObj('AlertController', ['create']);
    const actionSheetCtrl = jasmine.createSpyObj('ActionSheetController', ['create']);
    authService.getCurrentUser.and.returnValue(user);
    authService.fetchProfile.and.returnValue(of(user));
    api.put.and.returnValue(of({ success: true, message: 'Password changed successfully' }));
    dateService.preparePayloadForApi.and.callFake(
      (payload: Record<string, unknown>, dateFields: string[]) => realDateService.preparePayloadForApi(payload, dateFields)
    );

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: ApiService, useValue: api },
        { provide: DateService, useValue: dateService },
        { provide: Router, useValue: router },
        { provide: ToastController, useValue: toastCtrl },
        { provide: AlertController, useValue: alertCtrl },
        { provide: ActionSheetController, useValue: actionSheetCtrl },
        { provide: LanguageService, useValue: languageService },
      ],
    });
    const page = TestBed.runInInjectionContext(() => new ProfilePage());

    return { page, api, router, toastCtrl };
  };

  it('blocks weak passwords before calling change-password API', async () => {
    const { page, api, toastCtrl } = createPage();

    page.passwordData = {
      current_password: 'Current123!',
      password: 'Password123',
      password_confirmation: 'Password123',
    };

    await page.changePassword();

    expect(api.put).not.toHaveBeenCalled();
    expect(toastCtrl.create).toHaveBeenCalledWith(jasmine.objectContaining({
      message: 'auth.password_policy',
      color: 'warning',
    }));
  });

  it('uses an image-only picker for profile photos', async () => {
    const { page } = createPage();
    const input = {
      type: '',
      accept: '',
      files: null,
      click: jasmine.createSpy('click'),
    } as unknown as HTMLInputElement;
    spyOn(document, 'createElement').and.returnValue(input);

    await page.pickImage();

    expect(input.type).toBe('file');
    expect(input.accept).toBe('image/*');
    expect(input.click).toHaveBeenCalled();
  });

  it('blocks non-Devanagari Nepali profile names before saving', async () => {
    const { page, api, toastCtrl } = createPage({
      name: 'Sita Sharma',
      name_ne: 'सीता शर्मा',
      mobile_number: '9812345678',
    });
    page.profileData = {
      name: 'Sita Sharma',
      name_ne: 'Sita Sharma',
      mobile_number: '9812345678',
    };

    await page.saveProfile();

    expect(api.put).not.toHaveBeenCalled();
    expect(toastCtrl.create).toHaveBeenCalledWith(jasmine.objectContaining({
      message: 'register.full_name_ne_format',
      color: 'warning',
    }));
  });

  it('submits profile DOB with slash-formatted BS companion date', async () => {
    const { page, api } = createPage({
      name: 'Amar Khawas',
      name_ne: 'अमर खवास',
      mobile_number: '9800000077',
    });
    page.profileData = {
      name: 'Amar Khawas',
      name_ne: 'अमर खवास',
      email: 'quick2heal@gmail.com',
      mobile_number: '9800000077',
      date_of_birth: '2054/01/15',
    };

    await page.saveProfile();

    const payload = api.put.calls.mostRecent().args[1] as Record<string, unknown>;
    expect(payload['date_of_birth']).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(payload['date_of_birth']).not.toBe('2054-01-15');
    expect(payload['date_of_birth_bs']).toBe('2054/01/15');
  });

  it('toggles profile password fields independently', () => {
    const { page } = createPage();

    expect(page.passwordInputType('current')).toBe('password');
    expect(page.passwordInputType('new')).toBe('password');
    expect(page.passwordInputType('confirmation')).toBe('password');

    page.togglePasswordVisibility('current');
    page.togglePasswordVisibility('confirmation');

    expect(page.passwordInputType('current')).toBe('text');
    expect(page.passwordInputType('new')).toBe('password');
    expect(page.passwordInputType('confirmation')).toBe('text');
  });

  it('shows the KYC shortcut only for beneficiary users', () => {
    const { page } = createPage({ role: 'beneficiary', name: 'Sunita Lama' });
    page.user = { role: 'beneficiary', name: 'Sunita Lama' } as any;

    expect(page.showKycShortcut).toBeTrue();

    page.user = { role: 'enrollment_assistant', name: 'EA User' } as any;

    expect(page.showKycShortcut).toBeFalse();
  });

  it('shows the HIB Profile shortcut only for beneficiary users', () => {
    const { page } = createPage({ role: 'beneficiary', name: 'Sunita Lama' });
    page.user = { role: 'beneficiary', name: 'Sunita Lama' } as any;

    expect(page.showHibProfileShortcut).toBeTrue();

    page.user = { role: 'enrollment_assistant', name: 'EA User' } as any;

    expect(page.showHibProfileShortcut).toBeFalse();
  });

  it('navigates to the KYC page from the profile shortcut', () => {
    const { page, router } = createPage({ role: 'beneficiary', name: 'Sunita Lama' });

    page.openKyc();

    expect(router.navigateByUrl).toHaveBeenCalledOnceWith('/kyc');
  });

  it('navigates to the HIB Profile page from the profile shortcut', () => {
    const { page, router } = createPage({ role: 'beneficiary', name: 'Sunita Lama' });

    page.openHibProfile();

    expect(router.navigateByUrl).toHaveBeenCalledOnceWith('/tabs/hib-profile');
  });
});
