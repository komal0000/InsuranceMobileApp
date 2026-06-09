import { Component, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  IonContent, IonButton, IonItem, IonInput, IonSelect, IonSelectOption,
  IonCheckbox, IonSpinner, IonIcon
} from '@ionic/angular/standalone';
import { ToastController } from '@ionic/angular/standalone';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { LoginRequest, User } from '../../interfaces/user.interface';
import { LanguageService } from '../../services/language.service';
import { isStrongPassword } from '../../utils/auth-validation';
import { addIcons } from 'ionicons';
import {
  logInOutline, personOutline, lockClosedOutline, eyeOutline,
  eyeOffOutline, shieldCheckmarkOutline, languageOutline, keyOutline
} from 'ionicons/icons';

type SetupLoadingAction = 'sendOtp' | 'verifyOtp' | 'createPassword' | null;
type LoginPasswordField = 'login' | 'setup' | 'setupConfirmation';

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
export class LoginPage implements OnDestroy {
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toastCtrl = inject(ToastController);
  private languageService = inject(LanguageService);

  loginData: LoginRequest = {
    identifier_type: 'mobile',
    identifier: '',
    password: '',
  };
  rememberMe = false;
  loading = false;
  passwordVisibility: Record<LoginPasswordField, boolean> = {
    login: false,
    setup: false,
    setupConfirmation: false,
  };
  showRegistrationSetup = false;
  otpSent = false;
  otpVerified = false;
  setupOtp = '';
  setupPassword = '';
  setupPasswordConfirmation = '';
  setupLoadingAction: SetupLoadingAction = null;

  identifierPlaceholder = 'Enter mobile number';
  identifierInputType = 'tel';
  private readonly destroy$ = new Subject<void>();

  constructor() {
    addIcons({
      logInOutline, personOutline, lockClosedOutline, eyeOutline,
      eyeOffOutline, shieldCheckmarkOutline, languageOutline, keyOutline,
    });

    this.route.queryParamMap
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
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

    this.languageService.language$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.onIdentifierTypeChange(false));
  }

  get lang(): 'en' | 'ne' {
    return this.languageService.currentLanguage;
  }

  t(key: string): string {
    return this.languageService.t(key);
  }

  toggleLang() {
    void this.languageService.setLocalLanguage(this.languageService.toggleLanguage());
  }

  passwordInputType(field: LoginPasswordField): 'text' | 'password' {
    return this.passwordVisibility[field] ? 'text' : 'password';
  }

  passwordIcon(field: LoginPasswordField): string {
    return this.passwordVisibility[field] ? 'eye-off-outline' : 'eye-outline';
  }

  togglePasswordVisibility(field: LoginPasswordField): void {
    this.passwordVisibility[field] = !this.passwordVisibility[field];
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onIdentifierTypeChange(clearIdentifier = true) {
    const typeMap: Record<string, { placeholderKey: string; type: string }> = {
      mobile: { placeholderKey: 'login.enter_mobile_number', type: 'tel' },
      hib_number: { placeholderKey: 'login.enter_hib_number', type: 'text' },
    };
    const cfg = typeMap[this.loginData.identifier_type] ?? typeMap['mobile'];
    this.identifierPlaceholder = this.t(cfg.placeholderKey);
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
      await this.presentToast(this.t('login.fill_all_fields'), 'warning');
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
          await this.presentToast(this.t('login.success'), 'success');
          void this.router.navigateByUrl(this.postLoginTarget(res.data.user), { replaceUrl: true });
        }
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  async sendSetupOtp() {
    if (!this.normalizedIdentifier) {
      await this.presentToast(this.t('login.setup_required'), 'warning');
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
        await this.presentToast(this.t('login.otp_sent'), 'success');
      },
      error: () => {
        this.setupLoadingAction = null;
      },
    });
  }

  async verifySetupOtp() {
    this.setupOtp = this.setupOtp.replace(/\D+/g, '').slice(0, 6);

    if (!/^\d{6}$/.test(this.setupOtp)) {
      await this.presentToast(this.t('login.otp_digits'), 'warning');
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
        await this.presentToast(this.t('login.otp_verified'), 'success');
      },
      error: () => {
        this.setupLoadingAction = null;
      },
    });
  }

  async createSetupPassword() {
    if (!isStrongPassword(this.setupPassword)) {
      await this.presentToast(this.t('auth.password_policy'), 'warning');
      return;
    }

    if (this.setupPassword !== this.setupPasswordConfirmation) {
      await this.presentToast(this.t('login.password_mismatch'), 'warning');
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
          await this.presentToast(this.t('login.password_created'), 'success');
          void this.router.navigateByUrl(this.postLoginTarget(res.data.user), { replaceUrl: true });
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
    this.passwordVisibility.setup = false;
    this.passwordVisibility.setupConfirmation = false;
  }

  private postLoginTarget(user?: User | null): string {
    return user?.kyc_required && !user?.kyc_submitted ? '/kyc' : '/tabs/dashboard';
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
