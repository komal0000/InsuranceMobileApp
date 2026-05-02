import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonBadge, IonSearchbar,
  IonSegment, IonSegmentButton, IonRefresher, IonRefresherContent,
  IonInfiniteScroll, IonInfiniteScrollContent, IonIcon, IonSpinner,
  IonButton
} from '@ionic/angular/standalone';
import { ToastController, AlertController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  cashOutline, checkmarkCircleOutline, closeCircleOutline,
  banOutline, shieldCheckmarkOutline, chevronForwardOutline, documentTextOutline
} from 'ionicons/icons';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { DateService } from '../../services/date.service';
import { ApiResponse, PaginatedData } from '../../interfaces/api-response.interface';
import { Subsidy } from '../../interfaces/subsidy.interface';
import { LanguageToggleComponent } from '../../components/language-toggle/language-toggle.component';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-subsidies',
  standalone: true,
  imports: [
    CommonModule, FormsModule, LanguageToggleComponent,
    IonContent, IonHeader, IonToolbar, IonTitle, IonBadge, IonSearchbar,
    IonSegment, IonSegmentButton, IonRefresher, IonRefresherContent,
    IonInfiniteScroll, IonInfiniteScrollContent, IonIcon, IonSpinner,
    IonButton
  ],
  templateUrl: './subsidies.page.html',
  styleUrls: ['./subsidies.page.scss'],
})
export class SubsidiesPage implements OnInit {
  subsidies: Subsidy[] = [];
  search = '';
  statusFilter = '';
  page = 1;
  lastPage = 1;
  loading = false;
  canManage = false;
  selectedSubsidy: Subsidy | null = null;

  constructor(
    private api: ApiService,
    private authService: AuthService,
    private dateService: DateService,
    private router: Router,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController,
    private languageService: LanguageService
  ) {
    addIcons({
      cashOutline, checkmarkCircleOutline, closeCircleOutline, banOutline,
      shieldCheckmarkOutline, chevronForwardOutline, documentTextOutline
    });
  }

  ngOnInit() {
    const user = this.authService.getCurrentUser();
    this.canManage = ['admin', 'super_admin', 'province', 'district_eo'].includes(user?.role || '');
    this.loadSubsidies();
  }

  loadSubsidies() {
    this.loading = true;
    const params: any = { page: this.page };
    if (this.statusFilter) params.status = this.statusFilter;
    if (this.search) params.search = this.search;
    this.api.get<ApiResponse<PaginatedData<Subsidy>>>('/subsidies', params).subscribe({
      next: (res) => {
        this.subsidies = this.page === 1 ? res.data.data : [...this.subsidies, ...res.data.data];
        this.lastPage = res.data.last_page;
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  onSearch() { this.page = 1; this.loadSubsidies(); }
  onFilterChange() { this.page = 1; this.loadSubsidies(); }

  refresh(event: any) {
    this.page = 1;
    this.api.get<ApiResponse<PaginatedData<Subsidy>>>('/subsidies', {
      page: 1, status: this.statusFilter, search: this.search
    }).subscribe({
      next: (res) => { this.subsidies = res.data.data; this.lastPage = res.data.last_page; event.target.complete(); },
      error: () => event.target.complete(),
    });
  }

  loadMore(event: any) {
    this.page++;
    this.loadSubsidies();
    event.target.complete();
  }

  viewDetail(subsidy: Subsidy) {
    this.api.get<ApiResponse<Subsidy>>(`/subsidies/${subsidy.id}`).subscribe({
      next: (res) => { this.selectedSubsidy = res.data; },
    });
  }

  async approveSubsidy(s: Subsidy) {
    this.api.patch<ApiResponse>(`/subsidies/${s.id}/approve`).subscribe({
      next: async (res) => {
        const toast = await this.toastCtrl.create({ message: this.t('subsidies.approved_message'), duration: 2000, color: 'success', position: 'top' });
        await toast.present();
        this.selectedSubsidy = null;
        this.page = 1;
        this.loadSubsidies();
      },
    });
  }

  async rejectSubsidy(s: Subsidy) {
    const alert = await this.alertCtrl.create({
      header: this.t('subsidies.reject_header'),
      inputs: [{ name: 'reason', type: 'textarea', placeholder: this.t('subsidies.rejection_reason') }],
      buttons: [
        { text: this.t('common.cancel'), role: 'cancel' },
        {
          text: this.t('subsidies.reject'),
          handler: (data) => {
            this.api.patch<ApiResponse>(`/subsidies/${s.id}/reject`, { reason: data.reason }).subscribe({
              next: async () => {
                const toast = await this.toastCtrl.create({ message: this.t('subsidies.rejected_message'), duration: 2000, color: 'warning', position: 'top' });
                await toast.present();
                this.selectedSubsidy = null;
                this.page = 1;
                this.loadSubsidies();
              },
            });
          },
        },
      ],
    });
    await alert.present();
  }

  async revokeSubsidy(s: Subsidy) {
    const alert = await this.alertCtrl.create({
      header: this.t('subsidies.revoke_header'),
      inputs: [{ name: 'reason', type: 'textarea', placeholder: this.t('subsidies.revocation_reason') }],
      buttons: [
        { text: this.t('common.cancel'), role: 'cancel' },
        {
          text: this.t('subsidies.revoke'),
          handler: (data) => {
            this.api.patch<ApiResponse>(`/subsidies/${s.id}/revoke`, { reason: data.reason }).subscribe({
              next: async () => {
                const toast = await this.toastCtrl.create({ message: this.t('subsidies.revoked_message'), duration: 2000, color: 'danger', position: 'top' });
                await toast.present();
                this.selectedSubsidy = null;
                this.page = 1;
                this.loadSubsidies();
              },
            });
          },
        },
      ],
    });
    await alert.present();
  }

  getStatusColor(status: string): string {
    const map: Record<string, string> = {
      pending: 'warning', approved: 'success', rejected: 'danger', revoked: 'dark',
    };
    return map[status] || 'medium';
  }

  formatStatus(s: string): string {
    return this.languageService.label('status', s);
  }

  formatBenefitType(type: string): string {
    return this.languageService.label('benefit', type);
  }

  displayDate(adDate?: string | null, bsDate?: string | null): string {
    return this.dateService.formatForDisplay(adDate, bsDate) || '';
  }

  displayDateTime(adDate?: string | null, bsDate?: string | null): string {
    return this.dateService.formatDateTimeForDisplay(adDate, bsDate) || '';
  }

  t(key: string): string {
    return this.languageService.t(key);
  }

  formatNumber(value: string | number | null | undefined, decimals = 0): string {
    return this.languageService.formatNumber(value, decimals);
  }

  formatCurrency(value: string | number | null | undefined, decimals = 2): string {
    return `${this.t('common.currency')} ${this.languageService.formatNumber(value ?? 0, decimals)}`;
  }
}
