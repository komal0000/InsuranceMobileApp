import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
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
  eyeOffOutline, shieldCheckmarkOutline, languageOutline, keyOutline
} from 'ionicons/icons';

type SetupLoadingAction = 'sendOtp' | 'verifyOtp' | 'createPassword' | null;

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
  showRegistrationSetup = false;
  otpSent = false;
  otpVerified = false;
  setupOtp = '';
  setupPassword = '';
  setupPasswordConfirmation = '';
  setupLoadingAction: SetupLoadingAction = null;

  identifierPlaceholder = 'Enter mobile number';
  identifierInputType = 'tel';

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private toastCtrl: ToastController
  ) {
    addIcons({
      logInOutline, personOutline, lockClosedOutline, eyeOutline,
      eyeOffOutline, shieldCheckmarkOutline, languageOutline, keyOutline,
    });

    this.route.queryParamMap.subscribe(params => {
      this.showRegistrationSetup = params.get('setup') === 'registration';

      const identifierType = params.get('identifier_type');
      if (identifierType === 'mobile' || identifierType === 'hib_number') {
        this.loginData.identifier_type = identifierType;
      }

      const identifier = params.get('identifier');
      if (identifier) {
        this.loginData.identifier = identifier;
      }

      this.onIdentifierTypeChange(false);
    });
  }

  toggleLang() {
    this.lang = this.lang === 'en' ? 'ne' : 'en';
    this.onIdentifierTypeChange(false);
  }

  onIdentifierTypeChange(clearIdentifier = true) {
    const typeMap: Record<string, { placeholder: string; placeholderNe: string; type: string }> = {
      mobile: { placeholder: 'Enter mobile number', placeholderNe: 'मोबाइल नम्बर प्रविष्ट गर्नुहोस्', type: 'tel' },
      hib_number: { placeholder: 'Enter HIB number', placeholderNe: 'HIB नम्बर प्रविष्ट गर्नुहोस्', type: 'text' },
    };
    const cfg = typeMap[this.loginData.identifier_type] ?? typeMap['mobile'];
    this.identifierPlaceholder = this.lang === 'en' ? cfg.placeholder : cfg.placeholderNe;
    this.identifierInputType = cfg.type;

    if (clearIdentifier) {
      this.loginData.identifier = '';
      this.resetSetupFields();
    }
  }

  onIdentifierInputChange() {
    if (this.loginData.identifier_type === 'mobile') {
      this.loginData.identifier = this.loginData.identifier.replace(/\D+/g, '').slice(0, 10);
    }

    this.resetSetupFields();
  }

  async login() {
    if (!this.loginData.identifier || !this.loginData.password) {
      await this.presentToast(
        this.lang === 'en' ? 'Please fill in all fields' : 'कृपया सबै फिल्डहरू भर्नुहोस्',
        'warning'
      );
      return;
    }

    this.loading = true;
    const requestData = {
      ...this.loginData,
      identifier: this.normalizedIdentifier,
      remember: this.rememberMe,
    };
    this.authService.login(requestData).subscribe({
      next: async (res) => {
        this.loading = false;
        if (res.success) {
          await this.presentToast(this.lang === 'en' ? 'Login successful!' : 'लगइन सफल!', 'success');
          void this.router.navigateByUrl('/tabs/dashboard', { replaceUrl: true });
        }
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  async sendSetupOtp() {
    if (!this.normalizedIdentifier) {
      await this.presentToast('Please enter your mobile or HIB number.', 'warning');
      return;
    }

    this.setupLoadingAction = 'sendOtp';
    this.authService.sendLoginSetupOtp({
      identifier_type: this.loginData.identifier_type,
      identifier: this.normalizedIdentifier,
    }).subscribe({
      next: async () => {
        this.setupLoadingAction = null;
        this.otpSent = true;
        this.otpVerified = false;
        await this.presentToast('OTP sent successfully.', 'success');
      },
      error: () => {
        this.setupLoadingAction = null;
      },
    });
  }

  async verifySetupOtp() {
    this.setupOtp = this.setupOtp.replace(/\D+/g, '').slice(0, 6);

    if (!/^\d{6}$/.test(this.setupOtp)) {
      await this.presentToast('OTP must be exactly 6 digits.', 'warning');
      return;
    }

    this.setupLoadingAction = 'verifyOtp';
    this.authService.verifyLoginSetupOtp({
      identifier_type: this.loginData.identifier_type,
      identifier: this.normalizedIdentifier,
      otp: this.setupOtp,
    }).subscribe({
      next: async () => {
        this.setupLoadingAction = null;
        this.otpVerified = true;
        await this.presentToast('OTP verified. Create your password.', 'success');
      },
      error: () => {
        this.setupLoadingAction = null;
      },
    });
  }

  async createSetupPassword() {
    if (this.setupPassword.length < 8) {
      await this.presentToast('Password must be at least 8 characters long.', 'warning');
      return;
    }

    if (this.setupPassword !== this.setupPasswordConfirmation) {
      await this.presentToast('Passwords do not match.', 'warning');
      return;
    }

    this.setupLoadingAction = 'createPassword';
    this.authService.createLoginSetupPassword({
      identifier_type: this.loginData.identifier_type,
      identifier: this.normalizedIdentifier,
      otp: this.setupOtp,
      password: this.setupPassword,
      password_confirmation: this.setupPasswordConfirmation,
      remember: this.rememberMe,
    }).subscribe({
      next: async (res) => {
        this.setupLoadingAction = null;
        if (res.success) {
          await this.presentToast('Password created successfully.', 'success');
          void this.router.navigateByUrl('/tabs/dashboard', { replaceUrl: true });
        }
      },
      error: () => {
        this.setupLoadingAction = null;
      },
    });
  }

  private get normalizedIdentifier(): string {
    return this.loginData.identifier_type === 'mobile'
      ? this.loginData.identifier.replace(/\D+/g, '').slice(0, 10)
      : this.loginData.identifier.trim();
  }

  private resetSetupFields() {
    this.otpSent = false;
    this.otpVerified = false;
    this.setupOtp = '';
    this.setupPassword = '';
    this.setupPasswordConfirmation = '';
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
