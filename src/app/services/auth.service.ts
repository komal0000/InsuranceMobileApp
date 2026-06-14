import { Injectable, inject } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { BehaviorSubject, Observable, from, of, throwError } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { catchError } from 'rxjs/operators';
import { SecureStorage } from '@aparajita/capacitor-secure-storage';
import { Preferences } from '@capacitor/preferences';
import { environment } from '../../environments/environment';
import {
  User,
  AffiliationCompleteData,
  AffiliationCompleteRequest,
  AffiliationOtpData,
  AffiliationOtpRequest,
  AffiliationResetPhoneData,
  AffiliationResetPhoneRequest,
  AffiliationPasswordData,
  AffiliationPasswordRequest,
  AffiliationSyncData,
  AffiliationSyncRequest,
  AuthData,
  LoginRequest,
  RegisterRequest,
  PendingRegistrationData,
  SendOtpRequest,
  VerifyOtpRequest,
  SetPasswordRequest,
  LoginSetupOtpSendRequest,
  LoginSetupOtpVerifyRequest,
  LoginSetupPasswordCreateRequest,
  PasswordOtpSendRequest,
  PasswordOtpVerifyRequest,
  PasswordOtpResetRequest,
  PasswordEmailResetRequest,
} from '../interfaces/user.interface';
import { ApiResponse } from '../interfaces/api-response.interface';
import { ApiService } from './api.service';
import { AppLanguage, LanguageService } from './language.service';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';
const AFFILIATION_SETUP_KEY = 'affiliation_setup';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = inject(ApiService);
  private languageService = inject(LanguageService);

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private tokenSubject = new BehaviorSubject<string | null>(null);
  private initialized = false;
  private persistedSecureSession = false;
  private pendingAffiliationSetup: AffiliationSyncData | null = null;

  currentUser$ = this.currentUserSubject.asObservable();
  isAuthenticated$ = this.tokenSubject.pipe(map(t => !!t));

  async init(): Promise<void> {
    if (this.initialized) return;

    const { token, userJson, persisted } = await this.loadStoredSession();
    this.persistedSecureSession = persisted;

    if (token) {
      this.tokenSubject.next(token);
      if (userJson) {
        try {
          const user = JSON.parse(userJson) as User;
          this.currentUserSubject.next(user);
          this.languageService.useUserPreference(user.preferred_language);
        } catch {
          this.currentUserSubject.next(null);
        }
      }
    }
    await this.clearLegacyPreferences();
    this.initialized = true;
  }

  getToken(): string | null {
    return this.tokenSubject.value;
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    return !!this.tokenSubject.value;
  }

  hasRole(...roles: string[]): boolean {
    const user = this.currentUserSubject.value;
    return user ? roles.includes(user.role) : false;
  }

  hasPermission(permission: string): boolean {
    const user = this.currentUserSubject.value;
    return user ? user.permissions?.includes(permission) : false;
  }

  login(data: LoginRequest): Observable<ApiResponse<AuthData>> {
    const remember = data.remember ?? false;
    return this.api.post<ApiResponse<AuthData>>('/login', data).pipe(
      switchMap(res => {
        if (!res.success) {
          return of(res);
        }

        return from(this.setSession(res.data, remember)).pipe(
          map(() => res)
        );
      })
    );
  }

  registerBeneficiary(data: RegisterRequest): Observable<ApiResponse<PendingRegistrationData>> {
    return this.api.post<ApiResponse<PendingRegistrationData>>('/register', data);
  }

  sendRegistrationOtp(data: SendOtpRequest): Observable<ApiResponse<PendingRegistrationData>> {
    return this.api.post<ApiResponse<PendingRegistrationData>>('/register/send-otp', data);
  }

  verifyRegistrationOtp(data: VerifyOtpRequest): Observable<ApiResponse<PendingRegistrationData>> {
    return this.api.post<ApiResponse<PendingRegistrationData>>('/register/verify-otp', data);
  }

  setRegistrationPassword(data: SetPasswordRequest): Observable<ApiResponse<PendingRegistrationData>> {
    return this.api.post<ApiResponse<PendingRegistrationData>>('/register/set-password', data);
  }

  sendLoginSetupOtp(data: LoginSetupOtpSendRequest): Observable<ApiResponse<PendingRegistrationData>> {
    return this.api.post<ApiResponse<PendingRegistrationData>>('/login/otp/send', data);
  }

  verifyLoginSetupOtp(data: LoginSetupOtpVerifyRequest): Observable<ApiResponse<PendingRegistrationData>> {
    return this.api.post<ApiResponse<PendingRegistrationData>>('/login/otp/verify', data);
  }

  createLoginSetupPassword(data: LoginSetupPasswordCreateRequest): Observable<ApiResponse<AuthData>> {
    const remember = data.remember ?? false;
    return this.api.post<ApiResponse<AuthData>>('/login/password/create', data).pipe(
      switchMap(res => {
        if (!res.success) {
          return of(res);
        }

        return from(this.setSession(res.data, remember)).pipe(
          map(() => res)
        );
      })
    );
  }

  affiliationSync(data: AffiliationSyncRequest): Observable<ApiResponse<AffiliationSyncData>> {
    return this.api.post<ApiResponse<AffiliationSyncData>>('/affiliation/sync', {
      household_head_hib_number: data.household_head_hib_number,
      member_hib_number: data.member_hib_number,
    });
  }

  affiliationSendOtp(data: AffiliationOtpRequest): Observable<ApiResponse<AffiliationOtpData>> {
    return this.api.post<ApiResponse<AffiliationOtpData>>('/affiliation/otp/send', data);
  }

  affiliationResetPhone(data: AffiliationResetPhoneRequest): Observable<ApiResponse<AffiliationResetPhoneData>> {
    return this.api.post<ApiResponse<AffiliationResetPhoneData>>('/affiliation/otp/reset', data);
  }

  affiliationComplete(data: AffiliationCompleteRequest): Observable<ApiResponse<AffiliationCompleteData>> {
    const remember = data.remember ?? false;
    const payload = {
      verification_token: data.verification_token,
      otp: data.otp,
      password: data.password,
      password_confirmation: data.password_confirmation,
      remember,
    };

    return this.api.post<ApiResponse<AffiliationCompleteData>>('/affiliation/complete', payload).pipe(
      switchMap(res => {
        if (!res.success) {
          return of(res);
        }

        return from(this.setSession(res.data, remember)).pipe(
          map(() => res)
        );
      })
    );
  }

  affiliationPassword(data: AffiliationPasswordRequest): Observable<ApiResponse<AffiliationPasswordData>> {
    const remember = data.remember ?? false;

    return this.api.post<ApiResponse<AffiliationPasswordData>>('/affiliation/password', {
      setup_token: data.setup_token,
      password: data.password,
      password_confirmation: data.password_confirmation,
      remember,
    }).pipe(
      switchMap(res => {
        if (!res.success) {
          return of(res);
        }

        return from(this.setSession(res.data, remember)).pipe(
          map(() => res)
        );
      })
    );
  }

  storeAffiliationSetup(data: AffiliationSyncData): void {
    this.pendingAffiliationSetup = data;

    if (this.canUseBrowserSessionStorage()) {
      sessionStorage.setItem(AFFILIATION_SETUP_KEY, JSON.stringify(data));
    }
  }

  getAffiliationSetup(): AffiliationSyncData | null {
    if (this.pendingAffiliationSetup) {
      return this.pendingAffiliationSetup;
    }

    if (!this.canUseBrowserSessionStorage()) {
      return null;
    }

    const value = sessionStorage.getItem(AFFILIATION_SETUP_KEY);
    if (!value) {
      return null;
    }

    try {
      return JSON.parse(value) as AffiliationSyncData;
    } catch {
      sessionStorage.removeItem(AFFILIATION_SETUP_KEY);
      return null;
    }
  }

  clearAffiliationSetup(): void {
    this.pendingAffiliationSetup = null;

    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(AFFILIATION_SETUP_KEY);
    }
  }

  sendPasswordOtp(data: PasswordOtpSendRequest): Observable<ApiResponse<{ mobile_number: string; expires_at?: string }>> {
    return this.api.post<ApiResponse<{ mobile_number: string; expires_at?: string }>>('/password/otp/send', data);
  }

  verifyPasswordOtp(data: PasswordOtpVerifyRequest): Observable<ApiResponse<{ mobile_number: string }>> {
    return this.api.post<ApiResponse<{ mobile_number: string }>>('/password/otp/verify', data);
  }

  resetPasswordWithOtp(data: PasswordOtpResetRequest): Observable<ApiResponse<void>> {
    return this.api.post<ApiResponse<void>>('/password/otp/reset', data);
  }

  sendPasswordResetEmail(data: PasswordEmailResetRequest): Observable<ApiResponse<void>> {
    return this.api.post<ApiResponse<void>>('/password/email', data);
  }

  logout(): Observable<any> {
    return this.api.post('/logout', {}).pipe(
      switchMap(res =>
        from(this.clearSession()).pipe(
          map(() => res)
        )
      ),
      catchError((error) =>
        from(this.clearSession()).pipe(
          switchMap(() => throwError(() => error))
        )
      )
    );
  }

  fetchProfile(): Observable<User> {
    return this.api.get<ApiResponse<User>>('/user').pipe(
      map(res => res.data),
      tap(user => {
        this.currentUserSubject.next(user);
        this.languageService.useUserPreference(user.preferred_language);
        void this.persistUserSnapshot(user);
      })
    );
  }

  updateLanguage(language: AppLanguage): Observable<User> {
    return this.languageService.setLanguage(language).pipe(
      tap(user => {
        const updatedUser = { ...(this.currentUserSubject.value || user), ...user };
        this.currentUserSubject.next(updatedUser);
        void this.persistUserSnapshot(updatedUser);
      })
    );
  }

  async clearSession(): Promise<void> {
    this.tokenSubject.next(null);
    this.currentUserSubject.next(null);
    this.persistedSecureSession = false;
    this.clearBrowserSession();
    await this.clearSecureSession();
    await this.clearLegacyPreferences();
  }

  private async setSession(auth: AuthData, remember: boolean = true): Promise<void> {
    this.tokenSubject.next(auth.token);
    this.currentUserSubject.next(auth.user);
    this.languageService.useUserPreference(auth.user.preferred_language);
    this.persistedSecureSession = remember && this.canUseNativeSecureStorage();

    if (this.canUseBrowserSessionStorage()) {
      sessionStorage.setItem(TOKEN_KEY, auth.token);
      sessionStorage.setItem(USER_KEY, JSON.stringify(auth.user));
    } else {
      this.clearBrowserSession();
    }

    if (this.persistedSecureSession) {
      await SecureStorage.setItem(TOKEN_KEY, auth.token);
      await SecureStorage.setItem(USER_KEY, JSON.stringify(auth.user));
    } else {
      await this.clearSecureSession();
    }

    await this.clearLegacyPreferences();
  }

  private async loadStoredSession(): Promise<{ token: string | null; userJson: string | null; persisted: boolean }> {
    if (this.canUseBrowserSessionStorage()) {
      const token = sessionStorage.getItem(TOKEN_KEY);
      const userJson = sessionStorage.getItem(USER_KEY);
      if (token) {
        return { token, userJson, persisted: false };
      }
    }

    if (!this.canUseNativeSecureStorage()) {
      return { token: null, userJson: null, persisted: false };
    }

    const token = await SecureStorage.getItem(TOKEN_KEY);
    const userJson = await SecureStorage.getItem(USER_KEY);
    if (typeof token === 'string' && token) {
      return {
        token,
        userJson: typeof userJson === 'string' ? userJson : null,
        persisted: true,
      };
    }

    return this.migrateLegacyPreferenceSession();
  }

  private async migrateLegacyPreferenceSession(): Promise<{ token: string | null; userJson: string | null; persisted: boolean }> {
    const prefToken = await Preferences.get({ key: TOKEN_KEY });
    if (!prefToken.value) {
      return { token: null, userJson: null, persisted: false };
    }

    const prefUser = await Preferences.get({ key: USER_KEY });
    await SecureStorage.setItem(TOKEN_KEY, prefToken.value);
    if (prefUser.value) {
      await SecureStorage.setItem(USER_KEY, prefUser.value);
    }

    return { token: prefToken.value, userJson: prefUser.value, persisted: true };
  }

  private async persistUserSnapshot(user: User): Promise<void> {
    const userJson = JSON.stringify(user);
    if (this.canUseBrowserSessionStorage()) {
      sessionStorage.setItem(USER_KEY, userJson);
    }

    if (this.persistedSecureSession) {
      await SecureStorage.setItem(USER_KEY, userJson);
    }

    await Preferences.remove({ key: USER_KEY });
  }

  private canUseNativeSecureStorage(): boolean {
    return Capacitor.isNativePlatform();
  }

  private canUseBrowserSessionStorage(): boolean {
    return !environment.production
      && !this.canUseNativeSecureStorage()
      && typeof sessionStorage !== 'undefined';
  }

  private clearBrowserSession(): void {
    if (typeof sessionStorage === 'undefined') {
      return;
    }

    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
  }

  private async clearSecureSession(): Promise<void> {
    if (!this.canUseNativeSecureStorage()) {
      return;
    }

    await SecureStorage.removeItem(TOKEN_KEY);
    await SecureStorage.removeItem(USER_KEY);
  }

  private async clearLegacyPreferences(): Promise<void> {
    await Preferences.remove({ key: TOKEN_KEY });
    await Preferences.remove({ key: USER_KEY });
  }
}
