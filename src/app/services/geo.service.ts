import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { shareReplay } from 'rxjs/operators';
import { ApiService } from './api.service';
import { ApiResponse } from '../interfaces/api-response.interface';
import { ServicePointOption } from '../interfaces/enrollment.interface';

@Injectable({ providedIn: 'root' })
export class GeoService {
  private api = inject(ApiService);

  private readonly cache = new Map<string, Observable<ApiResponse<unknown>>>();

  provinces(): Observable<ApiResponse<string[]>> {
    return this.cached<string[]>('/geo/provinces');
  }

  districts(province: string): Observable<ApiResponse<string[]>> {
    return this.cached<string[]>(`/geo/districts/${encodeURIComponent(province)}`);
  }

  municipalities(province: string, district: string): Observable<ApiResponse<string[]>> {
    return this.cached<string[]>(`/geo/municipalities/${encodeURIComponent(province)}/${encodeURIComponent(district)}`);
  }

  wards(province: string, district: string, municipality: string): Observable<ApiResponse<string[]>> {
    return this.cached<string[]>(`/geo/wards/${encodeURIComponent(province)}/${encodeURIComponent(district)}/${encodeURIComponent(municipality)}`);
  }

  servicePoints(province: string, district: string): Observable<ApiResponse<ServicePointOption[]>> {
    return this.cached<ServicePointOption[]>(`/geo/service-points/${encodeURIComponent(province)}/${encodeURIComponent(district)}`);
  }

  clearCache(): void {
    this.cache.clear();
  }

  private cached<T>(path: string): Observable<ApiResponse<T>> {
    const existing = this.cache.get(path);

    if (existing) {
      return existing as Observable<ApiResponse<T>>;
    }

    const request = this.api.get<ApiResponse<T>>(path).pipe(
      shareReplay({ bufferSize: 1, refCount: false })
    );

    this.cache.set(path, request as Observable<ApiResponse<unknown>>);

    return request;
  }
}
