import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular/standalone';
import { of } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { LanguageService } from '../../services/language.service';
import { TermsService } from '../../services/terms.service';
import { RenewalSearchPage } from './renewal-search.page';

describe('RenewalSearchPage', () => {
  function makePage() {
    const api = jasmine.createSpyObj('ApiService', ['post']);
    api.post.and.returnValue(of({ success: true, data: {} }));
    const router = jasmine.createSpyObj('Router', ['navigateByUrl']);
    const toast = { present: jasmine.createSpy().and.returnValue(Promise.resolve()) };
    const toastCtrl = {
      create: jasmine.createSpy().and.returnValue(Promise.resolve(toast)),
    };
    const languageService = { t: (key: string) => key };
    const termsService = {
      confirm: jasmine.createSpy('confirm').and.returnValue(Promise.resolve(true)),
    };

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        { provide: ApiService, useValue: api },
        { provide: AuthService, useValue: { getCurrentUser: () => ({ role: 'enrollment_assistant' }) } },
        { provide: Router, useValue: router },
        { provide: ToastController, useValue: toastCtrl },
        { provide: LanguageService, useValue: languageService },
        { provide: TermsService, useValue: termsService },
      ],
    });

    const page = TestBed.runInInjectionContext(() => new RenewalSearchPage());

    return { page, api, router, termsService };
  }

  it('searches and initiates renewal by household head number', async () => {
    const { page, api, router, termsService } = makePage();
    api.post.and.callFake((path: string) => {
      if (path === '/renewals/search') {
        return of({
          success: true,
          data: {
            consent_acceptance_id: 7,
            enrollment: { id: 11, household_head: { member_number: '981234567001' } },
          },
        });
      }

      return of({ success: true, data: { id: 42 } });
    });

    page.searchType = 'hib_number';
    page.searchValue = '९८१-२३४-५६७-००१';

    await page.searchPolicy();

    expect(termsService.confirm).toHaveBeenCalledOnceWith('renewal');
    expect(api.post).toHaveBeenCalledWith('/renewals/search', {
      search_type: 'hib_number',
      search_value: '९८१-२३४-५६७-००१',
      consent_accepted: true,
    });

    await page.initiateRenewal({ id: 11, household_head: { member_number: '981234567001' } });
    await Promise.resolve();
    await Promise.resolve();

    expect(api.post).toHaveBeenCalledWith('/renewals/initiate', {
      search_type: 'hib_number',
      search_value: '981234567001',
      consent_acceptance_id: 7,
    });
    expect(router.navigateByUrl).toHaveBeenCalledWith('/renewal-detail/42');
  });
});
