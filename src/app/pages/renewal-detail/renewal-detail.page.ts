import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
  IonCard, IonCardContent, IonBadge, IonIcon, IonButton, IonSpinner,
  IonInput, IonItem
} from '@ionic/angular/standalone';
import { ToastController, AlertController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  personOutline, peopleOutline, addOutline, trashOutline,
  checkmarkCircleOutline, createOutline
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
    IonInput, IonItem
  ],
  templateUrl: './renewal-detail.page.html',
  styleUrls: ['./renewal-detail.page.scss'],
})
export class RenewalDetailPage implements OnInit {
  renewal: Renewal | null = null;
  loading = true;
  renewalId!: number;
  showMemberForm = false;
  newMember: any = { first_name: '', last_name: '', mobile_number: '', email: '' };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController
  ) {
    addIcons({ personOutline, peopleOutline, addOutline, trashOutline, checkmarkCircleOutline, createOutline });
  }

  ngOnInit() {
    this.renewalId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadDetail();
  }

  loadDetail() {
    this.loading = true;
    this.api.get<ApiResponse<Renewal>>(`/renewals/${this.renewalId}`).subscribe({
      next: (res) => { this.renewal = res.data; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  showAddMember() {
    this.newMember = { first_name: '', last_name: '', mobile_number: '', email: '' };
    this.showMemberForm = true;
  }

  addMember() {
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
        { name: 'mobile_number', type: 'tel', value: member.mobile_number, placeholder: 'Mobile' },
        { name: 'email', type: 'email', value: member.email, placeholder: 'Email' },
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
    this.api.post<ApiResponse>(`/renewals/${this.renewalId}/submit`, {}).subscribe({
      next: async (res) => {
        const toast = await this.toastCtrl.create({
          message: res.message || 'Renewal submitted', duration: 2000, color: 'success', position: 'top',
        });
        await toast.present();
        this.loadDetail();
      },
    });
  }

  getStatusColor(s: string): string {
    const map: Record<string, string> = { draft: 'medium', pending: 'warning', approved: 'success', rejected: 'danger' };
    return map[s] || 'medium';
  }

  formatStatus(s: string): string {
    return (s || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }
}
