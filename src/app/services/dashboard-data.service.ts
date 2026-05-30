import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { finalize, shareReplay, tap } from 'rxjs/operators';
import { ApiResponse } from '../interfaces/api-response.interface';
import { DashboardData, InsuranceCheckResult } from '../interfaces/dashboard.interface';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import { nidLookupValue } from '../utils/nid-number.util';

@Injectable({ providedIn: 'root' })
export class DashboardDataService {
  private api = inject(ApiService);
  private authService = inject(AuthService);

  private cachedResponse: ApiResponse<DashboardData> | null = null;
  private inFlightRequest$: Observable<ApiResponse<DashboardData>> | null = null;
  private cachedUserId: number | null = null;

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

  checkInsurance(nationalId: string): Observable<ApiResponse<InsuranceCheckResult>> {
    return this.api.post<ApiResponse<InsuranceCheckResult>>('/insurance-check', {
      national_id: nidLookupValue(nationalId),
    });
  }

  clear(): void {
    this.cachedResponse = null;
    this.inFlightRequest$ = null;
    this.cachedUserId = null;
  }
}
