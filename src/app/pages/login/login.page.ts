import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  IonContent, IonButton, IonItem, IonInput, IonSelect, IonSelectOption,
  IonCheckbox, IonSpinner, IonIcon
} from '@ionic/angular/standalone';
import { ToastController } from '@ionic/angular/standalone';
import { AuthService } from '../../services/auth.service';
import { LoginRequest } from '../../interfaces/user.interface';
import { addIcons } from 'ionicons';
import {
  logInOutline, personOutline, lockClosedOutline, eyeOutline,
  eyeOffOutline, shieldCheckmarkOutline, languageOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterLink,
    IonContent, IonButton, IonItem, IonInput, IonSelect, IonSelectOption,
    IonCheckbox, IonSpinner, IonIcon
  ],
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage {
  loginData: LoginRequest = {
    identifier_type: 'mobile',
    identifier: '',
    password: '',
  };
  rememberMe = false;
  loading = false;
  showPassword = false;
  lang = 'en';

  identifierPlaceholder = 'Enter mobile number';
  identifierInputType = 'tel';

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastCtrl: ToastController
  ) {
    addIcons({
      logInOutline, personOutline, lockClosedOutline, eyeOutline,
      eyeOffOutline, shieldCheckmarkOutline, languageOutline
    });
  }

  toggleLang() {
    this.lang = this.lang === 'en' ? 'ne' : 'en';
    this.onIdentifierTypeChange();
  }

  onIdentifierTypeChange() {
    const typeMap: Record<string, { placeholder: string; placeholderNe: string; type: string }> = {
      mobile:      { placeholder: 'Enter mobile number', placeholderNe: 'मोबाइल नम्बर प्रविष्ट गर्नुहोस्', type: 'tel' },
      hib_number:  { placeholder: 'Enter HIB number', placeholderNe: 'HIB नम्बर प्रविष्ट गर्नुहोस्', type: 'text' },
    };
    const cfg = typeMap[this.loginData.identifier_type] ?? typeMap['mobile'];
    this.identifierPlaceholder = this.lang === 'en' ? cfg.placeholder : cfg.placeholderNe;
    this.identifierInputType = cfg.type;
    this.loginData.identifier = '';

  }


  async login() {
    if (!this.loginData.identifier || !this.loginData.password) {
      const toast = await this.toastCtrl.create({
        message: this.lang === 'en' ? 'Please fill in all fields' : 'कृपया सबै फिल्डहरू भर्नुहोस्',
        duration: 2000, color: 'warning', position: 'top',
      });
      await toast.present();
      return;
    }

    this.loading = true;
    const requestData = {
      ...this.loginData,
      identifier: this.loginData.identifier,
      remember: this.rememberMe
    };
    this.authService.login(requestData).subscribe({
      next: async (res) => {
        this.loading = false;
        if (res.success) {
          const toast = await this.toastCtrl.create({
            message: this.lang === 'en' ? 'Login successful!' : 'लगइन सफल!',
            duration: 1500, color: 'success', position: 'top',
          });
          await toast.present();
          this.router.navigateByUrl('/tabs/dashboard', { replaceUrl: true });
        }
      },
      error: () => {
        this.loading = false;
      },
    });
  }
}
