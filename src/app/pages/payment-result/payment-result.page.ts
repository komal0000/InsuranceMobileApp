import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonContent, IonHeader, IonToolbar, IonTitle,
  IonButton, IonIcon, IonSpinner,
} from '@ionic/angular/standalone';
import { ToastController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  checkmarkCircleOutline, closeCircleOutline, timeOutline,
} from 'ionicons/icons';
import { LanguageToggleComponent } from '../../components/language-toggle/language-toggle.component';
import { LanguageService } from '../../services/language.service';
import { PaymentService } from '../../services/payment.service';

@Component({
  selector: 'app-payment-result',
  standalone: true,
  imports: [
    CommonModule,
    IonContent, IonHeader, IonToolbar, IonTitle,
    IonButton, IonIcon, IonSpinner,
    LanguageToggleComponent
  ],
  templateUrl: './payment-result.page.html',
  styleUrls: ['./payment-result.page.scss'],
})
export class PaymentResultPage implements OnInit {

  status: 'success' | 'failed' | 'pending' | 'processing' = 'processing';
  referenceId = '';
  paymentType: 'new' | 'renewal' | null = null;
  policyId: number | null = null;
  enrollmentId: number | null = null;
  renewalId: number | null = null;
  errorCode = '';
  checkingStatus = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private toastCtrl: ToastController,
    private languageService: LanguageService,
    private paymentService: PaymentService,
  ) {
    addIcons({ checkmarkCircleOutline, closeCircleOutline, timeOutline });
  }

  ngOnInit() {
    const p = this.route.snapshot.queryParams;
    this.referenceId  = p['reference_id'] || '';
    this.paymentType  = p['type'] || null;
    this.policyId     = p['policy_id'] ? +p['policy_id'] : null;
    this.enrollmentId = p['enrollment_id'] ? +p['enrollment_id'] : null;
    this.renewalId    = p['renewal_id'] ? +p['renewal_id'] : null;
    this.errorCode    = p['error'] || '';

    const incoming = p['status'];

    if (incoming === 'success') {
      this.handleSuccess();
    } else if (incoming === 'pending') {
      this.status = 'pending';
    } else {
      this.status = 'failed';
    }
  }

  // ── Success flow ──────────────────────────────────────────────

  private handleSuccess() {
    this.status = 'success';
  }

  // ── Navigation ────────────────────────────────────────────────

  goToDashboard() {
    this.router.navigateByUrl('/tabs/dashboard', { replaceUrl: true });
  }

  goToRenewals() {
    this.router.navigateByUrl('/tabs/renewals', { replaceUrl: true });
  }

  goToPolicy() {
    this.router.navigateByUrl('/tabs/my-policy', { replaceUrl: true });
  }

  retryPayment() {
    const queryParams: Record<string, string> = {
      type: this.paymentType ?? 'new',
    };

    if (this.policyId) queryParams['policyId'] = String(this.policyId);
    if (this.enrollmentId) queryParams['enrollmentId'] = String(this.enrollmentId);
    if (this.renewalId) queryParams['renewalId'] = String(this.renewalId);

    if (this.policyId || this.enrollmentId || this.renewalId) {
      this.router.navigate(['/payment'], { queryParams, replaceUrl: true });
      return;
    }

    this.router.navigateByUrl('/tabs/dashboard', { replaceUrl: true });
  }

  // ── Helpers ───────────────────────────────────────────────────

  get primaryAction(): 'dashboard' | 'renewals' | 'policy' {
    if (this.paymentType === 'new') return 'dashboard';
    if (this.paymentType === 'renewal') return 'renewals';
    return 'policy';
  }

  continue() {
    if (this.primaryAction === 'renewals') this.goToRenewals();
    else if (this.primaryAction === 'dashboard') this.goToDashboard();
    else this.goToPolicy();
  }

  private async showToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({ message: this.languageService.translateText(message), color, duration: 3000, position: 'top' });
    await toast.present();
  }

  refreshStatus() {
    if (!this.referenceId || this.checkingStatus) return;

    this.checkingStatus = true;
    this.paymentService.getPaymentStatus(this.referenceId).subscribe({
      next: (res) => {
        if (res.success) {
          const status = res.data.payment.status;
          if (status === 'paid') {
            this.status = 'success';
            this.errorCode = '';
          } else if (status === 'failed') {
            this.status = 'failed';
            this.errorCode = res.data.payment.failure_reason || 'verification_failed';
          } else {
            this.status = 'pending';
            this.showToast(this.t('payment_result.still_pending'), 'warning');
          }
        }
      },
      error: () => this.showToast(this.t('payment.pending_alert'), 'warning'),
      complete: () => {
        this.checkingStatus = false;
      },
    });
  }

  t(key: string): string {
    return this.languageService.t(key);
  }
}
