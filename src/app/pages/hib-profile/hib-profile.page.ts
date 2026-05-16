import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Browser } from '@capacitor/browser';
import {
  IonBadge, IonButton, IonCard, IonCardContent, IonContent, IonHeader, IonIcon,
  IonRefresher, IonRefresherContent, IonSpinner, IonTitle, IonToolbar
} from '@ionic/angular/standalone';
import { ToastController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowForwardOutline, calendarOutline, downloadOutline, idCardOutline,
  peopleOutline, personOutline, shieldCheckmarkOutline
} from 'ionicons/icons';
import { ApiResponse } from '../../interfaces/api-response.interface';
import { EnrollmentCardHolder } from '../../interfaces/enrollment.interface';
import { LanguageToggleComponent } from '../../components/language-toggle/language-toggle.component';
import { ApiService } from '../../services/api.service';
import { DateService } from '../../services/date.service';
import { EnrollmentService } from '../../services/enrollment.service';
import { LanguageService } from '../../services/language.service';

interface HibPolicySummary {
  enrollment_id?: number | null;
  enrollment_number?: string | null;
  policy_number?: string | null;
  status?: string | null;
  total_members?: number | string | null;
  start_date?: string | null;
  start_date_bs?: string | null;
  end_date?: string | null;
  end_date_bs?: string | null;
  province?: string | null;
  district?: string | null;
  municipality?: string | null;
  ward_number?: string | number | null;
  tole_village?: string | null;
  full_address?: string | null;
}

interface MyPolicyPayload {
  policy?: HibPolicySummary | null;
  history?: unknown[];
}

@Component({
  selector: 'app-hib-profile',
  standalone: true,
  imports: [
    CommonModule,
    IonBadge, IonButton, IonCard, IonCardContent, IonContent, IonHeader, IonIcon,
    IonRefresher, IonRefresherContent, IonSpinner, IonTitle, IonToolbar,
    LanguageToggleComponent
  ],
  templateUrl: './hib-profile.page.html',
  styleUrls: ['./hib-profile.page.scss'],
})
export class HibProfilePage implements OnInit {
  policy: HibPolicySummary | null = null;
  cardHolders: EnrollmentCardHolder[] = [];
  allCardsPdfUrl: string | null = null;
  loading = true;
  cardsLoading = false;
  exportingAll = false;

  constructor(
    private api: ApiService,
    private enrollmentService: EnrollmentService,
    private dateService: DateService,
    private router: Router,
    private toastCtrl: ToastController,
    private languageService: LanguageService,
  ) {
    addIcons({
      arrowForwardOutline, calendarOutline, downloadOutline, idCardOutline,
      peopleOutline, personOutline, shieldCheckmarkOutline
    });
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.cardsLoading = false;
    this.cardHolders = [];
    this.allCardsPdfUrl = null;

    this.api.get<ApiResponse<MyPolicyPayload>>('/my-policy').subscribe({
      next: (res) => {
        const data = res.data || {};
        this.policy = data.policy || null;
        this.loading = false;

        if (this.canLoadCards) {
          this.loadCards();
        }
      },
      error: () => {
        this.policy = null;
        this.loading = false;
      },
    });
  }

  refresh(event: any): void {
    this.api.get<ApiResponse<MyPolicyPayload>>('/my-policy').subscribe({
      next: (res) => {
        const data = res.data || {};
        this.policy = data.policy || null;
        this.cardHolders = [];
        this.allCardsPdfUrl = null;

        if (this.canLoadCards) {
          this.loadCards();
        }

        event.target.complete();
      },
      error: () => event.target.complete(),
    });
  }

  get enrollmentId(): number | null {
    const id = Number(this.policy?.enrollment_id || 0);
    return id > 0 ? id : null;
  }

  get canLoadCards(): boolean {
    return this.policy?.status === 'active' && !!this.enrollmentId;
  }

  get householdHead(): EnrollmentCardHolder | null {
    return this.cardHolders.find(holder => holder.type === 'head') || null;
  }

