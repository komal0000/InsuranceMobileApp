import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonCard, IonCardContent,
  IonIcon, IonRefresher, IonRefresherContent, IonSpinner
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  documentTextOutline, shieldCheckmarkOutline, refreshOutline,
  cashOutline, peopleOutline, alertCircleOutline, todayOutline,
  arrowForwardOutline, walletOutline, receiptOutline
} from 'ionicons/icons';
import { ApiService } from '../../services/api.service';
import { AppSyncEvent, AppSyncService } from '../../services/app-sync.service';
import { AuthService } from '../../services/auth.service';
import { ApiResponse } from '../../interfaces/api-response.interface';
import { Enrollment } from '../../interfaces/enrollment.interface';
import { User } from '../../interfaces/user.interface';
import { DashboardDataService } from '../../services/dashboard-data.service';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    IonContent, IonHeader, IonToolbar, IonTitle, IonCard, IonCardContent,
    IonIcon, IonRefresher, IonRefresherContent, IonSpinner
  ],
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
})
export class DashboardPage implements OnInit, OnDestroy {
  user: User | null = null;
  stats: any = {};
  loading = true;
  isBeneficiary = true;
  isEnrollmentAssistant = false;
  canCreateEnrollment = true;
  private readonly destroy$ = new Subject<void>();
  private dashboardRequestId = 0;

  constructor(
    private api: ApiService,
    private authService: AuthService,
    private router: Router,
    private syncService: AppSyncService,
    private dashboardData: DashboardDataService,
    private languageService: LanguageService
  ) {
    addIcons({
      documentTextOutline, shieldCheckmarkOutline, refreshOutline,
      cashOutline, peopleOutline, alertCircleOutline, todayOutline,
      arrowForwardOutline, walletOutline, receiptOutline
    });
  }

  ngOnInit() {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe((user) => {
        this.user = user;
        this.isBeneficiary = user?.role === 'beneficiary';
        this.isEnrollmentAssistant = user?.role === 'enrollment_assistant';
        this.canCreateEnrollment = this.canRoleCreateEnrollment(user?.role);

        if (!user) {
          this.dashboardRequestId++;
          this.stats = {};
          this.loading = false;
          this.dashboardData.clear();
          return;
        }

        this.loadDashboard();
      });

    this.syncService.events$
      .pipe(takeUntil(this.destroy$))
      .subscribe((event) => {
        if (this.shouldRefreshDashboard(event) && this.user) {
          this.loadDashboard(true);
        }
      });
  }

  loadDashboard(forceRefresh = false) {
    if (!this.user) {
      this.loading = false;
      this.stats = {};
      return;
    }

    this.loading = true;
    const requestId = ++this.dashboardRequestId;
    const baseCanCreateEnrollment = this.canRoleCreateEnrollment(this.user.role);

    this.dashboardData.getDashboard(forceRefresh)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (requestId !== this.dashboardRequestId) {
            return;
          }

          this.stats = res.data || {};
          this.loading = false;
          this.canCreateEnrollment = baseCanCreateEnrollment;

          // Hide "New Enrollment" only when the beneficiary has an active policy.
          if (this.isBeneficiary && (this.stats.active_policies ?? 0) > 0) {
            this.canCreateEnrollment = false;
          }
        },
        error: () => {
          if (requestId !== this.dashboardRequestId) {
            return;
          }

          this.loading = false;
          this.canCreateEnrollment = baseCanCreateEnrollment;
        },
      });
  }

  refresh(event: any) {
    if (!this.user) {
      event.target.complete();
      return;
    }

    const requestId = ++this.dashboardRequestId;
    const baseCanCreateEnrollment = this.canRoleCreateEnrollment(this.user.role);

    this.dashboardData.getDashboard(true)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (requestId !== this.dashboardRequestId) {
            event.target.complete();
            return;
          }

          this.stats = res.data || {};
          this.canCreateEnrollment = baseCanCreateEnrollment;

          if (this.isBeneficiary && (this.stats.active_policies ?? 0) > 0) {
            this.canCreateEnrollment = false;
          }

          event.target.complete();
        },
        error: () => {
          if (requestId !== this.dashboardRequestId) {
            event.target.complete();
            return;
          }

          this.canCreateEnrollment = baseCanCreateEnrollment;
          event.target.complete();
        },
      });
  }

  navigate(path: string) { this.router.navigateByUrl(path); }

  createNewEnrollment() {
    this.api.post<ApiResponse<Enrollment>>('/enrollments', { enrollment_type: 'new' }).subscribe({
      next: (res) => {
        if (res.success && res.data?.id) {
          this.router.navigateByUrl(`/enrollment-wizard/${res.data.id}`);
        }
      },
      error: (err) => console.error('Failed to create enrollment', err),
    });
  }

  formatRole(role?: string): string {
    return (role || '').replace(/_/g, ' ');
  }

  t(key: string): string {
    return this.languageService.t(key);
  }

  formatCount(value: unknown): string {
    return this.languageService.formatNumber(Number(value ?? 0), 0);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private canRoleCreateEnrollment(role?: string): boolean {
    return ['beneficiary', 'enrollment_assistant']
      .includes(role || '');
  }

  private shouldRefreshDashboard(event: AppSyncEvent): boolean {
    return [
      'global_refresh',
      'enrollment_changed',
      'renewal_changed',
      'dashboard_changed',
      'tabs_visibility_changed',
    ].includes(event.type);
  }
}
