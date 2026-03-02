import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, from, of } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { Preferences } from '@capacitor/preferences';
import { User, AuthData, LoginRequest, RegisterRequest } from '../interfaces/user.interface';
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
    const { value: token } = await Preferences.get({ key: TOKEN_KEY });
    const { value: userJson } = await Preferences.get({ key: USER_KEY });
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
    return this.api.post<ApiResponse<AuthData>>('/login', data).pipe(
      tap(res => {
        if (res.success) {
          this.setSession(res.data);
        }
      })
    );
  }

  register(data: RegisterRequest): Observable<ApiResponse<AuthData>> {
    return this.api.post<ApiResponse<AuthData>>('/register', data).pipe(
      tap(res => {
        if (res.success) {
          this.setSession(res.data);
        }
      })
    );
  }

  logout(): Observable<any> {
    return this.api.post('/logout', {}).pipe(
      tap(() => this.clearSession()),
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
    await Preferences.remove({ key: TOKEN_KEY });
    await Preferences.remove({ key: USER_KEY });
  }

  private async setSession(auth: AuthData): Promise<void> {
    this.tokenSubject.next(auth.token);
    this.currentUserSubject.next(auth.user);
    await Preferences.set({ key: TOKEN_KEY, value: auth.token });
    await Preferences.set({ key: USER_KEY, value: JSON.stringify(auth.user) });
  }
}
