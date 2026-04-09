import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonBadge, IonSearchbar,
  IonSegment, IonSegmentButton, IonRefresher, IonRefresherContent,
  IonInfiniteScroll, IonInfiniteScrollContent, IonFab, IonFabButton,
  IonIcon, IonSpinner, IonCard, IonCardContent, IonButton, IonButtons,
  IonInput, IonItem, IonSelect, IonSelectOption, IonToggle, IonLabel
} from '@ionic/angular/standalone';
import { ToastController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  searchOutline, refreshOutline, personOutline, peopleOutline, locationOutline,
  arrowForwardOutline, callOutline, cardOutline, calendarOutline, addOutline,
  shieldCheckmarkOutline, cashOutline, maleFemaleOutline, ribbonOutline,
  informationCircleOutline, cameraOutline, documentTextOutline
} from 'ionicons/icons';
import { ApiService } from '../../services/api.service';
import { AppSyncEvent, AppSyncService } from '../../services/app-sync.service';
import { AuthService } from '../../services/auth.service';
import { DateService } from '../../services/date.service';
import { ApiResponse, PaginatedData } from '../../interfaces/api-response.interface';
import { Renewal } from '../../interfaces/renewal.interface';
import { BsDatePickerComponent } from '../../components/bs-date-picker/bs-date-picker.component';

const DEFAULT_MEMBER_RELATIONSHIPS: Array<{ value: string; label: string }> = [
  { value: 'spouse', label: 'Spouse' },
  { value: 'son', label: 'Son' },
  { value: 'daughter', label: 'Daughter' },
  { value: 'father', label: 'Father' },
  { value: 'mother', label: 'Mother' },
  { value: 'brother', label: 'Brother' },
  { value: 'sister', label: 'Sister' },
  { value: 'grandfather', label: 'Grandfather' },
  { value: 'grandmother', label: 'Grandmother' },
  { value: 'grandson', label: 'Grandson' },
  { value: 'granddaughter', label: 'Granddaughter' },
  { value: 'father_in_law', label: 'Father In Law' },
  { value: 'mother_in_law', label: 'Mother In Law' },
  { value: 'son_in_law', label: 'Son In Law' },
  { value: 'daughter_in_law', label: 'Daughter In Law' },
  { value: 'other', label: 'Other' },
];

const SINGLE_HEAD_BLOCKED_RELATIONSHIPS = ['spouse', 'son', 'daughter'];

@Component({
  selector: 'app-renewals',
  standalone: true,
  imports: [
    CommonModule, FormsModule, BsDatePickerComponent,
    IonContent, IonHeader, IonToolbar, IonTitle, IonBadge, IonSearchbar,
    IonSegment, IonSegmentButton, IonRefresher, IonRefresherContent,
    IonInfiniteScroll, IonInfiniteScrollContent, IonFab, IonFabButton,
    IonIcon, IonSpinner, IonCard, IonCardContent, IonButton, IonButtons,
    IonInput, IonItem, IonSelect, IonSelectOption, IonToggle, IonLabel
  ],
  templateUrl: './renewals.page.html',
  styleUrls: ['./renewals.page.scss'],
})
export class RenewalsPage implements OnInit, OnDestroy {
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
  subsidySummary: any = null;

  // Add member form
  showMemberForm = false;
  newMember: any = {};
  savingMember = false;
  relationshipOptions: Array<{ value: string; label: string }> = [...DEFAULT_MEMBER_RELATIONSHIPS];

