import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Browser } from '@capacitor/browser';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonCard, IonCardContent,
  IonBadge, IonButton, IonIcon, IonSpinner, IonRefresher, IonRefresherContent
} from '@ionic/angular/standalone';
import { ToastController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  shieldCheckmarkOutline, documentTextOutline, calendarOutline,
  peopleOutline, personOutline, locationOutline, cashOutline,
  refreshOutline, downloadOutline
} from 'ionicons/icons';
import { ApiService } from '../../services/api.service';
import { DateService } from '../../services/date.service';
import { EnrollmentService } from '../../services/enrollment.service';
import { ApiResponse } from '../../interfaces/api-response.interface';
import { LanguageToggleComponent } from '../../components/language-toggle/language-toggle.component';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-my-policy',
  standalone: true,
  imports: [
    CommonModule,
    IonContent, IonHeader, IonToolbar, IonTitle, IonCard, IonCardContent,
    IonBadge, IonButton, IonIcon, IonSpinner, IonRefresher, IonRefresherContent,
    LanguageToggleComponent
  ],
  templateUrl: './my-policy.page.html',
  styleUrls: ['./my-policy.page.scss'],
})
export class MyPolicyPage implements OnInit {
  policy: any = null;
  history: any[] = [];
  loading = true;

  constructor(
    private api: ApiService,
    private dateService: DateService,
    private enrollmentService: EnrollmentService,
    private toastCtrl: ToastController,
    private languageService: LanguageService
  ) {
    addIcons({
      shieldCheckmarkOutline, documentTextOutline, calendarOutline,
      peopleOutline, personOutline, locationOutline, cashOutline,
      refreshOutline, downloadOutline
    });
  }

  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    this.api.get<ApiResponse>('/my-policy').subscribe({
      next: (res) => {
        const data = res.data || {};
        this.policy = data.policy || null;
        this.history = data.history || [];
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  refresh(event: any) {
    this.api.get<ApiResponse>('/my-policy').subscribe({
      next: (res) => {
        const data = res.data || {};
        this.policy = data.policy || null;
        this.history = data.history || [];
        event.target.complete();
      },
      error: () => event.target.complete(),
    });
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'active': return 'success';
      case 'approved': return 'primary';
      case 'pending_payment': return 'warning';
      case 'verified': return 'tertiary';
      case 'rejected': return 'danger';
      case 'expired': return 'dark';
      default: return 'medium';
    }
  }

  formatStatus(status: string): string {
    return this.languageService.label('status', status);
  }

  get daysRemaining(): number | null {
    if (!this.policy?.end_date) return null;
    const endAd = this.policy?.end_date_ad || this.dateService.toApiDate(this.policy.end_date);
    if (!endAd) return null;
    const end = new Date(`${endAd}T00:00:00`);
    const now = new Date();
    return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }

  displayDate(adDate?: string | null, bsDate?: string | null): string {
    return this.dateService.formatForDisplay(adDate, bsDate) || '';
  }

  t(key: string): string {
    return this.languageService.t(key);
  }

  label(namespace: string, value: string | null | undefined, fallback?: string): string {
    return this.languageService.label(namespace, value, fallback);
  }

  formatNumber(value: string | number | null | undefined, decimals = 0): string {
    return this.languageService.formatNumber(value, decimals);
  }

  formatCurrency(value: string | number | null | undefined, decimals = 2): string {
    return `${this.t('common.currency')} ${this.languageService.formatNumber(value ?? 0, decimals)}`;
  }

  languageText(value: string | null | undefined): string {
    return this.languageService.translateText(value);
  }

  formatPaymentMethod(value: string | null | undefined): string {
    if (value === 'subsidy') {
      return this.t('payment.subsidy_method');
    }

    return this.languageText(value ? value.replace(/_/g, ' ') : '');
  }

  get canExportCards(): boolean {
    return this.policy?.status === 'active' && !!this.policy?.enrollment_id;
  }

  downloadAllCards(): void {
    if (!this.canExportCards) return;

    this.enrollmentService.getAllCardsPdfUrl(this.policy.enrollment_id).subscribe({
      next: (res) => this.openCardPdf(res.data?.card_download_url || this.policy?.all_cards_pdf_url || null),
      error: () => this.showCardError(),
    });
  }

  downloadHeadCard(): void {
    if (!this.canExportCards) return;

    this.enrollmentService.getHeadCardPdfUrl(this.policy.enrollment_id).subscribe({
      next: (res) => this.openCardPdf(res.data?.card_download_url || this.policy?.household_head?.card_pdf_url || null),
      error: () => this.showCardError(),
    });
  }

  downloadMemberCard(memberId: number): void {
    if (!this.canExportCards) return;

    this.enrollmentService.getMemberCardPdfUrl(this.policy.enrollment_id, memberId).subscribe({
      next: (res) => this.openCardPdf(res.data?.card_download_url || null),
      error: () => this.showCardError(),
    });
  }

  private async openCardPdf(url?: string | null): Promise<void> {
    if (!url) {
      await this.showCardError();
      return;
    }

    try {
      await Browser.open({ url });
    } catch {
      await this.showCardError();
    }
  }

  private async showCardError(): Promise<void> {
    const toast = await this.toastCtrl.create({
      message: this.t('policy.card_open_failed'),
      duration: 2000,
      color: 'warning',
      position: 'top',
    });
    await toast.present();
  }
}
