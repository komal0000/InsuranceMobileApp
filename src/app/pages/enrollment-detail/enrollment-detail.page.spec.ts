import { EMPTY, of } from 'rxjs';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, ToastController } from '@ionic/angular/standalone';
import { EnrollmentDetailPage } from './enrollment-detail.page';
import { ApiService } from '../../services/api.service';
import { AppSyncService } from '../../services/app-sync.service';
import { AuthService } from '../../services/auth.service';
import { DateService } from '../../services/date.service';
import { EnrollmentService } from '../../services/enrollment.service';
import { LanguageService } from '../../services/language.service';
import { TermsService } from '../../services/terms.service';

describe('EnrollmentDetailPage', () => {
  function makePage() {
    const route = {
      snapshot: {
        paramMap: {
          get: () => '12',
        },
      },
    };
    const router = jasmine.createSpyObj('Router', ['navigateByUrl']);
    const api = jasmine.createSpyObj('ApiService', ['get', 'post', 'patch', 'delete']);
    api.post.and.returnValue(of({ success: true, message: 'Submitted', data: {} }));
    const enrollmentService = jasmine.createSpyObj('EnrollmentService', ['getPdfUrl', 'getAllCardsPdfUrl']);
    const syncService = { events$: EMPTY };
    const authService = { getCurrentUser: () => ({ role: 'beneficiary' }) };
    const dateService = {
      formatForDisplay: (adDate?: string | null, bsDate?: string | null) => bsDate || adDate || '',
    };
    const languageService = {
      t: (key: string) => key,
      translateText: (value?: string) => value || '',
      formatDate: (value?: string) => value || '',
      formatNumber: (value: unknown) => String(value ?? ''),
      label: (_namespace: string, value: string) => value,
    };
    const toast = { present: jasmine.createSpy().and.returnValue(Promise.resolve()) };
    const toastCtrl = {
      create: jasmine.createSpy().and.returnValue(Promise.resolve(toast)),
    };
    const alertCtrl = jasmine.createSpyObj('AlertController', ['create']);
    const termsService = {
      confirm: jasmine.createSpy('confirm').and.returnValue(Promise.resolve(true)),
    };

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        { provide: ActivatedRoute, useValue: route },
        { provide: Router, useValue: router },
        { provide: ApiService, useValue: api },
        { provide: EnrollmentService, useValue: enrollmentService },
        { provide: AppSyncService, useValue: syncService },
        { provide: AuthService, useValue: authService },
        { provide: DateService, useValue: dateService },
        { provide: LanguageService, useValue: languageService },
        { provide: ToastController, useValue: toastCtrl },
        { provide: AlertController, useValue: alertCtrl },
        { provide: TermsService, useValue: termsService },
      ],
    });
    const page = TestBed.runInInjectionContext(() => new EnrollmentDetailPage());
    page.enrollmentId = 12;

    return { page, api, toastCtrl, termsService };
  }

  it('blocks direct draft submit when enrollment terms are declined', async () => {
    const { page, api, termsService } = makePage();
    termsService.confirm.and.returnValue(Promise.resolve(false));

    await page.submitEnrollment();

    expect(api.post).not.toHaveBeenCalled();
    expect(termsService.confirm).toHaveBeenCalledOnceWith('enrollment');
  });

  it('displays submitted date when the enrollment has been submitted later', () => {
    const { page } = makePage();
    page.enrollment = {
      status: 'pending_verification',
      created_at: '2026-05-01',
      submitted_at: '2026-05-11',
      submitted_at_bs: '2083-01-28',
    } as any;

    expect(page.enrollmentDateLabel()).toBe('enrollment_detail.submitted_prefix');
    expect(page.enrollmentDisplayDate()).toBe('2083-01-28');
  });

  it('falls back to created date for draft enrollments', () => {
    const { page } = makePage();
    page.enrollment = {
      status: 'draft',
      created_at: '2026-05-01',
      submitted_at: null,
      submitted_at_bs: null,
    } as any;

    expect(page.enrollmentDateLabel()).toBe('enrollment_detail.created_prefix');
    expect(page.enrollmentDisplayDate()).toBe('2026-05-01');
  });
});
