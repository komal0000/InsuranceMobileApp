import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import {
  IonContent, IonHeader, IonToolbar, IonTitle,
  IonBadge, IonSearchbar, IonSegment, IonSegmentButton,
  IonRefresher, IonRefresherContent, IonInfiniteScroll,
  IonInfiniteScrollContent, IonFab, IonFabButton, IonIcon,
  IonSpinner, IonCard, IonCardContent, IonButton
} from '@ionic/angular/standalone';
import { ToastController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addOutline, documentTextOutline, locationOutline, peopleOutline, personOutline, informationCircleOutline } from 'ionicons/icons';
import { ApiService } from '../../services/api.service';
import { AppSyncEvent, AppSyncService } from '../../services/app-sync.service';
import { AuthService } from '../../services/auth.service';
import { DateService } from '../../services/date.service';
import { ApiResponse, PaginatedData } from '../../interfaces/api-response.interface';
import { Enrollment, EnrollmentStatus } from '../../interfaces/enrollment.interface';

@Component({
  selector: 'app-enrollments',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonContent, IonHeader, IonToolbar, IonTitle,
    IonBadge, IonSearchbar, IonSegment, IonSegmentButton,
    IonRefresher, IonRefresherContent, IonInfiniteScroll,
    IonInfiniteScrollContent, IonFab, IonFabButton, IonIcon,
    IonSpinner, IonCard, IonCardContent, IonButton
  ],
  templateUrl: './enrollments.page.html',
  styleUrls: ['./enrollments.page.scss'],
})
export class EnrollmentsPage implements OnInit, OnDestroy {
  enrollments: Enrollment[] = [];
  search = '';
  statusFilter = '';
  page = 1;
  lastPage = 1;
  loading = false;
  canCreate = true;
  isBeneficiary = false;
  private readonly destroy$ = new Subject<void>();
  private hasEnteredView = false;

  constructor(
    private api: ApiService,
    private syncService: AppSyncService,
    private authService: AuthService,
    private dateService: DateService,
    private router: Router,
    private toastCtrl: ToastController
  ) {
    addIcons({ addOutline, documentTextOutline, informationCircleOutline });
  }

  ngOnInit() {
    const user = this.authService.getCurrentUser();
    this.isBeneficiary = user?.role === 'beneficiary';
    this.canCreate = ['beneficiary', 'enrollment_assistant', 'admin', 'super_admin']
      .includes(user?.role || '');
    this.loadEnrollments();

    this.syncService.events$
      .pipe(takeUntil(this.destroy$))
      .subscribe((event) => {
        if (this.shouldRefreshEnrollments(event)) {
          this.reloadFirstPage();
        }
      });
  }

  ionViewWillEnter() {
    if (!this.hasEnteredView) {
      this.hasEnteredView = true;
      return;
    }

    this.reloadFirstPage();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadEnrollments(append = false) {
    this.loading = true;
    const params: any = { page: this.page, per_page: 15 };
    if (this.statusFilter) params.status = this.statusFilter;
    if (this.search) params.search = this.search;

    this.api.get<ApiResponse<PaginatedData<Enrollment>>>('/enrollments', params).subscribe({
      next: (res) => {
        const paginated = res.data;
        if (append) {
          this.enrollments = [...this.enrollments, ...paginated.data];
        } else {
          this.enrollments = paginated.data;
        }
        this.lastPage = paginated.last_page;
        this.loading = false;
        // Beneficiary can only have one enrollment
        if (this.isBeneficiary && this.enrollments.length > 0) {
          this.canCreate = false;
        }
      },
      error: () => { this.loading = false; },
    });
  }

  onSearch() {
    this.page = 1;
    this.loadEnrollments();
  }

  onFilterChange() {
    this.page = 1;
    this.loadEnrollments();
  }

  refresh(event: any) {
    this.page = 1;
    this.api.get<ApiResponse<PaginatedData<Enrollment>>>('/enrollments', {
      page: 1, per_page: 15,
      status: this.statusFilter, search: this.search
    }).subscribe({
      next: (res) => {
        this.enrollments = res.data.data;
        this.lastPage = res.data.last_page;
        event.target.complete();
      },
      error: () => event.target.complete(),
    });
  }

  loadMore(event: any) {
    this.page++;
    this.api.get<ApiResponse<PaginatedData<Enrollment>>>('/enrollments', {
      page: this.page, per_page: 15,
      status: this.statusFilter, search: this.search
    }).subscribe({
      next: (res) => {
        this.enrollments = [...this.enrollments, ...res.data.data];
        this.lastPage = res.data.last_page;
        event.target.complete();
      },
      error: () => event.target.complete(),
    });
  }

  viewDetail(enrollment: Enrollment) {
    this.router.navigateByUrl(`/enrollment-detail/${enrollment.id}`);
  }

  continueEnrollment(enrollment: Enrollment, event: Event) {
    event.stopPropagation();
    this.router.navigateByUrl(`/enrollment-wizard/${enrollment.id}`);
  }

  async createNew() {
    this.api.post<ApiResponse<Enrollment>>('/enrollments', { enrollment_type: 'new' }).subscribe({
      next: (res) => {
        if (res.success) {
          this.router.navigateByUrl(`/enrollment-wizard/${res.data.id}`);
        }
      },
      error: async (err) => {
        const msg = err?.error?.message || 'Failed to create enrollment.';
        const t = await this.toastCtrl.create({ message: msg, duration: 3000, color: 'danger', position: 'top' });
        await t.present();
      },
    });
  }

  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      draft: 'medium',
      pending_verification: 'warning',
      verified: 'tertiary',
      approved: 'success',
      rejected: 'danger',
      active: 'success',
      expired: 'dark',
    };
    return colors[status] || 'medium';
  }

  formatStatus(status: string): string {
    return (status || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  displayDate(adDate?: string | null, bsDate?: string | null): string {
    return this.dateService.formatForDisplay(adDate, bsDate) || '';
  }

  private reloadFirstPage(): void {
    this.page = 1;
    this.loadEnrollments();
  }

  private shouldRefreshEnrollments(event: AppSyncEvent): boolean {
    return [
      'global_refresh',
      'enrollment_changed',
      'dashboard_changed',
      'tabs_visibility_changed',
    ].includes(event.type);
  }
}
