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
import { EnrollmentService } from '../../services/enrollment.service';

@Component({
  selector: 'app-payment-result',
  standalone: true,
  imports: [
    CommonModule,
    IonContent, IonHeader, IonToolbar, IonTitle,
    IonButton, IonIcon, IonSpinner,
  ],
  templateUrl: './payment-result.page.html',
  styleUrls: ['./payment-result.page.scss'],
})
export class PaymentResultPage implements OnInit {

  status: 'success' | 'failed' | 'pending' | 'processing' = 'processing';
  referenceId = '';
  paymentType: 'new' | 'renewal' | null = null;
  enrollmentId: number | null = null;
  renewalId: number | null = null;
  errorCode = '';

  submitting = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private enrollmentSvc: EnrollmentService,
    private toastCtrl: ToastController,
  ) {
    addIcons({ checkmarkCircleOutline, closeCircleOutline, timeOutline });
  }

  ngOnInit() {
    const p = this.route.snapshot.queryParams;
    this.referenceId  = p['reference_id'] || '';
    this.paymentType  = p['type'] || null;
    this.enrollmentId = p['enrollment_id'] ? +p['enrollment_id'] : null;
    this.renewalId    = p['renewal_id'] ? +p['renewal_id'] : null;
    this.errorCode    = p['error'] || '';

    const incoming = p['status'];

    if (incoming === 'success') {
      this.handleSuccess();
    } else {
      this.status = 'failed';
    }
  }

  // ── Success flow ──────────────────────────────────────────────

  private handleSuccess() {
    if (this.paymentType === 'new' && this.enrollmentId) {
      // Submit the enrollment for verification now that payment is done
      this.submitting = true;
      this.status = 'processing';
      this.enrollmentSvc.submit(this.enrollmentId).subscribe({
        next: () => {
          this.submitting = false;
          this.status = 'success';
          this.showToast('Enrollment submitted for verification!', 'success');
        },
        error: () => {
          // Payment succeeded even if submit call failed — still show success
          this.submitting = false;
          this.status = 'success';
          this.showToast('Payment received. Enrollment is being processed.', 'success');
        },
      });
    } else {
      // Renewal or policy-only payment — nothing extra to submit
      this.status = 'success';
    }
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
    // Navigate back so user can pick a gateway and try again
    if (this.paymentType === 'renewal') {
      this.router.navigateByUrl('/tabs/renewals', { replaceUrl: true });
    } else {
      this.router.navigateByUrl('/tabs/dashboard', { replaceUrl: true });
    }
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
    const toast = await this.toastCtrl.create({ message, color, duration: 3000, position: 'top' });
    await toast.present();
  }
}
