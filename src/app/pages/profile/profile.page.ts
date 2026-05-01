import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonCard, IonCardContent,
  IonItem, IonInput, IonIcon, IonButton, IonSpinner,
  ActionSheetController
} from '@ionic/angular/standalone';
import { ToastController, AlertController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  personCircleOutline, logOutOutline, keyOutline, createOutline,
  callOutline, mailOutline, calendarOutline, cameraOutline, imageOutline
} from 'ionicons/icons';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { DateService } from '../../services/date.service';
import { ApiResponse } from '../../interfaces/api-response.interface';
import { User, ProfileUpdateRequest, ChangePasswordRequest } from '../../interfaces/user.interface';
import { BsDatePickerComponent } from '../../components/bs-date-picker/bs-date-picker.component';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule, FormsModule, BsDatePickerComponent,
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
  uploadingImage = false;

  profileData: ProfileUpdateRequest = {};
  passwordData: ChangePasswordRequest = {
    current_password: '', password: '', password_confirmation: '',
  };

  constructor(
    private authService: AuthService,
    private api: ApiService,
    private dateService: DateService,
    private router: Router,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController,
    private actionSheetCtrl: ActionSheetController,
    private languageService: LanguageService
  ) {
    addIcons({
      personCircleOutline, logOutOutline, keyOutline, createOutline,
      callOutline, mailOutline, calendarOutline, cameraOutline, imageOutline
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
      const currentBs = this.dateService.getCurrentBs();
      this.profileData = {
        name: this.user.name,
        name_ne: this.user.name_ne,
        email: this.user.email,
        mobile_number: this.user.mobile_number,
        date_of_birth: this.dateService.formatForDisplay(this.user.date_of_birth, this.user.date_of_birth_bs) || currentBs,
        province: this.user.province,
        district: this.user.district,
      };
    }
  }

  cancelEdit() {
    this.editing = false;
    this.resetProfileData();
  }

  async pickImage() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/png,image/webp';
    input.onchange = () => {
      const file = input.files?.[0];
      if (file) {
        if (file.size > 2 * 1024 * 1024) {
          this.toastCtrl.create({
            message: this.t('Image must be less than 2MB'), duration: 2000, color: 'warning', position: 'top',
          }).then(t => t.present());
          return;
        }
        this.uploadImage(file);
      }
    };
    input.click();
  }

  uploadImage(file: File) {
    this.uploadingImage = true;
    const fd = new FormData();
    fd.append('profile_image', file);
    this.api.postFormData<ApiResponse<{ profile_image: string }>>('/profile/image', fd).subscribe({
      next: async (res) => {
        this.uploadingImage = false;
        if (res.success && this.user) {
          this.user.profile_image = res.data.profile_image;
          this.authService.fetchProfile().subscribe();
          const toast = await this.toastCtrl.create({
            message: this.t('profile.image_updated'), duration: 1500, color: 'success', position: 'top',
          });
          await toast.present();
        }
      },
      error: async () => {
        this.uploadingImage = false;
        const toast = await this.toastCtrl.create({
          message: this.t('profile.image_failed'), duration: 2000, color: 'danger', position: 'top',
        });
        await toast.present();
      },
    });
  }

  async saveProfile() {
    if (this.profileData.mobile_number && !/^\d{10}$/.test(this.profileData.mobile_number)) {
      const toast = await this.toastCtrl.create({
        message: this.t('register.mobile_digits'), duration: 2000, color: 'warning', position: 'top',
      });
      await toast.present();
      return;
    }
    this.savingProfile = true;
    const payload = this.dateService.preparePayloadForApi(
      this.profileData as Record<string, unknown>,
      ['date_of_birth']
    );
    this.api.put<ApiResponse>('/profile', payload).subscribe({
      next: async (res) => {
        this.savingProfile = false;
        this.editing = false;
        if (res.success) {
          this.authService.fetchProfile().subscribe({
            next: (u) => { this.user = u; this.resetProfileData(); },
          });
          const toast = await this.toastCtrl.create({
            message: this.t('profile.updated'), duration: 1500, color: 'success', position: 'top',
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
        message: this.t('profile.password_fields'), duration: 2000, color: 'warning', position: 'top',
      });
      await toast.present();
      return;
    }
    if (this.passwordData.password !== this.passwordData.password_confirmation) {
      const toast = await this.toastCtrl.create({
        message: this.t('login.password_mismatch'), duration: 2000, color: 'danger', position: 'top',
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
          message: this.languageService.translateText(res.message) || this.t('profile.password_changed'), duration: 2000, color: 'success', position: 'top',
        });
        await toast.present();
      },
      error: () => { this.changingPassword = false; },
    });
  }

  async logout() {
    const alert = await this.alertCtrl.create({
      header: this.t('profile.logout'),
      message: this.t('profile.logout_message'),
      buttons: [
        { text: this.t('common.cancel'), role: 'cancel' },
        {
          text: this.t('profile.logout'),
          cssClass: 'danger',
          handler: () => {
            this.authService.logout().subscribe({
              next: () => this.router.navigateByUrl('/login', { replaceUrl: true }),
              error: () => {
                this.authService.clearSession().then(() => this.router.navigateByUrl('/login', { replaceUrl: true }));
              },
            });
          },
        },
      ],
    });
    await alert.present();
  }

  formatRole(role?: string): string {
    return this.languageService.label('roles', role);
  }

  displayDate(adDate?: string | null, bsDate?: string | null): string {
    return this.dateService.formatForDisplay(adDate, bsDate) || '';
  }

  t(key: string): string {
    return this.languageService.t(key);
  }
}
