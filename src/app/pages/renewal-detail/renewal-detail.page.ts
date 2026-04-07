import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
  IonCard, IonCardContent, IonBadge, IonIcon, IonButton, IonSpinner,
  IonInput, IonItem, IonSelect, IonSelectOption
} from '@ionic/angular/standalone';
import { ToastController, AlertController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  personOutline, peopleOutline, addOutline, trashOutline,
  checkmarkCircleOutline, createOutline, walletOutline, shieldCheckmarkOutline,
  cameraOutline
} from 'ionicons/icons';
import { ApiService } from '../../services/api.service';
import { DateService } from '../../services/date.service';
import { ApiResponse } from '../../interfaces/api-response.interface';
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
  selector: 'app-renewal-detail',
  standalone: true,
  imports: [
    CommonModule, FormsModule, BsDatePickerComponent,
    IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
    IonCard, IonCardContent, IonBadge, IonIcon, IonButton, IonSpinner,
    IonInput, IonItem, IonSelect, IonSelectOption
  ],
  templateUrl: './renewal-detail.page.html',
  styleUrls: ['./renewal-detail.page.scss'],
})
export class RenewalDetailPage implements OnInit {
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
    is_target_group: false, target_group_type: '', target_group_id_number: '',
    photo: null as File | Blob | null,
    citizenship_front_image: null as File | Blob | null,
    citizenship_back_image: null as File | Blob | null,
    birth_certificate_front_image: null as File | Blob | null,
    birth_certificate_back_image: null as File | Blob | null,
    target_group_front_image: null as File | Blob | null,
    target_group_back_image: null as File | Blob | null,
  };
  memberPhotoPreview = '';
  memberCitizenshipFrontPreview = '';
  memberCitizenshipBackPreview = '';
  memberBirthCertFrontPreview = '';
  memberBirthCertBackPreview = '';
  memberTargetGroupFrontPreview = '';
  memberTargetGroupBackPreview = '';
  private readonly memberDateFields = [
    'date_of_birth',
    'citizenship_issue_date',
    'birth_certificate_issue_date',
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
    private dateService: DateService,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController
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
      is_target_group: !!member.is_target_group,
      target_group_type: member.target_group_type || '',
      target_group_id_number: member.target_group_id_number || '',
      photo: null,
      citizenship_front_image: null,
      citizenship_back_image: null,
      birth_certificate_front_image: null,
      birth_certificate_back_image: null,
      target_group_front_image: null,
      target_group_back_image: null,
    };

    this.resetMemberPreviews();
    this.memberPhotoPreview = this.getDocUrl(member, 'photo') || '';
    this.memberCitizenshipFrontPreview = this.getDocUrl(member, 'citizenship_front') || '';
    this.memberCitizenshipBackPreview = this.getDocUrl(member, 'citizenship_back') || '';
    this.memberBirthCertFrontPreview = this.getDocUrl(member, 'birth_certificate_front') || '';
    this.memberBirthCertBackPreview = this.getDocUrl(member, 'birth_certificate_back') || '';
    this.memberTargetGroupFrontPreview = this.getDocUrl(member, 'target_group_front') || '';
    this.memberTargetGroupBackPreview = this.getDocUrl(member, 'target_group_back') || '';

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
        message: 'Please fill all required member fields.',
        duration: 2200,
        color: 'warning',
        position: 'top',
      }).then(t => t.present());
      return;
    }

    const relationship = this.normalizeKey(this.newMember.relationship);
    if (!relationship || !this.availableMemberRelationshipOptions.some(option => option.value === relationship)) {
      this.toastCtrl.create({ message: 'Please select a valid relationship.', duration: 2000, color: 'warning', position: 'top' }).then(t => t.present());
      return;
    }
    if (this.isHeadSingle && SINGLE_HEAD_BLOCKED_RELATIONSHIPS.includes(relationship)) {
      this.toastCtrl.create({ message: 'Spouse, son, and daughter relationships are not allowed when household head marital status is single.', duration: 2500, color: 'warning', position: 'top' }).then(t => t.present());
      return;
    }
    this.newMember.relationship = relationship;
    if (this.newMember.marital_status) {
      this.newMember.marital_status = this.normalizeKey(this.newMember.marital_status);
    }

    if (this.newMember.mobile_number && !/^\d{10}$/.test(this.newMember.mobile_number)) {
      this.toastCtrl.create({ message: 'Mobile number must be exactly 10 digits.', duration: 2000, color: 'warning', position: 'top' }).then(t => t.present());
      return;
    }

    const docType = this.newMember.document_type || null;
    if (docType === 'citizenship' && this.newMember.date_of_birth && this.dateService.calculateAge(this.newMember.date_of_birth, 'bs') < 16) {
      this.toastCtrl.create({ message: 'Member with citizenship document must be at least 16 years old.', duration: 2200, color: 'warning', position: 'top' }).then(t => t.present());
      return;
    }

    const fd = new FormData();
    Object.keys(this.newMember).forEach(key => {
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
            message: wasEditing ? 'Member updated' : 'Member added',
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
          message: err?.error?.message || 'Failed to save member',
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
           'birth_certificate_front_image' | 'birth_certificate_back_image' |
           'target_group_front_image' | 'target_group_back_image'
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
           'birth_certificate_front_image' | 'birth_certificate_back_image' |
           'target_group_front_image' | 'target_group_back_image'
  ) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpg,image/jpeg,image/png';
    input.onchange = (event: Event) => {
      const target = event.target as HTMLInputElement | null;
      const file = target?.files?.[0];
      if (!file) return;
      if (file.size > 2 * 1024 * 1024) {
        this.toastCtrl.create({ message: 'Image must be less than 2MB.', duration: 2000, color: 'danger', position: 'top' }).then(t => t.present());
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
           'birth_certificate_front_image' | 'birth_certificate_back_image' |
           'target_group_front_image' | 'target_group_back_image',
    blob: Blob,
    dataUrl: string,
  ) {
    this.newMember[field] = blob;

    if (field === 'photo') this.memberPhotoPreview = dataUrl;
    else if (field === 'citizenship_front_image') this.memberCitizenshipFrontPreview = dataUrl;
    else if (field === 'citizenship_back_image') this.memberCitizenshipBackPreview = dataUrl;
    else if (field === 'birth_certificate_front_image') this.memberBirthCertFrontPreview = dataUrl;
    else if (field === 'birth_certificate_back_image') this.memberBirthCertBackPreview = dataUrl;
    else if (field === 'target_group_front_image') this.memberTargetGroupFrontPreview = dataUrl;
    else if (field === 'target_group_back_image') this.memberTargetGroupBackPreview = dataUrl;
  }

  async removeMember(member: any) {
    const alert = await this.alertCtrl.create({
      header: 'Remove Member',
      message: `Remove ${member.first_name} ${member.last_name}?`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Remove',
          handler: () => {
            this.api.delete<ApiResponse>(`/renewals/${this.renewalId}/members/${member.id}`).subscribe({
              next: () => this.loadDetail(),
            });
          },
        },
      ],
    });
    await alert.present();
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
            message: res.message || 'Renewal completed!', duration: 2000, color: 'success', position: 'top',
          });
          await toast.present();
          this.loadDetail();
        }
      },
      error: async (err) => {
        this.submitting = false;
        const toast = await this.toastCtrl.create({
          message: err?.error?.message || 'Submission failed', duration: 2000, color: 'danger', position: 'top',
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
    return (s || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  get isHeadSingle(): boolean {
    return this.normalizeKey(this.renewal?.enrollment?.household_head?.marital_status) === 'single';
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

  private createEmptyMemberForm(currentBs: string): Record<string, unknown> {
    return {
      first_name: '', middle_name: '', last_name: '',
      first_name_ne: '', middle_name_ne: '', last_name_ne: '',
      gender: '', date_of_birth: currentBs, relationship: '',
      blood_group: '', marital_status: '', mobile_number: '', email: '',
      document_type: '',
      citizenship_number: '', citizenship_issue_date: currentBs, citizenship_issue_district: '',
      birth_certificate_number: '', birth_certificate_issue_date: currentBs,
      is_target_group: false, target_group_type: '', target_group_id_number: '',
      photo: null,
      citizenship_front_image: null,
      citizenship_back_image: null,
      birth_certificate_front_image: null,
      birth_certificate_back_image: null,
      target_group_front_image: null,
      target_group_back_image: null,
    };
  }

  private resetMemberPreviews() {
    this.memberPhotoPreview = '';
    this.memberCitizenshipFrontPreview = '';
    this.memberCitizenshipBackPreview = '';
    this.memberBirthCertFrontPreview = '';
    this.memberBirthCertBackPreview = '';
    this.memberTargetGroupFrontPreview = '';
    this.memberTargetGroupBackPreview = '';
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
}