  // Image previews for new member form
  memberPhotoPreview: string | null = null;
  memberCitizenshipFrontPreview: string | null = null;
  memberCitizenshipBackPreview: string | null = null;
  memberBirthCertFrontPreview: string | null = null;
  memberBirthCertBackPreview: string | null = null;
  memberTargetGroupFrontPreview: string | null = null;
  memberTargetGroupBackPreview: string | null = null;
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
    addIcons({
      searchOutline, refreshOutline, personOutline, peopleOutline, locationOutline,
      arrowForwardOutline, callOutline, cardOutline, calendarOutline, addOutline,
      shieldCheckmarkOutline, cashOutline, maleFemaleOutline, ribbonOutline,
      informationCircleOutline, cameraOutline, documentTextOutline
    });
  }

  ngOnInit() {
    this.loadRelationshipOptions();

    const user = this.authService.getCurrentUser();
    this.isBeneficiary = user?.role === 'beneficiary';
    if (this.isBeneficiary) {
      this.loadBeneficiaryEnrollment();
    } else {
      this.loadRenewals();
    }

    this.syncService.events$
      .pipe(takeUntil(this.destroy$))
      .subscribe((event) => {
        if (this.shouldRefreshRenewals(event)) {
          this.refreshCurrentView();
        }
      });
  }

  ionViewWillEnter() {
    if (!this.hasEnteredView) {
      this.hasEnteredView = true;
      return;
    }

    this.refreshCurrentView();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadBeneficiaryEnrollment() {
    this.enrollmentLoading = true;
    // First get enrollment ID from list
    this.api.get<ApiResponse<PaginatedData<any>>>('/enrollments', { per_page: 1 }).subscribe({
      next: (res) => {
        const items = res.data?.data ?? [];
        if (items.length > 0) {
          // Load full enrollment detail with documents + subsidy info
          this.api.get<any>(`/enrollments/${items[0].id}`).subscribe({
            next: (detailRes: any) => {
              this.enrollment = detailRes.data;
              this.subsidySummary = detailRes.subsidy_summary ?? null;
              this.enrollmentLoading = false;
              this.loadRenewals();
            },
            error: () => {
              this.enrollment = items[0];
              this.enrollmentLoading = false;
              this.loadRenewals();
            },
          });
        } else {
          this.enrollment = null;
          this.enrollmentLoading = false;
        }
      },
      error: () => { this.enrollmentLoading = false; },
    });
  }

  get headPhotoUrl(): string | null {
    const head = this.enrollment?.household_head;
    if (!head) return null;
    // 1. MemberDocument photo
    const doc = head.documents?.find((d: any) => d.document_type === 'photo');
    if (doc?.url) return doc.url;
    // 2. Profile image from user account
    if (head.profile_image_url) return head.profile_image_url;
    // 3. Legacy photo field
    if (head.photo) return head.photo;
    return null;
  }

  getMemberPhotoUrl(member: any): string | null {
    if (!member) return null;
    // 1. MemberDocument photo
    const doc = member.documents?.find((d: any) => d.document_type === 'photo');
    if (doc?.url) return doc.url;
    // 2. Legacy photo field
    if (member.photo) return member.photo;
    return null;
  }

  get displayPremium(): number {
    if (this.subsidySummary?.is_subsidized) {
      return this.subsidySummary.final_premium;
    }
    return this.enrollment?.premium_amount ?? 0;
  }

  get extraMemberCharge(): number {
    const totalMembers = (this.enrollment?.family_members?.length ?? 0) + 1; // +1 for head
    if (totalMembers > 5) {
      return (totalMembers - 5) * 700;
    }
    return 0;
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

  // Add new member directly from renewal tab
  showAddMemberForm() {
    const currentBs = this.dateService.getCurrentBs();
    this.newMember = {
      first_name: '', middle_name: '', last_name: '',
      first_name_ne: '', middle_name_ne: '', last_name_ne: '',
      gender: '', date_of_birth: currentBs, relationship: '',
      blood_group: '', marital_status: '',
      mobile_number: '',
      document_type: 'citizenship',
      citizenship_number: '', citizenship_issue_date: currentBs, citizenship_issue_district: '',
      birth_certificate_number: '', birth_certificate_issue_date: currentBs,
      is_target_group: false, target_group_type: '', target_group_id_number: '',
    };
    this.memberPhotoPreview = null;
    this.memberCitizenshipFrontPreview = null;
    this.memberCitizenshipBackPreview = null;
    this.memberBirthCertFrontPreview = null;
    this.memberBirthCertBackPreview = null;
    this.memberTargetGroupFrontPreview = null;
    this.memberTargetGroupBackPreview = null;
    this.showMemberForm = true;
  }

  async captureRenewalMemberImage(
    field: 'photo' | 'citizenship_front_image' | 'citizenship_back_image' |
           'birth_certificate_front_image' | 'birth_certificate_back_image' |
           'target_group_front_image' | 'target_group_back_image'
  ) {
    try {
      const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');
      const image = await Camera.getPhoto({
        quality: 80, allowEditing: false, resultType: CameraResultType.DataUrl,
        source: CameraSource.Prompt, width: 1024,
      });
      if (image.dataUrl) this.applyRenewalMemberImage(field, this.dataUrlToBlob(image.dataUrl), image.dataUrl);
    } catch {
      this.fallbackRenewalMemberFileInput(field);
    }
  }

  private fallbackRenewalMemberFileInput(field: string) {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'image/jpg,image/jpeg,image/png';
    input.onchange = (event: any) => {
      const file: File = event.target.files[0];
      if (!file) return;
      if (file.size > 2 * 1024 * 1024) {
        this.toastCtrl.create({ message: 'Image must be less than 2MB.', duration: 2000, color: 'danger', position: 'top' }).then(t => t.present());
        return;
      }
      const reader = new FileReader();
      reader.onload = () => this.applyRenewalMemberImage(field as any, file, reader.result as string);
      reader.readAsDataURL(file);
    };
    input.click();
  }

  private applyRenewalMemberImage(field: string, blob: Blob, dataUrl: string) {
    this.newMember[field] = blob;
    if (field === 'photo') this.memberPhotoPreview = dataUrl;
    else if (field === 'citizenship_front_image') this.memberCitizenshipFrontPreview = dataUrl;
    else if (field === 'citizenship_back_image') this.memberCitizenshipBackPreview = dataUrl;
    else if (field === 'birth_certificate_front_image') this.memberBirthCertFrontPreview = dataUrl;
    else if (field === 'birth_certificate_back_image') this.memberBirthCertBackPreview = dataUrl;
    else if (field === 'target_group_front_image') this.memberTargetGroupFrontPreview = dataUrl;
    else if (field === 'target_group_back_image') this.memberTargetGroupBackPreview = dataUrl;
  }

  private dataUrlToBlob(dataUrl: string): Blob {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)![1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new Blob([u8arr], { type: mime });
  }

  async addNewMember() {
    if (!this.enrollment) return;
    const m = this.newMember;
    if (!m.first_name || !m.last_name || !m.gender || !m.date_of_birth || !m.relationship) {
      this.toastCtrl.create({ message: 'Please fill all required fields.', duration: 2000, color: 'warning', position: 'top' }).then(t => t.present());
      return;
    }

    const relationship = this.normalizeKey(m.relationship);
    if (!relationship || !this.availableMemberRelationshipOptions.some(option => option.value === relationship)) {
      this.toastCtrl.create({ message: 'Please select a valid relationship.', duration: 2000, color: 'warning', position: 'top' }).then(t => t.present());
      return;
    }
    if (this.isHeadSingle && SINGLE_HEAD_BLOCKED_RELATIONSHIPS.includes(relationship)) {
      this.toastCtrl.create({ message: 'Spouse, son, and daughter relationships are not allowed when household head marital status is single.', duration: 2500, color: 'warning', position: 'top' }).then(t => t.present());
      return;
    }
    m.relationship = relationship;
    if (m.marital_status) {
      m.marital_status = this.normalizeKey(m.marital_status);
    }

    if (m.mobile_number && !/^\d{10}$/.test(m.mobile_number)) {
      this.toastCtrl.create({ message: 'Mobile number must be exactly 10 digits.', duration: 2000, color: 'warning', position: 'top' }).then(t => t.present());
      return;
    }
    const docType = m.document_type || 'citizenship';
    if (docType === 'citizenship' && this.dateService.calculateAge(m.date_of_birth, 'bs') < 16) {
      this.toastCtrl.create({ message: 'Member with citizenship must be at least 16 years old.', duration: 2500, color: 'warning', position: 'top' }).then(t => t.present());
      return;
    }

    // Build FormData so images can be uploaded
    const fd = new FormData();
    Object.keys(m).forEach(key => {
      const val = m[key];
      if (val === null || val === undefined || val === '') return;
      if (typeof val === 'boolean') { fd.append(key, val ? '1' : '0'); return; }
      if (val instanceof Blob) { fd.append(key, val, `${key}.jpg`); return; }
      fd.append(key, String(val));
    });

    this.savingMember = true;
    const prepared = this.dateService.prepareFormDataForApi(fd, [
      'date_of_birth',
      'citizenship_issue_date',
      'birth_certificate_issue_date',
    ]);

    // For approved enrollments the policy isn't active yet — add directly to enrollment,
    // bypassing the renewal eligibility check which requires active/expired status.
    if (this.enrollment.status === 'approved') {
      this.api.postFormData<ApiResponse>(`/enrollments/${this.enrollment.id}/members`, prepared).subscribe({
        next: async (res) => {
          this.savingMember = false;
          if (res.success) {
            this.showMemberForm = false;
            this.loadBeneficiaryEnrollment();
            const toast = await this.toastCtrl.create({ message: 'Member added — pending verification.', duration: 2500, color: 'success', position: 'top' });
            await toast.present();
          }
        },
        error: async (err) => {
          this.savingMember = false;
          const toast = await this.toastCtrl.create({ message: err?.error?.message || 'Failed to add member', duration: 2500, color: 'danger', position: 'top' });
          await toast.present();
        },
      });
      return;
    }

    const addToRenewal = (renewalId: number) =>
      this.api.postFormData<ApiResponse>(`/renewals/${renewalId}/members`, prepared);

    const activeRenewal = this.renewals.find(r => ['eligible', 'draft'].includes(r.status));
    if (activeRenewal) {
      addToRenewal(activeRenewal.id).subscribe({
        next: async (res) => {
          this.savingMember = false;
          if (res.success) {
            this.showMemberForm = false;
            this.loadBeneficiaryEnrollment();
            const toast = await this.toastCtrl.create({ message: 'Member added — pending verification.', duration: 2500, color: 'success', position: 'top' });
            await toast.present();
          }
        },
        error: async (err) => {
          this.savingMember = false;
          const toast = await this.toastCtrl.create({ message: err?.error?.message || 'Failed to add member', duration: 2500, color: 'danger', position: 'top' });
          await toast.present();
        },
      });
    } else {
      this.api.post<ApiResponse<any>>('/renewals/initiate', { enrollment_id: this.enrollment.id }).subscribe({
        next: (res) => {
          if (res.success) {
            addToRenewal(res.data.id).subscribe({
              next: async () => {
                this.savingMember = false;
                this.showMemberForm = false;
                this.loadBeneficiaryEnrollment();
                const toast = await this.toastCtrl.create({ message: 'Member added — pending verification.', duration: 2500, color: 'success', position: 'top' });
                await toast.present();
                this.router.navigateByUrl(`/renewal-detail/${res.data.id}`);
              },
              error: async () => {
                this.savingMember = false;
                const toast = await this.toastCtrl.create({ message: 'Renewal started but failed to add member', duration: 2500, color: 'warning', position: 'top' });
                await toast.present();
                this.router.navigateByUrl(`/renewal-detail/${res.data.id}`);
              },
            });
          }
        },
        error: async (err) => {
          this.savingMember = false;
          const msg = err?.error?.message || 'Failed to initiate renewal';
          const toast = await this.toastCtrl.create({ message: msg, duration: 3000, color: 'danger', position: 'top' });
          await toast.present();
        },
      });
    }
  }

  loadRenewals() {
    this.loading = true;
    const params: any = { page: this.page };
    if (this.statusFilter) params.status = this.statusFilter;
    if (this.search) params.search = this.search;
    this.api.get<ApiResponse<any>>('/renewals', params).subscribe({
      next: (res) => {
        const raw = res.data?.renewals ?? res.data;
        const items = raw?.data ?? [];
        this.renewals = this.page === 1 ? items : [...this.renewals, ...items];
        this.lastPage = raw?.last_page ?? 1;
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  onSearch() { this.page = 1; this.loadRenewals(); }
  onFilterChange() { this.page = 1; this.loadRenewals(); }

  refresh(event: any) {
    this.page = 1;
    if (this.isBeneficiary) {
      this.api.get<ApiResponse<PaginatedData<any>>>('/enrollments', { per_page: 1 }).subscribe({
        next: (res) => {
          const items = res.data?.data ?? [];
          if (items.length > 0) {
            this.api.get<any>(`/enrollments/${items[0].id}`).subscribe({
              next: (detailRes: any) => {
                this.enrollment = detailRes.data;
                this.subsidySummary = detailRes.subsidy_summary ?? null;
                this.loadRenewals();
                event.target.complete();
              },
              error: () => { event.target.complete(); },
            });
          } else {
            event.target.complete();
          }
        },
        error: () => event.target.complete(),
      });
    } else {
      this.api.get<ApiResponse<any>>('/renewals', {
        page: 1, status: this.statusFilter, search: this.search
      }).subscribe({
        next: (res) => {
          const raw = res.data?.renewals ?? res.data;
          this.renewals = raw?.data ?? [];
          this.lastPage = raw?.last_page ?? 1;
          event.target.complete();
        },
        error: () => event.target.complete(),
      });
    }
  }

  loadMore(event: any) {
    this.page++;
    this.api.get<ApiResponse<any>>('/renewals', {
      page: this.page, status: this.statusFilter, search: this.search
    }).subscribe({
      next: (res) => {
        const raw = res.data?.renewals ?? res.data;
        this.renewals = [...this.renewals, ...(raw?.data ?? [])];
        event.target.complete();
      },
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
      rejected: 'danger', active: 'success', expired: 'danger',
    };
    return map[status] || 'medium';
  }

  formatStatus(s: string): string {
    return (s || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  getMemberStatusColor(status: string): string {
    const map: Record<string, string> = {
      pending_verification: 'warning',
      verified: 'tertiary',
      approved: 'success',
      rejected: 'danger',
    };
    return map[status] || 'medium';
  }

  formatMemberStatus(status: string): string {
    const map: Record<string, string> = {
      pending_verification: 'Pending Verification',
      verified: 'Verified - Awaiting Approval',
      rejected: 'Rejected',
    };
    return map[status] || status;
  }

  get isHeadSingle(): boolean {
    return this.normalizeKey(this.enrollment?.household_head?.marital_status) === 'single';
  }

  get availableMemberRelationshipOptions(): Array<{ value: string; label: string }> {
    if (!this.isHeadSingle) {
      return this.relationshipOptions;
    }

    return this.relationshipOptions.filter(option => !SINGLE_HEAD_BLOCKED_RELATIONSHIPS.includes(option.value));
  }

  private loadRelationshipOptions() {
    this.api.get<ApiResponse<any>>('/enrollment-config').subscribe({
      next: (res) => {
        this.relationshipOptions = this.buildRelationshipOptions(res?.data?.relationship_types);
      },
    });
  }

  private buildRelationshipOptions(raw: unknown): Array<{ value: string; label: string }> {
    if (Array.isArray(raw)) {
      const options = raw
        .map(item => this.normalizeKey(item))
        .filter((value): value is string => value.length > 0 && value !== 'self')
        .map(value => ({ value, label: this.formatStatus(value) }));
      return this.dedupeRelationshipOptions(options);
    }

    if (raw && typeof raw === 'object') {
      const options = Object.entries(raw as Record<string, unknown>)
        .map(([key, label]) => {
          const value = this.normalizeKey(key);
          if (!value || value === 'self') return null;
          const labelText = typeof label === 'string' && label.trim().length > 0
            ? label.trim()
            : this.formatStatus(value);
          return { value, label: labelText };
        })
        .filter((option): option is { value: string; label: string } => option !== null);
      return this.dedupeRelationshipOptions(options);
    }

    return [...DEFAULT_MEMBER_RELATIONSHIPS];
  }

  private dedupeRelationshipOptions(options: Array<{ value: string; label: string }>): Array<{ value: string; label: string }> {
    if (!options.length) {
      return [...DEFAULT_MEMBER_RELATIONSHIPS];
    }

    const seen = new Set<string>();
    const deduped: Array<{ value: string; label: string }> = [];
    for (const option of options) {
      if (seen.has(option.value)) {
        continue;
      }

      seen.add(option.value);
      deduped.push(option);
    }

    return deduped;
  }

  private normalizeKey(value: unknown): string {
    if (typeof value !== 'string') {
      return '';
    }

    return value.trim().toLowerCase().replace(/[\s-]+/g, '_');
  }

  displayDate(adDate?: string | null, bsDate?: string | null): string {
    return this.dateService.formatForDisplay(adDate, bsDate) || '';
  }

  private refreshCurrentView(): void {
    this.page = 1;

    if (this.isBeneficiary) {
      this.loadBeneficiaryEnrollment();
      return;
    }

    this.loadRenewals();
  }

  private shouldRefreshRenewals(event: AppSyncEvent): boolean {
    return [
      'global_refresh',
      'enrollment_changed',
      'renewal_changed',
      'dashboard_changed',
    ].includes(event.type);
  }
}
