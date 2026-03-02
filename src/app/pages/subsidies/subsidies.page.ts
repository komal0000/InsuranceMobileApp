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
import { ApiResponse, PaginatedData } from '../../interfaces/api-response.interface';
import { Subsidy } from '../../interfaces/subsidy.interface';

@Component({
  selector: 'app-subsidies',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
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
    private router: Router,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController
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
        const toast = await this.toastCtrl.create({ message: 'Subsidy approved', duration: 2000, color: 'success', position: 'top' });
        await toast.present();
        this.selectedSubsidy = null;
        this.page = 1;
        this.loadSubsidies();
      },
    });
  }

  async rejectSubsidy(s: Subsidy) {
    const alert = await this.alertCtrl.create({
      header: 'Reject Subsidy',
      inputs: [{ name: 'reason', type: 'textarea', placeholder: 'Rejection reason' }],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Reject',
          handler: (data) => {
            this.api.patch<ApiResponse>(`/subsidies/${s.id}/reject`, { reason: data.reason }).subscribe({
              next: async () => {
                const toast = await this.toastCtrl.create({ message: 'Subsidy rejected', duration: 2000, color: 'warning', position: 'top' });
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
      header: 'Revoke Subsidy',
      inputs: [{ name: 'reason', type: 'textarea', placeholder: 'Revocation reason' }],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Revoke',
          handler: (data) => {
            this.api.patch<ApiResponse>(`/subsidies/${s.id}/revoke`, { reason: data.reason }).subscribe({
              next: async () => {
                const toast = await this.toastCtrl.create({ message: 'Subsidy revoked', duration: 2000, color: 'danger', position: 'top' });
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
    return (s || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }
}
