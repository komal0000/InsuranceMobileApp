import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
  IonCard, IonCardContent, IonBadge, IonIcon, IonButton, IonSpinner,
  IonImg
} from '@ionic/angular/standalone';
import { ToastController, AlertController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  locationOutline, personOutline, peopleOutline, documentOutline,
  checkmarkCircleOutline, closeCircleOutline, createOutline, trashOutline,
  shieldCheckmarkOutline
} from 'ionicons/icons';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { ApiResponse } from '../../interfaces/api-response.interface';
import { Enrollment } from '../../interfaces/enrollment.interface';

@Component({
  selector: 'app-enrollment-detail',
  standalone: true,
  imports: [
    CommonModule,
    IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
    IonCard, IonCardContent, IonBadge, IonIcon, IonButton, IonSpinner,
    IonImg
  ],
  templateUrl: './enrollment-detail.page.html',
  styleUrls: ['./enrollment-detail.page.scss'],
})
export class EnrollmentDetailPage implements OnInit {
  enrollment: Enrollment | null = null;
  loading = true;
  enrollmentId!: number;
  canVerify = false;
  canApprove = false;
  canReject = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
    private authService: AuthService,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController
  ) {
    addIcons({
      locationOutline, personOutline, peopleOutline, documentOutline,
      checkmarkCircleOutline, closeCircleOutline, createOutline, trashOutline,
      shieldCheckmarkOutline
    });
  }

  ngOnInit() {
    this.enrollmentId = Number(this.route.snapshot.paramMap.get('id'));
    const user = this.authService.getCurrentUser();
    this.canVerify = ['district_eo', 'admin', 'super_admin'].includes(user?.role || '');
    this.canApprove = ['province', 'admin', 'super_admin'].includes(user?.role || '');
    this.canReject = ['district_eo', 'province', 'admin', 'super_admin'].includes(user?.role || '');
    this.loadDetail();
  }

  loadDetail() {
    this.loading = true;
    this.api.get<ApiResponse<Enrollment>>(`/enrollments/${this.enrollmentId}`).subscribe({
      next: (res) => {
        this.enrollment = res.data;
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  editEnrollment() {
    this.router.navigateByUrl(`/enrollment-wizard/${this.enrollmentId}`);
  }

  async submitEnrollment() {
    this.api.post<ApiResponse>(`/enrollments/${this.enrollmentId}/submit`, {}).subscribe({
      next: async (res) => {
        const toast = await this.toastCtrl.create({
          message: res.message || 'Enrollment submitted successfully',
          duration: 2000, color: 'success', position: 'top',
        });
        await toast.present();
        this.loadDetail();
      },
    });
  }

  async verifyEnrollment() {
    this.api.patch<ApiResponse>(`/enrollments/${this.enrollmentId}/verify`).subscribe({
      next: async (res) => {
        const toast = await this.toastCtrl.create({
          message: res.message || 'Enrollment verified',
          duration: 2000, color: 'success', position: 'top',
        });
        await toast.present();
        this.loadDetail();
      },
    });
  }

  async approveEnrollment() {
    this.api.patch<ApiResponse>(`/enrollments/${this.enrollmentId}/approve`).subscribe({
      next: async (res) => {
        const toast = await this.toastCtrl.create({
          message: res.message || 'Enrollment approved',
          duration: 2000, color: 'success', position: 'top',
        });
        await toast.present();
        this.loadDetail();
      },
    });
  }

  async rejectEnrollment() {
    const alert = await this.alertCtrl.create({
      header: 'Reject Enrollment',
      inputs: [{ name: 'reason', type: 'textarea', placeholder: 'Enter rejection reason' }],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Reject',
          handler: (data) => {
            this.api.patch<ApiResponse>(`/enrollments/${this.enrollmentId}/reject`, {
              rejection_reason: data.reason
            }).subscribe({
              next: async (res) => {
                const toast = await this.toastCtrl.create({
                  message: res.message || 'Enrollment rejected',
                  duration: 2000, color: 'warning', position: 'top',
                });
                await toast.present();
                this.loadDetail();
              },
            });
          },
        },
      ],
    });
    await alert.present();
  }

  async deleteEnrollment() {
    const alert = await this.alertCtrl.create({
      header: 'Delete Enrollment',
      message: 'Are you sure you want to delete this draft enrollment?',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete',
          cssClass: 'danger',
          handler: () => {
            this.api.delete<ApiResponse>(`/enrollments/${this.enrollmentId}`).subscribe({
              next: async () => {
                const toast = await this.toastCtrl.create({
                  message: 'Enrollment deleted',
                  duration: 2000, color: 'success', position: 'top',
                });
                await toast.present();
                this.router.navigateByUrl('/tabs/enrollments');
              },
            });
          },
        },
      ],
    });
    await alert.present();
  }

  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      draft: 'medium', pending_verification: 'warning', verified: 'tertiary',
      approved: 'success', rejected: 'danger', active: 'success', expired: 'dark',
    };
    return colors[status] || 'medium';
  }

  formatStatus(status: string): string {
    return (status || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }
}