  get familyMembers(): EnrollmentCardHolder[] {
    return this.cardHolders.filter(holder => holder.type === 'member');
  }

  openHolder(holder: EnrollmentCardHolder): void {
    this.router.navigateByUrl(`/hib-profile/member/${holder.type}/${holder.id}`);
  }

  downloadAllCards(): void {
    if (!this.enrollmentId || this.exportingAll) return;

    this.exportingAll = true;
    this.enrollmentService.getAllCardsPdfUrl(this.enrollmentId).subscribe({
      next: (res) => {
        this.exportingAll = false;
        this.openCardPdf(res.data?.card_download_url || this.allCardsPdfUrl);
      },
      error: () => {
        this.exportingAll = false;
        this.showCardError();
      },
    });
  }

  getStatusColor(status?: string | null): string {
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

  formatStatus(status?: string | null): string {
    return this.languageService.label('status', status || undefined, this.t('common.not_available'));
  }

  formatNumber(value: string | number | null | undefined): string {
    return this.languageService.formatNumber(value ?? 0, 0);
  }

  policyPeriod(): string {
    const start = this.displayDate(this.policy?.start_date, this.policy?.start_date_bs);
    const end = this.displayDate(this.policy?.end_date, this.policy?.end_date_bs);
    const period = [start, end].filter(Boolean);

    return period.length ? period.join(' - ') : this.t('common.not_available');
  }

  policyAddress(): string {
    return this.policy?.full_address
      || [this.policy?.tole_village, this.policy?.municipality, this.policy?.district]
        .filter(Boolean)
        .join(', ')
      || this.t('common.not_available');
  }

  holderInitial(holder: EnrollmentCardHolder | null | undefined): string {
    const name = (holder?.name || '').trim();
    return Array.from(name || '?')[0]?.toUpperCase() || '?';
  }

  holderDate(holder: EnrollmentCardHolder): string {
    return this.displayCardDate(holder.date_of_birth, holder.date_of_birth_bs) || this.t('common.not_available');
  }

  displayCardDate(date?: string | null, bsDate?: string | null): string {
    return bsDate
      ? this.displayDate(date, bsDate)
      : this.displayDate(null, date);
  }

  holderAddress(holder: EnrollmentCardHolder): string {
    return holder.address
      || [holder.tole_village, holder.municipality, holder.district]
        .filter(Boolean)
        .join(', ')
      || this.t('common.not_available');
  }

  holderLabel(holder: EnrollmentCardHolder): string {
    return holder.type === 'head'
      ? this.t('common.household_head')
      : this.languageService.translateText(holder.label) || holder.label || this.t('common.member');
  }

  genderLabel(value: string | null | undefined): string {
    return this.languageService.label('gender', value || undefined, this.t('common.not_available'));
  }

  displayDate(adDate?: string | null, bsDate?: string | null): string {
    return this.dateService.formatForDisplay(adDate, bsDate) || bsDate || adDate || '';
  }

  t(key: string): string {
    return this.languageService.t(key);
  }

  private loadCards(): void {
    const enrollmentId = this.enrollmentId;
    if (!enrollmentId) return;

    this.cardsLoading = true;
    this.enrollmentService.getCards(enrollmentId).subscribe({
      next: (res) => {
        const cards = res.data?.cards || [];
        this.cardHolders = [...cards].sort((a, b) => this.holderSortRank(a) - this.holderSortRank(b));
        this.allCardsPdfUrl = res.data?.all_cards_pdf_url || null;
        this.cardsLoading = false;
      },
      error: () => {
        this.cardHolders = [];
        this.cardsLoading = false;
      },
    });
  }

  private holderSortRank(holder: EnrollmentCardHolder): number {
    return holder.type === 'head' ? 0 : 1;
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
      message: this.t('hib_profile.card_open_failed'),
      duration: 2000,
      color: 'warning',
      position: 'top',
    });
    await toast.present();
  }
}
