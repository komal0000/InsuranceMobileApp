import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonCard, IonCardContent,
  IonIcon, IonRefresher, IonRefresherContent, IonSpinner, IonInput, IonButton
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  documentTextOutline, shieldCheckmarkOutline, refreshOutline,
  cashOutline, peopleOutline, alertCircleOutline, todayOutline,
  arrowForwardOutline, walletOutline, receiptOutline, searchOutline,
  personCircleOutline, idCardOutline
} from 'ionicons/icons';
import { ApiService } from '../../services/api.service';
import { AppSyncEvent, AppSyncService } from '../../services/app-sync.service';
import { AuthService } from '../../services/auth.service';
import { ApiResponse } from '../../interfaces/api-response.interface';
import { Enrollment } from '../../interfaces/enrollment.interface';
import { User } from '../../interfaces/user.interface';
import { LanguageToggleComponent } from '../../components/language-toggle/language-toggle.component';
import { DashboardDataService } from '../../services/dashboard-data.service';
import { LanguageService } from '../../services/language.service';
import {
  BeneficiaryDashboardProfile,
  BeneficiaryDashboardProfileMember,
  BeneficiaryDashboardProfilePerson,
  DashboardData,
  InsuranceCheckResult,
} from '../../interfaces/dashboard.interface';
import { isValidNidInput } from '../../utils/nid-number.util';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonContent, IonHeader, IonToolbar, IonTitle, IonCard, IonCardContent,
    IonIcon, IonRefresher, IonRefresherContent, IonSpinner, IonInput, IonButton,
    LanguageToggleComponent
  ],
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
})
export class DashboardPage implements OnInit, OnDestroy {
  user: User | null = null;
  stats: DashboardData | null = {};
  loading = true;
  isBeneficiary = true;
  isEnrollmentAssistant = false;
  canCreateEnrollment = true;
  readonly kycActionTitleKey = 'dashboard.kyc';
  readonly kycActionHelpKey = 'dashboard.kyc_help';
  insuranceCheckNid = '';
  insuranceCheckLoading = false;
  insuranceCheckMessage = '';
  insuranceCheckResult: InsuranceCheckResult | null = null;
  insuranceCheckHasError = false;
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
      arrowForwardOutline, walletOutline, receiptOutline, searchOutline,
      personCircleOutline, idCardOutline
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
          if (this.isBeneficiary && (this.stats?.active_policies ?? 0) > 0) {
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

          if (this.isBeneficiary && (this.stats?.active_policies ?? 0) > 0) {
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

  openKycDemo() { this.router.navigateByUrl('/kyc'); }

  openHibProfile() { this.router.navigateByUrl('/tabs/hib-profile'); }

  get beneficiaryProfile(): BeneficiaryDashboardProfile | null {
    return this.isBeneficiary ? this.stats?.profile ?? null : null;
  }

  get profileHead(): BeneficiaryDashboardProfilePerson | null {
    return this.beneficiaryProfile?.household_head ?? null;
  }

  get profileMembers(): BeneficiaryDashboardProfileMember[] {
    return this.beneficiaryProfile?.members ?? [];
  }

  get showInsuranceChecker(): boolean {
    return this.isBeneficiary;
  }

  checkInsurance() {
    const nid = this.insuranceCheckNid.trim();

    this.insuranceCheckResult = null;
    this.insuranceCheckHasError = false;

    if (!isValidNidInput(nid)) {
      this.insuranceCheckMessage = this.t('dashboard.insurance_check_invalid_nid');
      this.insuranceCheckHasError = true;
      return;
    }

    this.insuranceCheckLoading = true;
    this.insuranceCheckMessage = '';

    this.dashboardData.checkInsurance(nid)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.insuranceCheckLoading = false;
          this.insuranceCheckResult = res.data || null;
          this.insuranceCheckMessage = this.insuranceCheckResult?.message || res.message || '';
          this.insuranceCheckHasError = !this.insuranceCheckResult?.can_enroll;
        },
        error: (err) => {
          this.insuranceCheckLoading = false;
          this.insuranceCheckResult = null;
          this.insuranceCheckHasError = true;
          this.insuranceCheckMessage = this.errorMessage(err, 'dashboard.insurance_check_failed');
        },
      });
  }

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
    return this.languageService.label('roles', role);
  }

  formatStatus(status?: string): string {
    return this.languageService.label('status', status);
  }

  t(key: string): string {
    return this.languageService.t(key);
  }

  label(namespace: string, value: string | null | undefined, fallback?: string): string {
    return this.languageService.label(namespace, value, fallback);
  }

  formatCount(value: unknown): string {
    return this.languageService.formatNumber(Number(value ?? 0), 0);
  }

  profileInitial(name: string | null | undefined): string {
    const trimmed = (name || '').trim();
    return Array.from(trimmed || '?')[0]?.toUpperCase() || '?';
  }

  memberHibNumber(member: BeneficiaryDashboardProfileMember | null | undefined): string {
    return member?.member_number || member?.hib_number || this.t('common.not_available');
  }

  profileDate(person: BeneficiaryDashboardProfilePerson | null | undefined): string {
    return person?.date_of_birth_bs || person?.date_of_birth || this.t('common.not_available');
  }

  profileAddress(): string {
    const enrollment = this.beneficiaryProfile?.enrollment;
    if (!enrollment) return this.t('common.not_available');

    return enrollment.full_address
      || [enrollment.tole_village, enrollment.municipality, enrollment.district]
        .filter(Boolean)
        .join(', ')
      || this.t('common.not_available');
  }

  enrollmentPolicyPeriod(): string {
    const enrollment = this.beneficiaryProfile?.enrollment;
    if (!enrollment) return this.t('common.not_available');

    const start = enrollment.policy_start_date_bs || enrollment.policy_start_date;
    const end = enrollment.policy_end_date_bs || enrollment.policy_end_date;

    if (!start && !end) return this.t('common.not_available');
    return [start, end].filter(Boolean).join(' - ');
  }

  formatPolicyPeriod(result: InsuranceCheckResult | null): string {
    const summary = result?.summary;
    const period = [summary?.policy_start_date, summary?.policy_end_date].filter(Boolean);

    return period.length > 0 ? period.join(' - ') : '-';
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private canRoleCreateEnrollment(role?: string): boolean {
    return ['beneficiary', 'enrollment_assistant']
      .includes(role || '');
  }

  private errorMessage(error: any, fallbackKey: string): string {
    const validationErrors = error?.error?.errors;
    const firstValidation = validationErrors
      ? Object.values(validationErrors).reduce<string | null>((found, value) => {
          if (found) return found;
          if (typeof value === 'string') return value;
          if (Array.isArray(value)) {
            return value.find((item): item is string => typeof item === 'string') || null;
          }
          return null;
        }, null)
      : null;
    const message = firstValidation || error?.error?.message;

    return this.languageService.translateText(message) || this.t(fallbackKey);
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
