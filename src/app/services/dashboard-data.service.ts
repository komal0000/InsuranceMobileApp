import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { finalize, shareReplay, tap } from 'rxjs/operators';
import { ApiResponse } from '../interfaces/api-response.interface';
import { DashboardData } from '../interfaces/dashboard.interface';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class DashboardDataService {
  private cachedResponse: ApiResponse<DashboardData> | null = null;
  private inFlightRequest$: Observable<ApiResponse<DashboardData>> | null = null;
  private cachedUserId: number | null = null;

  constructor(
    private api: ApiService,
    private authService: AuthService
  ) {}

  getDashboard(forceRefresh = false): Observable<ApiResponse<DashboardData>> {
    const userId = this.authService.getCurrentUser()?.id ?? null;

    if (!userId) {
      this.clear();
      return of({ success: true, message: 'No authenticated user', data: {} });
    }

    if (forceRefresh || this.cachedUserId !== userId) {
      this.clear();
    }

    this.cachedUserId = userId;

    if (this.cachedResponse) {
      return of(this.cachedResponse);
    }

    if (this.inFlightRequest$) {
      return this.inFlightRequest$;
    }

    this.inFlightRequest$ = this.api.get<ApiResponse<DashboardData>>(
      '/dashboard',
      forceRefresh ? { refresh: 1 } : undefined
    ).pipe(
      tap((response) => {
        this.cachedResponse = response;
      }),
      finalize(() => {
        this.inFlightRequest$ = null;
      }),
      shareReplay(1)
    );

    return this.inFlightRequest$;
  }

  clear(): void {
    this.cachedResponse = null;
    this.inFlightRequest$ = null;
    this.cachedUserId = null;
  }
}
