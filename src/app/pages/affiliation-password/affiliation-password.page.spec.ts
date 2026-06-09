import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular/standalone';
import { AuthService } from '../../services/auth.service';
import { LanguageService } from '../../services/language.service';
import { AffiliationPasswordPage } from './affiliation-password.page';

describe('AffiliationPasswordPage', () => {
  const languageService = {
    t: (key: string) => key,
  };
  const toastCtrl = {
    create: jasmine.createSpy().and.resolveTo({ present: jasmine.createSpy().and.resolveTo() }),
  };

  it('redirects compatibility password route back to sync', async () => {
    const authService = jasmine.createSpyObj('AuthService', ['getAffiliationSetup']);
    const router = jasmine.createSpyObj('Router', ['navigateByUrl']);

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router },
        { provide: ToastController, useValue: toastCtrl },
        { provide: LanguageService, useValue: languageService },
      ],
    });

    const page = TestBed.runInInjectionContext(() => new AffiliationPasswordPage());

    await page.createPassword();
    await Promise.resolve();
    await Promise.resolve();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/affiliation/sync', { replaceUrl: true });
  });
});
