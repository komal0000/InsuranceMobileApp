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
  checkmarkCircleOutline, createOutline, walletOutline, shieldCheckmarkOutline
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
  relationshipOptions: Array<{ value: string; label: string }> = [...DEFAULT_MEMBER_RELATIONSHIPS];
  newMember: any = { first_name: '', middle_name: '', last_name: '', first_name_ne: '', middle_name_ne: '', last_name_ne: '', gender: '', date_of_birth: '', relationship: '', marital_status: '', mobile_number: '', citizenship_number: '' };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
    private dateService: DateService,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController
  ) {
    addIcons({ personOutline, peopleOutline, addOutline, trashOutline, checkmarkCircleOutline, createOutline, walletOutline, shieldCheckmarkOutline });
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
    this.newMember = { first_name: '', middle_name: '', last_name: '', first_name_ne: '', middle_name_ne: '', last_name_ne: '', gender: '', date_of_birth: currentBs, relationship: '', marital_status: '', mobile_number: '', citizenship_number: '' };
    this.showMemberForm = true;
  }

  addMember() {
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

    if (this.newMember.date_of_birth && this.dateService.calculateAge(this.newMember.date_of_birth, 'bs') < 16) {
      this.toastCtrl.create({ message: 'Member must be at least 16 years old.', duration: 2000, color: 'warning', position: 'top' }).then(t => t.present());
      return;
    }
    const payload = this.dateService.preparePayloadForApi(this.newMember as Record<string, unknown>, ['date_of_birth']);
    this.api.post<ApiResponse>(`/renewals/${this.renewalId}/members`, payload).subscribe({
      next: async (res) => {
        if (res.success) {
          this.showMemberForm = false;
          this.loadDetail();
          const toast = await this.toastCtrl.create({ message: 'Member added', duration: 1500, color: 'success', position: 'top' });
          await toast.present();
        }
      },
    });
  }

  async editMember(member: any) {
    const alert = await this.alertCtrl.create({
      header: 'Edit Member',
      inputs: [
        { name: 'first_name', type: 'text', value: member.first_name, placeholder: 'First Name' },
        { name: 'last_name', type: 'text', value: member.last_name, placeholder: 'Last Name' },
        { name: 'mobile_number', type: 'tel', value: member.mobile_number, placeholder: 'Mobile Number' },
      ],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Save',
          handler: (data) => {
            this.api.put<ApiResponse>(`/renewals/${this.renewalId}/members/${member.id}`, data).subscribe({
              next: () => this.loadDetail(),
            });
          },
        },
      ],
    });
    await alert.present();
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

  displayDate(adDate?: string | null, bsDate?: string | null): string {
    return this.dateService.formatForDisplay(adDate, bsDate) || '';
  }
}
