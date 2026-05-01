import { Component, OnInit } from '@angular/core';
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
import { ApiService } from '../../services/api.service';
import { DateService } from '../../services/date.service';
import { ApiResponse } from '../../interfaces/api-response.interface';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-my-policy',
  standalone: true,
  imports: [
    CommonModule,
    IonContent, IonHeader, IonToolbar, IonTitle, IonCard, IonCardContent,
    IonBadge, IonIcon, IonSpinner, IonRefresher, IonRefresherContent
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
    private languageService: LanguageService
  ) {
    addIcons({
      shieldCheckmarkOutline, documentTextOutline, calendarOutline,
      peopleOutline, personOutline, locationOutline, cashOutline,
      refreshOutline
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
}
