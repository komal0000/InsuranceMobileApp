import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
  IonCard, IonCardContent, IonBadge, IonIcon, IonButton, IonSpinner,
} from '@ionic/angular/standalone';
import { ToastController, AlertController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  personOutline, peopleOutline, addOutline, trashOutline,
  checkmarkCircleOutline, createOutline, walletOutline, shieldCheckmarkOutline,
  cameraOutline
} from 'ionicons/icons';
import { ApiService } from '../../services/api.service';
import { AppSyncEvent, AppSyncService } from '../../services/app-sync.service';
import { DateService } from '../../services/date.service';
import { ApiResponse } from '../../interfaces/api-response.interface';
import { Renewal } from '../../interfaces/renewal.interface';
import { MemberFormComponent } from '../../components/member-form/member-form.component';
import { LanguageToggleComponent } from '../../components/language-toggle/language-toggle.component';
import { LanguageService } from '../../services/language.service';

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
  selector: 'app-renewal-detail',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MemberFormComponent, LanguageToggleComponent,
    IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
    IonCard, IonCardContent, IonBadge, IonIcon, IonButton, IonSpinner,
  ],
  templateUrl: './renewal-detail.page.html',
  styleUrls: ['./renewal-detail.page.scss'],
})
export class RenewalDetailPage implements OnInit, OnDestroy {
  renewal: Renewal | null = null;
  loading = true;
  submitting = false;
  renewalId!: number;
  showMemberForm = false;
  editingMemberId: number | null = null;
  savingMember = false;
  relationshipOptions: Array<{ value: string; label: string }> = [...DEFAULT_MEMBER_RELATIONSHIPS];
  newMember: any = {
    first_name: '', middle_name: '', last_name: '',
    first_name_ne: '', middle_name_ne: '', last_name_ne: '',
    gender: '', date_of_birth: '', relationship: '',
    blood_group: '', marital_status: '', mobile_number: '', email: '',
    document_type: '',
    citizenship_number: '', citizenship_issue_date: '', citizenship_issue_district: '',
    birth_certificate_number: '', birth_certificate_issue_date: '',
    photo: null as File | Blob | null,
    citizenship_front_image: null as File | Blob | null,
    citizenship_back_image: null as File | Blob | null,
    birth_certificate_front_image: null as File | Blob | null,
  };
  memberPhotoPreview = '';
  memberCitizenshipFrontPreview = '';
  memberCitizenshipBackPreview = '';
  memberBirthCertFrontPreview = '';
  private readonly memberDateFields = [
    'date_of_birth',
    'citizenship_issue_date',
    'birth_certificate_issue_date',
  ];
  private readonly destroy$ = new Subject<void>();
  private hasEnteredView = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
    private syncService: AppSyncService,
    private dateService: DateService,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController,
    private languageService: LanguageService
  ) {
    addIcons({
      personOutline,
      peopleOutline,
      addOutline,
      trashOutline,
      checkmarkCircleOutline,
      createOutline,
      walletOutline,
      shieldCheckmarkOutline,
      cameraOutline,
    });
  }

  ngOnInit() {
    this.renewalId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadRelationshipOptions();
    this.loadDetail();

    this.syncService.events$
      .pipe(takeUntil(this.destroy$))
      .subscribe((event) => {
        if (this.shouldRefreshRenewalDetail(event)) {
          this.loadDetail();
        }
      });
  }

  ionViewWillEnter() {
    if (!this.hasEnteredView) {
      this.hasEnteredView = true;
      return;
    }

    this.loadDetail();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadDetail() {
    this.loading = true;
    this.api.get<ApiResponse<any>>(`/renewals/${this.renewalId}`).subscribe({
      next: (res) => {
        this.renewal = res.data?.renewal ?? res.data;
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  get isFreeRenewal(): boolean {
    return (this.renewal?.final_amount ?? 0) <= 0;
  }

  get canSubmit(): boolean {
    return !!this.renewal && ['eligible', 'draft'].includes(this.renewal.status);
  }

  get canPay(): boolean {
    return !!this.renewal && this.renewal.status === 'pending_payment' && !this.isFreeRenewal;
  }

  showAddMember() {
    const currentBs = this.dateService.getCurrentBs();
    this.editingMemberId = null;
    this.newMember = this.createEmptyMemberForm(currentBs);
    this.resetMemberPreviews();
    this.showMemberForm = true;
  }

  editMember(member: any) {
    this.editingMemberId = Number(member.id);
    this.newMember = {
      first_name: member.first_name || '',
      middle_name: member.middle_name || '',
      last_name: member.last_name || '',
      first_name_ne: member.first_name_ne || '',
      middle_name_ne: member.middle_name_ne || '',
      last_name_ne: member.last_name_ne || '',
      gender: member.gender || '',
      date_of_birth: this.dateService.formatForDisplay(member.date_of_birth, member.date_of_birth_bs) || '',
      relationship: member.relationship || member.relationship_type || '',
      blood_group: member.blood_group || '',
      marital_status: member.marital_status || '',
      mobile_number: member.mobile_number || '',
      email: member.email || '',
      document_type: member.document_type || '',
      citizenship_number: member.citizenship_number || '',
      citizenship_issue_date: this.dateService.formatForDisplay(
        member.citizenship_issue_date,
        member.citizenship_issue_date_bs
      ) || '',
      citizenship_issue_district: member.citizenship_issue_district || '',
      birth_certificate_number: member.birth_certificate_number || '',
      birth_certificate_issue_date: this.dateService.formatForDisplay(
        member.birth_certificate_issue_date,
        member.birth_certificate_issue_date_bs
      ) || '',
      photo: null,
      citizenship_front_image: null,
      citizenship_back_image: null,
      birth_certificate_front_image: null,
    };

    this.resetMemberPreviews();
    this.memberPhotoPreview = this.getDocUrl(member, 'photo') || '';
    this.memberCitizenshipFrontPreview = this.getDocUrl(member, 'citizenship_front') || '';
    this.memberCitizenshipBackPreview = this.getDocUrl(member, 'citizenship_back') || '';
    this.memberBirthCertFrontPreview = this.getDocUrl(member, 'birth_certificate_front') || '';
    this.showMemberForm = true;
  }

  get isEditingMember(): boolean {
    return this.editingMemberId !== null;
  }

  cancelMemberForm() {
    this.showMemberForm = false;
    this.editingMemberId = null;
    this.newMember = this.createEmptyMemberForm(this.dateService.getCurrentBs());
    this.resetMemberPreviews();
  }

  saveMember() {
    if (!this.newMember.first_name || !this.newMember.last_name ||
        !this.newMember.gender || !this.newMember.date_of_birth || !this.newMember.relationship) {
      this.toastCtrl.create({
        message: this.t('wizard.member_required'),
        duration: 2200,
        color: 'warning',
        position: 'top',
      }).then(t => t.present());
      return;
    }

    const relationship = this.normalizeKey(this.newMember.relationship);
    if (!relationship || !this.availableMemberRelationshipOptions.some(option => option.value === relationship)) {
      this.toastCtrl.create({ message: this.t('wizard.relationship_invalid'), duration: 2000, color: 'warning', position: 'top' }).then(t => t.present());
      return;
    }
    if (this.isHeadSingle && SINGLE_HEAD_BLOCKED_RELATIONSHIPS.includes(relationship)) {
      this.toastCtrl.create({ message: this.t('wizard.relationship_single_block'), duration: 2500, color: 'warning', position: 'top' }).then(t => t.present());
      return;
    }
    this.newMember.relationship = relationship;
    if (this.newMember.marital_status) {
      this.newMember.marital_status = this.normalizeKey(this.newMember.marital_status);
    }

    if (this.newMember.mobile_number && !/^\d{10}$/.test(this.newMember.mobile_number)) {
      this.toastCtrl.create({ message: this.t('wizard.mobile_digits'), duration: 2000, color: 'warning', position: 'top' }).then(t => t.present());
      return;
    }

    const docType = this.newMember.document_type || null;
    if (docType === 'citizenship' && this.newMember.date_of_birth && this.dateService.calculateAge(this.newMember.date_of_birth, 'bs') < 16) {
      this.toastCtrl.create({ message: this.t('wizard.member_age_citizenship'), duration: 2200, color: 'warning', position: 'top' }).then(t => t.present());
      return;
    }

    const fd = new FormData();
    Object.keys(this.newMember).forEach(key => {
      if (key.startsWith('target_group') || key === 'is_target_group') return;
      const val = this.newMember[key];
      if (val === null || val === undefined || val === '') return;
      if (typeof val === 'boolean') {
        fd.append(key, val ? '1' : '0');
        return;
      }
      if (val instanceof Blob) {
        fd.append(key, val, `${key}.jpg`);
        return;
      }
      fd.append(key, String(val));
    });

    const prepared = this.dateService.prepareFormDataForApi(fd, this.memberDateFields);
    const editingMemberId = this.editingMemberId;
    const wasEditing = editingMemberId !== null;
    if (wasEditing) {
      prepared.append('_method', 'PUT');
    }

    const endpoint = wasEditing
      ? `/renewals/${this.renewalId}/members/${editingMemberId}`
      : `/renewals/${this.renewalId}/members`;

    this.savingMember = true;
    this.api.postFormData<ApiResponse>(endpoint, prepared).subscribe({
      next: async (res) => {
        this.savingMember = false;
        if (res.success) {
          this.cancelMemberForm();
          this.loadDetail();
          const toast = await this.toastCtrl.create({
            message: wasEditing ? this.t('wizard.member_updated') : this.t('wizard.member_added'),
            duration: 1500,
            color: 'success',
            position: 'top',
          });
          await toast.present();
        }
      },
      error: async (err) => {
        this.savingMember = false;
        const toast = await this.toastCtrl.create({
          message: this.languageService.translateText(err?.error?.message) || this.t('renewal_detail.member_save_failed'),
          duration: 2200,
          color: 'danger',
          position: 'top',
        });
        await toast.present();
      },
    });
  }

  async captureImage(
    field: 'photo' | 'citizenship_front_image' | 'citizenship_back_image' |
           'birth_certificate_front_image'
  ) {
    try {
      const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');
      const image = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Prompt,
        width: 1024,
      });

      if (image.dataUrl) {
        this.applyImage(field, this.dataUrlToBlob(image.dataUrl), image.dataUrl);
      }
    } catch {
      this.fallbackFileInput(field);
    }
  }

  private fallbackFileInput(
    field: 'photo' | 'citizenship_front_image' | 'citizenship_back_image' |
           'birth_certificate_front_image'
  ) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpg,image/jpeg,image/png';
    input.onchange = (event: Event) => {
      const target = event.target as HTMLInputElement | null;
      const file = target?.files?.[0];
      if (!file) return;
      if (file.size > 2 * 1024 * 1024) {
        this.toastCtrl.create({ message: this.t('wizard.image_size'), duration: 2000, color: 'danger', position: 'top' }).then(t => t.present());
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        this.applyImage(field, file, reader.result as string);
      };
      reader.readAsDataURL(file);
    };
    input.click();
  }

  private applyImage(
    field: 'photo' | 'citizenship_front_image' | 'citizenship_back_image' |
           'birth_certificate_front_image',
    blob: Blob,
    dataUrl: string,
  ) {
    this.newMember[field] = blob;

    if (field === 'photo') this.memberPhotoPreview = dataUrl;
    else if (field === 'citizenship_front_image') this.memberCitizenshipFrontPreview = dataUrl;
    else if (field === 'citizenship_back_image') this.memberCitizenshipBackPreview = dataUrl;
    else if (field === 'birth_certificate_front_image') this.memberBirthCertFrontPreview = dataUrl;
  }

  async removeMember(member: any) {
    const deathDocument = await this.selectRemovalDocument();
    if (!deathDocument) {
      this.toastCtrl.create({
        message: this.t('wizard.death_document_required'),
        duration: 2200,
        color: 'warning',
        position: 'top',
      }).then(t => t.present());
      return;
    }

    const alert = await this.alertCtrl.create({
      header: this.t('wizard.remove_member_header'),
      message: this.t('renewal_detail.remove_member_message').replace(':name', `${member.first_name || ''} ${member.last_name || ''}`.trim()),
      buttons: [
        { text: this.t('common.cancel'), role: 'cancel' },
        {
          text: this.t('common.remove'),
          handler: () => {
            const formData = new FormData();
            formData.append('_method', 'DELETE');
            formData.append('death_document', deathDocument, this.fileNameFor(deathDocument, 'death-document'));
            this.api.postFormData<ApiResponse>(`/renewals/${this.renewalId}/members/${member.id}`, formData).subscribe({
              next: async () => {
                this.loadDetail();
                const toast = await this.toastCtrl.create({
                  message: this.t('wizard.member_removed'),
                  duration: 1500,
                  color: 'success',
                  position: 'top',
                });
                await toast.present();
              },
              error: async (err) => {
                const toast = await this.toastCtrl.create({
                  message: this.languageService.translateText(err?.error?.message) || this.t('wizard.member_remove_failed'),
                  duration: 2200,
                  color: 'danger',
                  position: 'top',
                });
                await toast.present();
              },
            });
          },
        },
      ],
    });
    await alert.present();
  }

  private selectRemovalDocument(): Promise<File | null> {
    return new Promise(resolve => {
      const input = document.createElement('input');
      let resolved = false;
      const finish = (file: File | null) => {
        if (resolved) {
          return;
        }

        resolved = true;
        window.removeEventListener('focus', handleFocus);
        resolve(file);
      };
      const handleFocus = () => {
        window.setTimeout(() => {
          if (!input.files?.length) {
            finish(null);
          }
        }, 300);
      };
      input.type = 'file';
      input.accept = 'image/jpg,image/jpeg,image/png,application/pdf';
      input.onchange = (event: Event) => {
        const file = (event.target as HTMLInputElement | null)?.files?.[0] ?? null;
        if (!file) {
          finish(null);
          return;
        }

        if (file.size > 5 * 1024 * 1024) {
          this.toastCtrl.create({
            message: this.t('wizard.death_document_size'),
            duration: 2200,
            color: 'danger',
            position: 'top',
          }).then(t => t.present());
          finish(null);
          return;
        }

        finish(file);
      };
      input.addEventListener('cancel', () => finish(null), { once: true });
      window.addEventListener('focus', handleFocus, { once: true });
      input.click();
    });
  }

  private fileNameFor(file: File | Blob, fallback: string): string {
    return typeof File !== 'undefined' && file instanceof File && file.name ? file.name : fallback;
  }

  async submitRenewal() {
    this.submitting = true;
    this.api.post<ApiResponse<any>>(`/renewals/${this.renewalId}/submit`, {}).subscribe({
      next: async (res: any) => {
        this.submitting = false;

        if (res.requires_payment) {
          // Navigate to payment page for paid renewals
          this.router.navigate(['/payment'], {
            queryParams: {
              renewalId: this.renewalId,
              amount: this.renewal?.final_amount ?? 0,
              type: 'renewal',
              policyNumber: this.renewal?.renewal_number ?? '',
            },
          });
        } else {
          // Free renewal — completed
          const toast = await this.toastCtrl.create({
            message: this.languageService.translateText(res.message) || this.t('renewal_detail.completed_message'), duration: 2000, color: 'success', position: 'top',
          });
          await toast.present();
          this.loadDetail();
        }
      },
      error: async (err) => {
        this.submitting = false;
        const toast = await this.toastCtrl.create({
          message: this.languageService.translateText(err?.error?.message) || this.t('renewal_detail.submission_failed'), duration: 2000, color: 'danger', position: 'top',
        });
        await toast.present();
      },
    });
  }

  goToPay() {
    this.router.navigate(['/payment'], {
      queryParams: {
        renewalId: this.renewalId,
        amount: this.renewal?.final_amount ?? 0,
        type: 'renewal',
        policyNumber: this.renewal?.renewal_number ?? '',
      },
    });
  }

  getStatusColor(s: string): string {
    const map: Record<string, string> = {
      draft: 'medium', eligible: 'tertiary', pending_payment: 'warning',
      pending_review: 'warning', approved: 'primary', completed: 'success', rejected: 'danger',
    };
    return map[s] || 'medium';
  }

  formatStatus(s: string): string {
    return this.languageService.label('status', s);
  }

  get isHeadSingle(): boolean {
    return this.normalizeKey(this.householdHead?.marital_status) === 'single';
  }

  get householdHead(): any {
    const enrollment = this.renewal?.enrollment;
    return enrollment?.household_head ?? enrollment?.householdHead ?? null;
  }

  get renewalMembers(): any[] {
    if (!this.renewal) {
      return [];
    }

    if (Array.isArray(this.renewal.members) && this.renewal.members.length > 0) {
      return this.renewal.members;
    }

    const enrollment = this.renewal.enrollment;
    const familyMembers = enrollment?.family_members ?? enrollment?.familyMembers;

    return Array.isArray(familyMembers) ? familyMembers : [];
  }

  getHeadPhotoUrl(): string | null {
    const head = this.householdHead;
    if (!head) {
      return null;
    }

    const photoDoc = head.documents?.find((doc: any) => doc.document_type === 'photo');
    if (photoDoc?.url) {
      return photoDoc.url;
    }

    if (head.profile_image_url) {
      return head.profile_image_url;
    }

    if (head.photo) {
      return head.photo;
    }

    return null;
  }

  getMemberPhotoUrl(member: any): string | null {
    if (!member) {
      return null;
    }

    const photoDoc = member.documents?.find((doc: any) => doc.document_type === 'photo');
    if (photoDoc?.url) {
      return photoDoc.url;
    }

    if (member.photo) {
      return member.photo;
    }

    return null;
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
        .map(value => ({ value, label: this.formatRelationship(value) }));
      return this.dedupeRelationshipOptions(options);
    }

    if (raw && typeof raw === 'object') {
      const options = Object.entries(raw as Record<string, unknown>)
        .map(([key, label]) => {
          const value = this.normalizeKey(key);
          if (!value || value === 'self') return null;
          const labelText = typeof label === 'string' && label.trim().length > 0
            ? label.trim()
            : this.formatRelationship(value);
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

  private createEmptyMemberForm(currentBs: string): Record<string, unknown> {
    return {
      first_name: '', middle_name: '', last_name: '',
      first_name_ne: '', middle_name_ne: '', last_name_ne: '',
      gender: '', date_of_birth: currentBs, relationship: '',
      blood_group: '', marital_status: '', mobile_number: '', email: '',
      document_type: '',
      citizenship_number: '', citizenship_issue_date: currentBs, citizenship_issue_district: '',
      birth_certificate_number: '', birth_certificate_issue_date: currentBs,
      photo: null,
      citizenship_front_image: null,
      citizenship_back_image: null,
      birth_certificate_front_image: null,
    };
  }

  private resetMemberPreviews() {
    this.memberPhotoPreview = '';
    this.memberCitizenshipFrontPreview = '';
    this.memberCitizenshipBackPreview = '';
    this.memberBirthCertFrontPreview = '';
  }

  getDocUrl(member: any, type: string): string | null {
    if (!member?.documents?.length) return null;
    const doc = member.documents.find((item: any) => item.document_type === type);
    return doc?.url || null;
  }

  private dataUrlToBlob(dataUrl: string): Blob {
    const parts = dataUrl.split(',');
    const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const byteStr = atob(parts[1]);
    const ab = new ArrayBuffer(byteStr.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteStr.length; i++) {
      ia[i] = byteStr.charCodeAt(i);
    }
    return new Blob([ab], { type: mime });
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

  formatPaymentMethod(value: string | null | undefined): string {
    if (value === 'subsidy') {
      return this.t('payment.subsidy_method');
    }

    return this.languageService.translateText(value ? value.replace(/_/g, ' ') : '');
  }

  formatRelationship(value: string | null | undefined): string {
    return this.languageService.label('relation', value);
  }

  paySubmitLabel(amount: string | number | null | undefined): string {
    return this.t('renewal_detail.pay_amount_submit').replace(':amount', this.formatCurrency(amount ?? 0, 0));
  }

  payCompleteLabel(amount: string | number | null | undefined): string {
    return this.t('renewal_detail.pay_amount_complete').replace(':amount', this.formatCurrency(amount ?? 0, 0));
  }

  private shouldRefreshRenewalDetail(event: AppSyncEvent): boolean {
    if (event.type === 'global_refresh') {
      return true;
    }

    if (event.type === 'renewal_changed') {
      return event.renewalId === undefined || event.renewalId === this.renewalId;
    }

    if (event.type === 'enrollment_changed' && event.enrollmentId !== undefined) {
      return event.enrollmentId === this.renewal?.enrollment_id;
    }

    return false;
  }
}
