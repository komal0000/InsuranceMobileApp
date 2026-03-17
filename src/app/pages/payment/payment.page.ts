import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
  IonButton, IonCard, IonCardContent,
  IonIcon, IonSpinner, IonBadge
} from '@ionic/angular/standalone';
import { ToastController, AlertController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  walletOutline, cardOutline, cashOutline, checkmarkCircleOutline,
  closeCircleOutline, timeOutline, arrowForwardOutline
} from 'ionicons/icons';
import { timer, switchMap, takeWhile, tap } from 'rxjs';
import { PaymentService } from '../../services/payment.service';
import { EnrollmentService } from '../../services/enrollment.service';
import { ApiResponse } from '../../interfaces/api-response.interface';
import { PaymentStatusResponse } from '../../interfaces/payment.interface';

interface GatewayOption {
  key: 'khalti' | 'esewa' | 'ips';
  name: string;
  color: string;
  bg: string;
  icon: string;
}

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [
    CommonModule,
    IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
    IonButton, IonCard, IonCardContent,
    IonIcon, IonSpinner, IonBadge
  ],
  templateUrl: './payment.page.html',
  styleUrls: ['./payment.page.scss'],
})
export class PaymentPage implements OnInit {

  gateways: GatewayOption[] = [
    { key: 'khalti', name: 'Khalti',      color: '#5C2D91', bg: '#F3EBFF', icon: 'wallet-outline' },
    { key: 'esewa',  name: 'eSewa',        color: '#60BB46', bg: '#EEFBE7', icon: 'cash-outline' },
    { key: 'ips',    name: 'ConnectIPS',   color: '#0066B3', bg: '#E8F2FC', icon: 'card-outline' },
  ];

  selectedGateway: 'khalti' | 'esewa' | 'ips' | null = null;
  paymentType: 'new' | 'renewal' = 'new';

  // Passed via queryParams or state
  enrollmentId: number | null = null;
  policyId: number | null = null;
  renewalId: number | null = null;
  policyNumber = '';
  premiumAmount = 0;

