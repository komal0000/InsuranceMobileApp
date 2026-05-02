import { fakeAsync, tick } from '@angular/core/testing';
import { of } from 'rxjs';
import { PaymentPage } from './payment.page';

describe('PaymentPage', () => {
  function makePage(paymentStatus: 'pending' | 'paid' | 'failed' = 'pending') {
    const route = { snapshot: { queryParams: { type: 'new' } } };
    const router = jasmine.createSpyObj('Router', ['navigate', 'navigateByUrl']);
    const paymentSvc = jasmine.createSpyObj('PaymentService', ['createPayment', 'getPaymentStatus']);
    paymentSvc.getPaymentStatus.and.returnValue(of({
      success: true,
      data: {
        payment: {
          status: paymentStatus,
          failure_reason: paymentStatus === 'failed' ? 'verification_failed' : null,
        },
        policy: null,
        retry: {
          latest_reference_id: null,
        },
      },
    }));
    const toastCtrl = jasmine.createSpyObj('ToastController', ['create']);
    const alertCtrl = jasmine.createSpyObj('AlertController', ['create']);
    const languageService = {
      t: (key: string) => key,
      translateText: (value: string) => value,
      formatNumber: (value: string | number) => String(value),
    };

    const page = new PaymentPage(
      route as any,
      router,
      paymentSvc,
      toastCtrl,
      alertCtrl,
      languageService as any,
    );
    page.ngOnInit();

    return { page, router, paymentSvc };
  }

  it('routes exhausted payment polling to the pending result state', fakeAsync(() => {
    const { page, router, paymentSvc } = makePage('pending');
    page.maxPolls = 1;

    (page as any).startPolling('REF-PENDING');
    tick(2000);
    tick(3000);

    expect(paymentSvc.getPaymentStatus).toHaveBeenCalledOnceWith('REF-PENDING');
    expect(router.navigate).toHaveBeenCalledWith(['/payment-result'], {
      queryParams: {
        status: 'pending',
        reference_id: 'REF-PENDING',
        type: 'new',
        error: 'verification_pending',
      },
      replaceUrl: true,
    });
  }));
});
