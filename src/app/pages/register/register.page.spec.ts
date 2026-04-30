import { of } from 'rxjs';
import { RegisterPage } from './register.page';

describe('RegisterPage', () => {
  const createLanguageService = () => ({
    t: (key: string) => key,
  });

  const createToastController = () => ({
    create: jasmine.createSpy().and.callFake(async () => ({
      present: jasmine.createSpy().and.resolveTo(),
    })),
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

    const page = new RegisterPage(
      authService as any,
      router as any,
      toastCtrl as any,
      createLanguageService() as any
    );
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
});
