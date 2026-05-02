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
import { ApiResponse } from '../../interfaces/api-response.interface';
import { PaymentStatusResponse } from '../../interfaces/payment.interface';
import { LanguageToggleComponent } from '../../components/language-toggle/language-toggle.component';
import { LanguageService } from '../../services/language.service';

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
    IonIcon, IonSpinner, IonBadge,
    LanguageToggleComponent
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
  maxPolls = 10;
  paymentStatus: string | null = null;
  activeReferenceId: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private paymentSvc: PaymentService,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController,
    private languageService: LanguageService,
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
          if (res.data?.requires_payment === false) {
            this.paymentStatus = 'paid';
            this.navigateToResult('success', res.data.reference_id || '');
            return;
          }

          const url = res.data.redirect_url || res.data.html_content;
          const referenceId = res.data.reference_id ?? '';
          if (url && url.trim() !== '' && referenceId.length > 0) {
            await this.openGatewayUrl(url, referenceId);
          } else {
            this.showToast(this.t('payment.invalid_gateway'), 'danger');
          }
        } else {
          this.showToast(res.message || this.t('payment.initiate_failed'), 'danger');
        }
      },
      error: (err) => {
        this.loading = false;
        const gatewayErr = err?.error?.gateway_error;
        const detail = gatewayErr
          ? ' (' + (gatewayErr.detail || gatewayErr.return_url?.[0] || gatewayErr.website_url?.[0] || gatewayErr.amount?.[0] || JSON.stringify(gatewayErr)) + ')'
          : '';
        this.showToast((err?.error?.message || this.t('payment.initiation_failed')) + detail, 'danger');
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
    this.activeReferenceId = referenceId;
    this.polling = true;
    this.pollCount = 0;
    this.paymentStatus = 'checking';

    timer(2000, 3000).pipe(
      takeWhile(() => this.pollCount < this.maxPolls && this.paymentStatus === 'checking'),
      tap(() => this.pollCount++),
      switchMap(() => this.paymentSvc.getPaymentStatus(this.activeReferenceId || referenceId)),
    ).subscribe({
      next: (res: ApiResponse<PaymentStatusResponse>) => {
        if (res.success) {
          const retry = res.data.retry;
          const currentReference = this.activeReferenceId || referenceId;
          const latestReference = retry?.latest_reference_id || null;

          if (latestReference && latestReference !== currentReference) {
            this.activeReferenceId = latestReference;
            this.pollCount = 0;
            return;
          }

          const status = res.data.payment.status;
          if (status === 'paid') {
            this.paymentStatus = 'paid';
            this.polling = false;
            this.navigateToResult('success', currentReference);
          } else if (status === 'failed') {
            this.paymentStatus = 'failed';
            this.polling = false;
            this.navigateToResult('failed', currentReference, res.data.payment.failure_reason || 'verification_failed');
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
          this.navigateToResult('pending', this.activeReferenceId || referenceId, 'verification_pending');
        }
      },
    });
  }

  /**
   * Navigate to the payment-result page with all relevant context.
   */
  private navigateToResult(status: 'success' | 'failed' | 'pending', referenceId: string, errorCode = '') {
    const queryParams: Record<string, string> = {
      status,
      reference_id: referenceId,
      type: this.paymentType,
    };
    if (errorCode) queryParams['error'] = errorCode;
    if (this.policyId) queryParams['policy_id'] = String(this.policyId);
    if (this.enrollmentId) queryParams['enrollment_id'] = String(this.enrollmentId);
    if (this.renewalId)    queryParams['renewal_id']    = String(this.renewalId);

    this.router.navigate(['/payment-result'], { queryParams, replaceUrl: true });
  }

  private async showFailedAlert() {
    const alert = await this.alertCtrl.create({
      header: this.t('payment.failed'),
      message: this.t('payment.failed_alert'),
      buttons: [
        { text: this.t('common.go_back'), role: 'cancel', handler: () => this.router.navigateByUrl('/tabs/dashboard') },
        { text: this.t('common.retry'), handler: () => { this.paymentStatus = null; this.selectedGateway = null; } },
      ],
    });
    await alert.present();
  }

  private async showTimeoutAlert(referenceId: string) {
    const alert = await this.alertCtrl.create({
      header: this.t('payment.status_pending'),
      message: this.t('payment.pending_alert'),
      buttons: [
        { text: this.t('common.ok'), handler: () => this.router.navigateByUrl('/tabs/dashboard') },
        { text: this.t('common.check_again'), handler: () => this.startPolling(referenceId) },
      ],
    });
    await alert.present();
  }

  private async showToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({ message: this.languageService.translateText(message), color, duration: 3000, position: 'top' });
    await toast.present();
  }

  t(key: string): string {
    return this.languageService.t(key);
  }

  formatNumber(value: string | number | null | undefined, decimals = 0): string {
    return this.languageService.formatNumber(value, decimals);
  }

  formatCurrency(value: string | number | null | undefined, decimals = 0): string {
    return `${this.t('common.currency')} ${this.languageService.formatNumber(value ?? 0, decimals)}`;
  }
}
