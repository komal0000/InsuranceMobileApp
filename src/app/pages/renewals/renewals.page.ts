import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonBadge, IonSearchbar,
  IonSegment, IonSegmentButton, IonRefresher, IonRefresherContent,
  IonInfiniteScroll, IonInfiniteScrollContent, IonFab, IonFabButton,
  IonIcon, IonSpinner, IonCard, IonCardContent, IonButton, IonButtons
} from '@ionic/angular/standalone';
import { ToastController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { searchOutline, refreshOutline, personOutline, peopleOutline, locationOutline, arrowForwardOutline } from 'ionicons/icons';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { ApiResponse, PaginatedData } from '../../interfaces/api-response.interface';
import { Renewal } from '../../interfaces/renewal.interface';

@Component({
  selector: 'app-renewals',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonContent, IonHeader, IonToolbar, IonTitle, IonBadge, IonSearchbar,
    IonSegment, IonSegmentButton, IonRefresher, IonRefresherContent,
    IonInfiniteScroll, IonInfiniteScrollContent, IonFab, IonFabButton,
    IonIcon, IonSpinner, IonCard, IonCardContent, IonButton, IonButtons
  ],
  templateUrl: './renewals.page.html',
  styleUrls: ['./renewals.page.scss'],
})
export class RenewalsPage implements OnInit {
  renewals: Renewal[] = [];
  search = '';
  statusFilter = '';
  page = 1;
  lastPage = 1;
  loading = false;
  isBeneficiary = false;
  enrollment: any = null;
  enrollmentLoading = false;
  initiating = false;

  constructor(
    private api: ApiService,
    private authService: AuthService,
    private router: Router,
    private toastCtrl: ToastController
  ) {
    addIcons({ searchOutline, refreshOutline, personOutline, peopleOutline, locationOutline, arrowForwardOutline });
  }

  ngOnInit() {
    const user = this.authService.getCurrentUser();
    this.isBeneficiary = user?.role === 'beneficiary';
    if (this.isBeneficiary) {
      this.loadBeneficiaryEnrollment();
    } else {
      this.loadRenewals();
    }
  }

  loadBeneficiaryEnrollment() {
    this.enrollmentLoading = true;
    this.api.get<ApiResponse<PaginatedData<any>>>('/enrollments', { per_page: 1 }).subscribe({
      next: (res) => {
        const items = res.data?.data ?? [];
        this.enrollment = items.length > 0 ? items[0] : null;
        this.enrollmentLoading = false;
        // Also load any existing renewals for this enrollment
        this.loadRenewals();
      },
      error: () => { this.enrollmentLoading = false; },
    });
  }

  initiateRenewal() {
    if (!this.enrollment) return;
    this.initiating = true;
    this.api.post<ApiResponse<any>>('/renewals/initiate', { enrollment_id: this.enrollment.id }).subscribe({
      next: async (res) => {
        this.initiating = false;
        if (res.success) {
          const toast = await this.toastCtrl.create({
            message: 'Renewal initiated', duration: 1500, color: 'success', position: 'top',
          });
          await toast.present();
          this.router.navigateByUrl(`/renewal-detail/${res.data.id}`);
        }
      },
      error: async (err) => {
        this.initiating = false;
        const msg = err?.error?.message || 'Failed to initiate renewal';
        const toast = await this.toastCtrl.create({ message: msg, duration: 3000, color: 'danger', position: 'top' });
        await toast.present();
      },
    });
  }

  loadRenewals() {
    this.loading = true;
    const params: any = { page: this.page };
    if (this.statusFilter) params.status = this.statusFilter;
    if (this.search) params.search = this.search;
    this.api.get<ApiResponse<PaginatedData<Renewal>>>('/renewals', params).subscribe({
      next: (res) => {
        const items = res.data?.data ?? [];
        this.renewals = this.page === 1 ? items : [...this.renewals, ...items];
        this.lastPage = res.data?.last_page ?? 1;
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  onSearch() { this.page = 1; this.loadRenewals(); }
  onFilterChange() { this.page = 1; this.loadRenewals(); }

  refresh(event: any) {
    this.page = 1;
    this.api.get<ApiResponse<PaginatedData<Renewal>>>('/renewals', {
      page: 1, status: this.statusFilter, search: this.search
    }).subscribe({
      next: (res) => { this.renewals = res.data?.data ?? []; this.lastPage = res.data?.last_page ?? 1; event.target.complete(); },
      error: () => event.target.complete(),
    });
  }

  loadMore(event: any) {
    this.page++;
    this.api.get<ApiResponse<PaginatedData<Renewal>>>('/renewals', {
      page: this.page, status: this.statusFilter, search: this.search
    }).subscribe({
      next: (res) => { this.renewals = [...this.renewals, ...(res.data?.data ?? [])]; event.target.complete(); },
      error: () => event.target.complete(),
    });
  }

  viewDetail(renewal: Renewal) { this.router.navigateByUrl(`/renewal-detail/${renewal.id}`); }
  goToSearch() { this.router.navigateByUrl('/renewal-search'); }

  getStatusColor(status: string): string {
    const map: Record<string, string> = {
      eligible: 'tertiary', draft: 'medium', pending_payment: 'warning',
      pending: 'warning', pending_verification: 'warning',
      verified: 'tertiary', approved: 'success', completed: 'success',
      rejected: 'danger',
    };
    return map[status] || 'medium';
  }

  formatStatus(s: string): string {
    return (s || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }
}
