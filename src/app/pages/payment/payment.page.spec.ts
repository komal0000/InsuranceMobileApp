import { fakeAsync, tick } from '@angular/core/testing';
import { of } from 'rxjs';
import { PaymentPage } from './payment.page';

describe('PaymentPage', () => {
  function makePage(
    paymentStatus: 'pending' | 'paid' | 'failed' = 'pending',
    queryParams: Record<string, string> = { type: 'new' },
  ) {
    const route = { snapshot: { queryParams } };
    const router = jasmine.createSpyObj('Router', ['navigate', 'navigateByUrl']);
    const paymentSvc = jasmine.createSpyObj('PaymentService', ['createPayment', 'getPaymentStatus']);
    paymentSvc.createPayment.and.returnValue(of({
      success: true,
      data: {
        redirect_url: 'https://gateway.example/pay',
        reference_id: 'REF-GATEWAY',
      },
    }));
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

  it('uses the returned reference for a no-payment renewal response', async () => {
    const { page, router, paymentSvc } = makePage('pending', {
      type: 'renewal',
      renewalId: '42',
    });
    paymentSvc.createPayment.and.returnValue(of({
      success: true,
      data: {
        requires_payment: false,
        renewal_id: 42,
        reference_id: 'SUBSIDY-REF',
        payment_method: 'subsidy',
      },
    }));
    page.selectedGateway = 'khalti';

    await page.proceedToPay();

    expect(paymentSvc.createPayment).toHaveBeenCalledOnceWith('khalti', 'renewal', {
      renewal_id: 42,
    });
    expect(router.navigate).toHaveBeenCalledWith(['/payment-result'], {
      queryParams: {
        status: 'success',
        reference_id: 'SUBSIDY-REF',
        type: 'renewal',
        renewal_id: '42',
      },
      replaceUrl: true,
    });
  });
});
