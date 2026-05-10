import { of } from 'rxjs';
import { ProfilePage } from './profile.page';

describe('ProfilePage', () => {
  const createToastController = () => ({
    create: jasmine.createSpy().and.callFake(async () => ({
      present: jasmine.createSpy().and.resolveTo(),
    })),
  });

  const createPage = () => {
    const authService = jasmine.createSpyObj('AuthService', ['getCurrentUser', 'fetchProfile']);
    const api = jasmine.createSpyObj('ApiService', ['put']);
    const dateService = jasmine.createSpyObj('DateService', ['getCurrentBs', 'formatForDisplay']);
    const router = jasmine.createSpyObj('Router', ['navigateByUrl']);
    const toastCtrl = createToastController();
    const alertCtrl = jasmine.createSpyObj('AlertController', ['create']);
    const actionSheetCtrl = jasmine.createSpyObj('ActionSheetController', ['create']);
    const languageService = {
      t: (key: string) => key,
      translateText: (value?: string) => value || '',
    };

    authService.fetchProfile.and.returnValue(of(null));
    api.put.and.returnValue(of({ success: true, message: 'Password changed successfully' }));

    const page = new ProfilePage(
      authService as any,
      api as any,
      dateService as any,
      router as any,
      toastCtrl as any,
      alertCtrl as any,
      actionSheetCtrl as any,
      languageService as any
    );

    return { page, api, toastCtrl };
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
});
