import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  IonContent, IonButton, IonItem, IonInput, IonSpinner, IonIcon
} from '@ionic/angular/standalone';
import { ToastController } from '@ionic/angular/standalone';
import { AuthService } from '../../services/auth.service';
import {
  RegisterRequest,
} from '../../interfaces/user.interface';
import { NepaliInputDirective } from '../../directives/nepali-input.directive';
import { addIcons } from 'ionicons';
import {
  shieldCheckmarkOutline, arrowBackOutline, personOutline,
  callOutline, mailOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterLink, NepaliInputDirective,
    IonContent, IonButton, IonItem, IonInput, IonSpinner, IonIcon,
  ],
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
})
export class RegisterPage {
  formData: RegisterRequest = {
    name: '',
    name_ne: '',
    mobile_number: '',
    email: '',
  };

  loading = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastCtrl: ToastController
  ) {
    addIcons({
      shieldCheckmarkOutline, arrowBackOutline, personOutline, callOutline, mailOutline,
    });
  }

  async register() {
    this.formData.mobile_number = this.formData.mobile_number.replace(/\D+/g, '').slice(0, 10);

    if (!this.formData.name || !this.formData.name_ne || !this.formData.mobile_number) {
      await this.presentToast('Full name, Nepali full name, and mobile number are required.', 'warning');
      return;
    }

    if (!/^\d{10}$/.test(this.formData.mobile_number)) {
      await this.presentToast('Mobile number must be exactly 10 digits.', 'warning');
      return;
    }

    if (this.formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.formData.email)) {
      await this.presentToast('Please enter a valid email address.', 'warning');
      return;
    }

    this.loading = true;
    this.authService.registerBeneficiary(this.formData).subscribe({
      next: async (res) => {
        this.loading = false;
        await this.presentToast('Registration saved. Continue OTP setup from login.', 'success');
        void this.router.navigate(['/login'], {
          replaceUrl: true,
          queryParams: {
            identifier_type: 'mobile',
            identifier: res.data.mobile_number,
            setup: 'registration',
          },
        });
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  private async presentToast(message: string, color: 'success' | 'warning' | 'danger') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      color,
      position: 'top',
    });

    await toast.present();
  }
}
