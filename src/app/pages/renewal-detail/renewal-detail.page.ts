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
import { ApiResponse } from '../../interfaces/api-response.interface';
import { Renewal } from '../../interfaces/renewal.interface';

@Component({
  selector: 'app-renewal-detail',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
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
  newMember: any = { first_name: '', middle_name: '', last_name: '', first_name_ne: '', middle_name_ne: '', last_name_ne: '', gender: '', date_of_birth: '', relationship: '', mobile_number: '', citizenship_number: '' };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController
  ) {
    addIcons({ personOutline, peopleOutline, addOutline, trashOutline, checkmarkCircleOutline, createOutline, walletOutline, shieldCheckmarkOutline });
  }

  ngOnInit() {
    this.renewalId = Number(this.route.snapshot.paramMap.get('id'));
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
    this.newMember = { first_name: '', middle_name: '', last_name: '', first_name_ne: '', middle_name_ne: '', last_name_ne: '', gender: '', date_of_birth: '', relationship: '', mobile_number: '', citizenship_number: '' };
    this.showMemberForm = true;
  }

  addMember() {
    if (this.newMember.date_of_birth) {
      const birth = new Date(this.newMember.date_of_birth);
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
      if (age < 16) {
        this.toastCtrl.create({ message: 'Member must be at least 16 years old.', duration: 2000, color: 'warning', position: 'top' }).then(t => t.present());
        return;
      }
    }
    this.api.post<ApiResponse>(`/renewals/${this.renewalId}/members`, this.newMember).subscribe({
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
}
