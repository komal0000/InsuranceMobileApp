import { of } from 'rxjs';
import { PaymentResultPage } from './payment-result.page';

describe('PaymentResultPage', () => {
  function makePage(params: Record<string, string>, paymentStatus: 'pending' | 'paid' | 'failed' = 'pending') {
    const route = { snapshot: { queryParams: params } };
    const router = jasmine.createSpyObj('Router', ['navigate', 'navigateByUrl']);
    const toastCtrl = jasmine.createSpyObj('ToastController', ['create']);
    const toast = jasmine.createSpyObj('Toast', ['present']);
    toast.present.and.returnValue(Promise.resolve());
    toastCtrl.create.and.returnValue(Promise.resolve(toast));
    const languageService = {
      t: (key: string) => key,
      translateText: (value: string) => value,
    };
    const paymentService = jasmine.createSpyObj('PaymentService', ['getPaymentStatus']);
    paymentService.getPaymentStatus.and.returnValue(of({
      success: true,
      data: {
        payment: {
          status: paymentStatus,
          failure_reason: paymentStatus === 'failed' ? 'verification_failed' : null,
        },
        policy: null,
      },
    }));

    const page = new PaymentResultPage(
      route as any,
      router,
      toastCtrl,
      languageService as any,
      paymentService,
    );

    return { page, router, paymentService };
  }

  it('treats pending payment result deep links as pending, not failed', () => {
    const { page } = makePage({
      status: 'pending',
      reference_id: 'REF-PENDING',
      error: 'verification_pending',
    });

    page.ngOnInit();

    expect(page.status).toBe('pending');
    expect(page.referenceId).toBe('REF-PENDING');
    expect(page.errorCode).toBe('verification_pending');
  });

  it('refreshes a pending result and switches to success when backend reports paid', () => {
    const { page, paymentService } = makePage({
      status: 'pending',
      reference_id: 'REF-PAID',
    }, 'paid');

    page.ngOnInit();
    page.refreshStatus();

    expect(paymentService.getPaymentStatus).toHaveBeenCalledOnceWith('REF-PAID');
    expect(page.status).toBe('success');
    expect(page.errorCode).toBe('');
  });
});
