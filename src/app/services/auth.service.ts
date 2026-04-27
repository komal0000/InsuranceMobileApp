import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, from, of, throwError } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { catchError } from 'rxjs/operators';
import { Preferences } from '@capacitor/preferences';
import {
  User,
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

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private tokenSubject = new BehaviorSubject<string | null>(null);
  private initialized = false;

  currentUser$ = this.currentUserSubject.asObservable();
  isAuthenticated$ = this.tokenSubject.pipe(map(t => !!t));

  constructor(private api: ApiService) {}

  async init(): Promise<void> {
    if (this.initialized) return;

    let token = sessionStorage.getItem(TOKEN_KEY);
    let userJson = sessionStorage.getItem(USER_KEY);

    if (!token) {
      const prefToken = await Preferences.get({ key: TOKEN_KEY });
      token = prefToken.value;
      const prefUser = await Preferences.get({ key: USER_KEY });
      userJson = prefUser.value;
    }

    if (token) {
      this.tokenSubject.next(token);
      if (userJson) {
        try {
          this.currentUserSubject.next(JSON.parse(userJson));
        } catch {
          this.currentUserSubject.next(null);
        }
      }
    }
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
        Preferences.set({ key: USER_KEY, value: JSON.stringify(user) });
      })
    );
  }

  async clearSession(): Promise<void> {
    this.tokenSubject.next(null);
    this.currentUserSubject.next(null);
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
    await Preferences.remove({ key: TOKEN_KEY });
    await Preferences.remove({ key: USER_KEY });
  }

  private async setSession(auth: AuthData, remember: boolean = true): Promise<void> {
    this.tokenSubject.next(auth.token);
    this.currentUserSubject.next(auth.user);

    sessionStorage.setItem(TOKEN_KEY, auth.token);
    sessionStorage.setItem(USER_KEY, JSON.stringify(auth.user));

    if (remember) {
      await Preferences.set({ key: TOKEN_KEY, value: auth.token });
      await Preferences.set({ key: USER_KEY, value: JSON.stringify(auth.user) });
    } else {
      await Preferences.remove({ key: TOKEN_KEY });
      await Preferences.remove({ key: USER_KEY });
    }
  }
}
