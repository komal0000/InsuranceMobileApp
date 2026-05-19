import { EMPTY, of } from 'rxjs';
import { EnrollmentDetailPage } from './enrollment-detail.page';

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

    const page = new EnrollmentDetailPage(
      route as any,
      router,
      api,
      enrollmentService,
      syncService as any,
      authService as any,
      dateService as any,
      languageService as any,
      toastCtrl as any,
      alertCtrl as any,
    );
    page.enrollmentId = 12;

    return { page, api, toastCtrl };
  }

  it('requires consent before direct draft submit', async () => {
    const { page, api, toastCtrl } = makePage();
    (page as any).consentAccepted = false;

    await page.submitEnrollment();

    expect(api.post).not.toHaveBeenCalled();
    expect(toastCtrl.create).toHaveBeenCalledWith(jasmine.objectContaining({
      message: 'consent.required',
      color: 'warning',
    }));
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
