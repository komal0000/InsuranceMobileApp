import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonCard, IonCardContent,
  IonBadge, IonIcon, IonSpinner, IonRefresher, IonRefresherContent
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  shieldCheckmarkOutline, documentTextOutline, calendarOutline,
  peopleOutline, personOutline, locationOutline, cashOutline,
  refreshOutline
} from 'ionicons/icons';
import { DateService } from '../../services/date.service';
import { HibPolicySummary } from '../../interfaces/policy.interface';
import { LanguageToggleComponent } from '../../components/language-toggle/language-toggle.component';
import { LanguageService } from '../../services/language.service';
import { PolicyService } from '../../services/policy.service';
import { trackByEntity } from '../../utils/track-by.util';

@Component({
  selector: 'app-my-policy',
  standalone: true,
  imports: [
    CommonModule,
    IonContent, IonHeader, IonToolbar, IonTitle, IonCard, IonCardContent,
    IonBadge, IonIcon, IonSpinner, IonRefresher, IonRefresherContent,
    LanguageToggleComponent
  ],
  templateUrl: './my-policy.page.html',
  styleUrls: ['./my-policy.page.scss'],
})
export class MyPolicyPage implements OnInit {
  readonly trackByEntity = trackByEntity;
  private policyService = inject(PolicyService);
  private dateService = inject(DateService);
  private languageService = inject(LanguageService);

  policy: HibPolicySummary | null = null;
  history: any[] = [];
  loading = true;

  constructor() {
    addIcons({
      shieldCheckmarkOutline, documentTextOutline, calendarOutline,
      peopleOutline, personOutline, locationOutline, cashOutline,
      refreshOutline
    });
  }

  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    this.policyService.getMyPolicy().subscribe({
      next: (data) => {
        this.policy = data.policy;
        this.history = data.history;
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  refresh(event: any) {
    this.policyService.getMyPolicy().subscribe({
      next: (data) => {
        this.policy = data.policy;
        this.history = data.history;
        event.target.complete();
      },
      error: () => event.target.complete(),
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
    return this.languageService.label('status', status || undefined);
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

  historyDisplayDate(historyItem: any): string {
    return this.displayDate(
      historyItem?.submitted_at_ad || historyItem?.submitted_at || historyItem?.created_at_ad || historyItem?.created_at,
      historyItem?.submitted_at_bs || historyItem?.created_at_bs,
    );
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
}
