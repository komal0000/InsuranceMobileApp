import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonCard, IonCardContent,
  IonItem, IonInput, IonIcon, IonButton, IonSpinner
} from '@ionic/angular/standalone';
import { ToastController, AlertController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  personCircleOutline, logOutOutline, keyOutline, createOutline,
  callOutline, mailOutline, calendarOutline
} from 'ionicons/icons';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { ApiResponse } from '../../interfaces/api-response.interface';
import { User, ProfileUpdateRequest, ChangePasswordRequest } from '../../interfaces/user.interface';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonContent, IonHeader, IonToolbar, IonTitle, IonCard, IonCardContent,
    IonItem, IonInput, IonIcon, IonButton, IonSpinner
  ],
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
})
export class ProfilePage implements OnInit {
  user: User | null = null;
  editing = false;
  savingProfile = false;
  changingPassword = false;

  profileData: ProfileUpdateRequest = {};
  passwordData: ChangePasswordRequest = {
    current_password: '', password: '', password_confirmation: '',
  };

  constructor(
    private authService: AuthService,
    private api: ApiService,
    private router: Router,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController
  ) {
    addIcons({
      personCircleOutline, logOutOutline, keyOutline, createOutline,
      callOutline, mailOutline, calendarOutline
    });
  }

  ngOnInit() {
    this.user = this.authService.getCurrentUser();
    this.resetProfileData();
    this.authService.fetchProfile().subscribe({
      next: (u) => {
        this.user = u;
        this.resetProfileData();
      },
    });
  }

  resetProfileData() {
    if (this.user) {
      this.profileData = {
        name: this.user.name,
        name_ne: this.user.name_ne,
        email: this.user.email,
        mobile_number: this.user.mobile_number,
        date_of_birth: this.user.date_of_birth,
        province: this.user.province,
        district: this.user.district,
      };
    }
  }

  cancelEdit() {
    this.editing = false;
    this.resetProfileData();
  }

  async saveProfile() {
    if (this.profileData.mobile_number && !/^\d{10}$/.test(this.profileData.mobile_number)) {
      const toast = await this.toastCtrl.create({
        message: 'Mobile number must be exactly 10 digits', duration: 2000, color: 'warning', position: 'top',
      });
      await toast.present();
      return;
    }
    this.savingProfile = true;
    this.api.put<ApiResponse>('/profile', this.profileData).subscribe({
      next: async (res) => {
        this.savingProfile = false;
        this.editing = false;
        if (res.success) {
          this.authService.fetchProfile().subscribe({
            next: (u) => { this.user = u; this.resetProfileData(); },
          });
          const toast = await this.toastCtrl.create({
            message: 'Profile updated', duration: 1500, color: 'success', position: 'top',
          });
          await toast.present();
        }
      },
      error: () => { this.savingProfile = false; },
    });
  }

  async changePassword() {
    if (!this.passwordData.current_password || !this.passwordData.password) {
      const toast = await this.toastCtrl.create({
        message: 'Please fill in all password fields', duration: 2000, color: 'warning', position: 'top',
      });
      await toast.present();
      return;
    }
    if (this.passwordData.password !== this.passwordData.password_confirmation) {
      const toast = await this.toastCtrl.create({
        message: 'Passwords do not match', duration: 2000, color: 'danger', position: 'top',
      });
      await toast.present();
      return;
    }
    this.changingPassword = true;
    this.api.put<ApiResponse>('/change-password', this.passwordData).subscribe({
      next: async (res) => {
        this.changingPassword = false;
        this.passwordData = { current_password: '', password: '', password_confirmation: '' };
        const toast = await this.toastCtrl.create({
          message: res.message || 'Password changed', duration: 2000, color: 'success', position: 'top',
        });
        await toast.present();
      },
      error: () => { this.changingPassword = false; },
    });
  }

  async logout() {
    const alert = await this.alertCtrl.create({
      header: 'Logout',
      message: 'Are you sure you want to logout?',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Logout',
          cssClass: 'danger',
          handler: () => {
            this.authService.logout().subscribe({
              next: () => this.router.navigateByUrl('/login'),
              error: () => {
                this.authService.clearSession().then(() => this.router.navigateByUrl('/login'));
              },
            });
          },
        },
      ],
    });
    await alert.present();
  }

  formatRole(role?: string): string {
    return (role || '').replace(/_/g, ' ');
  }
}
