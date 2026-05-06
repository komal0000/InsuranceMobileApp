import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Browser } from '@capacitor/browser';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
  IonCard, IonCardContent, IonBadge, IonIcon, IonButton, IonSpinner,
  IonImg
} from '@ionic/angular/standalone';
import { ToastController, AlertController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  locationOutline, personOutline, peopleOutline, documentOutline,
  checkmarkCircleOutline, closeCircleOutline, createOutline, trashOutline,
  shieldCheckmarkOutline, downloadOutline
} from 'ionicons/icons';
import { ApiService } from '../../services/api.service';
import { AppSyncEvent, AppSyncService } from '../../services/app-sync.service';
import { AuthService } from '../../services/auth.service';
import { DateService } from '../../services/date.service';
import { EnrollmentService } from '../../services/enrollment.service';
import { LanguageService } from '../../services/language.service';
import { ApiResponse } from '../../interfaces/api-response.interface';
import { Enrollment } from '../../interfaces/enrollment.interface';
import { LanguageToggleComponent } from '../../components/language-toggle/language-toggle.component';

@Component({
  selector: 'app-enrollment-detail',
  standalone: true,
  imports: [
    CommonModule,
    IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
    IonCard, IonCardContent, IonBadge, IonIcon, IonButton, IonSpinner,
    IonImg,
    LanguageToggleComponent
  ],
  templateUrl: './enrollment-detail.page.html',
  styleUrls: ['./enrollment-detail.page.scss'],
})
export class EnrollmentDetailPage implements OnInit, OnDestroy {
  enrollment: Enrollment | null = null;
  loading = true;
  enrollmentId!: number;
  canVerify = false;
  canApprove = false;
  canReject = false;
  private readonly destroy$ = new Subject<void>();
  private hasEnteredView = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
    private enrollmentService: EnrollmentService,
    private syncService: AppSyncService,
    private authService: AuthService,
    private dateService: DateService,
    private languageService: LanguageService,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController
  ) {
    addIcons({
      locationOutline, personOutline, peopleOutline, documentOutline,
      checkmarkCircleOutline, closeCircleOutline, createOutline, trashOutline,
      shieldCheckmarkOutline, downloadOutline
    });
  }

  ngOnInit() {
    this.enrollmentId = Number(this.route.snapshot.paramMap.get('id'));
    const user = this.authService.getCurrentUser();
    this.canVerify = ['district_eo', 'admin', 'super_admin'].includes(user?.role || '');
    this.canApprove = ['province', 'admin', 'super_admin'].includes(user?.role || '');
    this.canReject = ['district_eo', 'province', 'admin', 'super_admin'].includes(user?.role || '');
    this.loadDetail();

    this.syncService.events$
      .pipe(takeUntil(this.destroy$))
      .subscribe((event) => {
        if (this.shouldRefreshDetail(event)) {
          this.loadDetail();
        }
      });
  }

  ionViewWillEnter() {
    if (!this.hasEnteredView) {
      this.hasEnteredView = true;
      return;
    }

    this.loadDetail();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadDetail() {
    this.loading = true;
    this.api.get<ApiResponse<Enrollment>>(`/enrollments/${this.enrollmentId}`).subscribe({
      next: (res) => {
        this.enrollment = res.data;
        if ((res as any).pdf_download_url) {
          this.enrollment.pdf_download_url = (res as any).pdf_download_url;
        }
        if ((res as any).card_download_url) {
          this.enrollment.card_download_url = (res as any).card_download_url;
        }
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  editEnrollment() {
    this.router.navigateByUrl(`/enrollment-wizard/${this.enrollmentId}`);
  }

  async submitEnrollment() {
    this.api.post<ApiResponse>(`/enrollments/${this.enrollmentId}/submit`, {}).subscribe({
      next: async (res) => {
        await this.openEnrollmentPdf((res as any).pdf_download_url || (res.data as any)?.pdf_download_url || null);
        const toast = await this.toastCtrl.create({
          message: this.languageService.translateText(res.message) || this.t('enrollment_detail.submitted'),
          duration: 2000, color: 'success', position: 'top',
        });
        await toast.present();
        this.loadDetail();
      },
    });
  }

  downloadEnrollmentPdf() {
    this.enrollmentService.getPdfUrl(this.enrollmentId).subscribe({
      next: (res) => {
        const url = res.data?.pdf_download_url || null;
        if (this.enrollment) {
          this.enrollment.pdf_download_url = url;
        }
        this.openEnrollmentPdf(url);
      },
    });
  }

  downloadAllCardsPdf() {
    this.enrollmentService.getAllCardsPdfUrl(this.enrollmentId).subscribe({
      next: (res) => {
        const url = res.data?.card_download_url || null;
        if (this.enrollment) {
          this.enrollment.card_download_url = url;
        }
        this.openEnrollmentPdf(url);
      },
    });
  }

  async openEnrollmentPdf(url?: string | null) {
    if (!url) return;

    try {
      await Browser.open({ url });
    } catch {
      const toast = await this.toastCtrl.create({
        message: this.t('enrollment_detail.pdf_open_failed'),
        duration: 2000,
        color: 'warning',
        position: 'top',
      });
      await toast.present();
    }
  }

  async verifyEnrollment() {
    this.api.patch<ApiResponse>(`/enrollments/${this.enrollmentId}/verify`).subscribe({
      next: async (res) => {
        const toast = await this.toastCtrl.create({
          message: this.languageService.translateText(res.message) || this.t('enrollment_detail.verified'),
          duration: 2000, color: 'success', position: 'top',
        });
        await toast.present();
        this.loadDetail();
      },
    });
  }

  async approveEnrollment() {
    this.api.patch<ApiResponse>(`/enrollments/${this.enrollmentId}/approve`).subscribe({
      next: async (res) => {
        const toast = await this.toastCtrl.create({
          message: this.languageService.translateText(res.message) || this.t('enrollment_detail.approved'),
          duration: 2000, color: 'success', position: 'top',
        });
        await toast.present();
        this.loadDetail();
      },
    });
  }

  async rejectEnrollment() {
    const alert = await this.alertCtrl.create({
      header: this.t('enrollment_detail.reject_header'),
      inputs: [{ name: 'reason', type: 'textarea', placeholder: this.t('enrollment_detail.reject_placeholder') }],
      buttons: [
        { text: this.t('common.cancel'), role: 'cancel' },
        {
          text: this.t('enrollment_detail.reject'),
          handler: (data) => {
            this.api.patch<ApiResponse>(`/enrollments/${this.enrollmentId}/reject`, {
              rejection_reason: data.reason
            }).subscribe({
              next: async (res) => {
                const toast = await this.toastCtrl.create({
                  message: this.languageService.translateText(res.message) || this.t('enrollment_detail.rejected'),
                  duration: 2000, color: 'warning', position: 'top',
                });
                await toast.present();
                this.loadDetail();
              },
            });
          },
        },
      ],
    });
    await alert.present();
  }

  async deleteEnrollment() {
    const alert = await this.alertCtrl.create({
      header: this.t('enrollment_detail.delete_header'),
      message: this.t('enrollment_detail.delete_message'),
      buttons: [
        { text: this.t('common.cancel'), role: 'cancel' },
        {
          text: this.t('common.delete'),
          cssClass: 'danger',
          handler: () => {
            this.api.delete<ApiResponse>(`/enrollments/${this.enrollmentId}`).subscribe({
              next: async () => {
                const toast = await this.toastCtrl.create({
                  message: this.t('enrollment_detail.enrollment_deleted'),
                  duration: 2000, color: 'success', position: 'top',
                });
                await toast.present();
                this.router.navigateByUrl('/tabs/enrollments');
              },
            });
          },
        },
      ],
    });
    await alert.present();
  }

  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      draft: 'medium', pending_verification: 'warning', verified: 'tertiary',
      approved: 'success', rejected: 'danger', active: 'success', expired: 'dark',
    };
    return colors[status] || 'medium';
  }

  formatStatus(status: string): string {
    return this.languageService.label('status', status);
  }

  /**
   * Get document URL by type from a member's documents array.
   */
  getDocUrl(member: any, type: string): string | null {
    const doc = member?.documents?.find((d: any) => d.document_type === type);
    return doc?.url || null;
  }

  displayDate(adDate?: string | null, bsDate?: string | null): string {
    return this.dateService.formatForDisplay(adDate, bsDate) || '';
  }

  t(key: string): string {
    return this.languageService.t(key);
  }

  formatNumber(value: string | number | null | undefined, decimals = 0): string {
    return this.languageService.formatNumber(value, decimals);
  }

  label(namespace: string, value: string | null | undefined): string {
    return this.languageService.label(namespace, value);
  }

  private shouldRefreshDetail(event: AppSyncEvent): boolean {
    if (event.type === 'global_refresh') {
      return true;
    }

    if (event.type === 'enrollment_changed' && event.enrollmentId !== undefined) {
      return event.enrollmentId === this.enrollmentId;
    }

    return false;
  }
}