  loading = false;
  polling = false;
  pollCount = 0;
  maxPolls = 5;
  paymentStatus: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private paymentSvc: PaymentService,
    private enrollmentSvc: EnrollmentService,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController,
  ) {
    addIcons({
      walletOutline, cardOutline, cashOutline, checkmarkCircleOutline,
      closeCircleOutline, timeOutline, arrowForwardOutline
    });
  }

  ngOnInit() {
    const params = this.route.snapshot.queryParams;
    this.enrollmentId = params['enrollmentId'] ? +params['enrollmentId'] : null;
    this.policyId     = params['policyId'] ? +params['policyId'] : null;
    this.renewalId    = params['renewalId'] ? +params['renewalId'] : null;
    this.policyNumber = params['policyNumber'] || '';
    this.premiumAmount= params['amount'] ? +params['amount'] : 0;
    this.paymentType  = (params['type'] as any) || 'new';
  }

  selectGateway(gw: GatewayOption) {
    this.selectedGateway = gw.key;
  }

  async proceedToPay() {
    if (!this.selectedGateway) return;

    this.loading = true;
    this.paymentStatus = null;

    const options: { policy_id?: number; enrollment_id?: number; renewal_id?: number } = {};
    if (this.renewalId) {
      options.renewal_id = this.renewalId;
    } else if (this.policyId) {
      options.policy_id = this.policyId;
    } else if (this.enrollmentId) {
      options.enrollment_id = this.enrollmentId;
    }

    this.paymentSvc.createPayment(this.selectedGateway, this.paymentType, options).subscribe({
      next: async (res) => {
        this.loading = false;
        if (res.success) {
          const url = res.data.redirect_url || res.data.html_content;
          if (url && url.trim() !== '') {
            await this.openGatewayUrl(url, res.data.reference_id);
          } else {
            this.showToast('Invalid gateway response.', 'danger');
          }
        } else {
          this.showToast(res.message || 'Failed to initiate payment.', 'danger');
        }
      },
      error: (err) => {
        this.loading = false;
        this.showToast(err?.error?.message || 'Payment initiation failed.', 'danger');
      },
    });
  }

  /**
   * Open the payment gateway URL in Capacitor Browser.
   * Works for all gateways — Khalti (redirect URL), eSewa (server-hosted form URL).
   * Uses browserFinished to trigger polling when the user returns.
   */
  private async openGatewayUrl(url: string, referenceId: string) {
    try {
      const { Browser } = await import('@capacitor/browser');
      const finishHandler = Browser.addListener('browserFinished', () => {
        finishHandler.then(h => h.remove());
        this.startPolling(referenceId);
      });
      await Browser.open({ url });

      setTimeout(() => {
        if (!this.polling) this.startPolling(referenceId);
      }, 10000);
    } catch {
      window.open(url, '_blank');
      this.startPolling(referenceId);
    }
  }

  /**
   * Poll the payment status up to maxPolls times.
   * When resolved, navigate to /payment-result with the appropriate params.
   */
  private startPolling(referenceId: string) {
    this.polling = true;
    this.pollCount = 0;
    this.paymentStatus = 'checking';

    timer(2000, 3000).pipe(
      takeWhile(() => this.pollCount < this.maxPolls && this.paymentStatus === 'checking'),
      tap(() => this.pollCount++),
      switchMap(() => this.paymentSvc.getPaymentStatus(referenceId)),
    ).subscribe({
      next: (res: ApiResponse<PaymentStatusResponse>) => {
        if (res.success) {
          const status = res.data.payment.status;
          if (status === 'paid') {
            this.paymentStatus = 'paid';
            this.polling = false;
            this.navigateToResult('success', referenceId);
          } else if (status === 'failed') {
            this.paymentStatus = 'failed';
            this.polling = false;
            this.navigateToResult('failed', referenceId);
          }
          // status is still 'pending' — continue polling
        }
      },
      error: () => {
        // Continue polling
      },
      complete: () => {
        this.polling = false;
        if (this.paymentStatus === 'checking') {
          // Polling exhausted without definitive result
          this.paymentStatus = 'timeout';
          this.showTimeoutAlert(referenceId);
        }
      },
    });
  }

  /**
   * Navigate to the payment-result page with all relevant context.
   */
  private navigateToResult(status: 'success' | 'failed', referenceId: string) {
    const queryParams: Record<string, string> = {
      status,
      reference_id: referenceId,
      type: this.paymentType,
    };
    if (this.enrollmentId) queryParams['enrollment_id'] = String(this.enrollmentId);
    if (this.renewalId)    queryParams['renewal_id']    = String(this.renewalId);

    this.router.navigate(['/payment-result'], { queryParams, replaceUrl: true });
  }

  private async showFailedAlert() {
    const alert = await this.alertCtrl.create({
      header: 'Payment Failed',
      message: 'The payment was not verified by the gateway. You can try again.',
      buttons: [
        { text: 'Go Back', role: 'cancel', handler: () => this.router.navigateByUrl('/tabs/dashboard') },
        { text: 'Retry', handler: () => { this.paymentStatus = null; this.selectedGateway = null; } },
      ],
    });
    await alert.present();
  }

  private async showTimeoutAlert(referenceId: string) {
    const alert = await this.alertCtrl.create({
      header: 'Payment Status Pending',
      message: 'We could not confirm your payment yet. It may take a moment. You can check again later.',
      buttons: [
        { text: 'OK', handler: () => this.router.navigateByUrl('/tabs/dashboard') },
        { text: 'Check Again', handler: () => this.startPolling(referenceId) },
      ],
    });
    await alert.present();
  }

  private async showToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({ message, color, duration: 3000, position: 'top' });
    await toast.present();
  }
}
