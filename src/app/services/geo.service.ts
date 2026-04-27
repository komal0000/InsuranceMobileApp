import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { shareReplay } from 'rxjs/operators';
import { ApiService } from './api.service';
import { ApiResponse } from '../interfaces/api-response.interface';

@Injectable({ providedIn: 'root' })
export class GeoService {
  private readonly cache = new Map<string, Observable<ApiResponse<string[]>>>();

  constructor(private api: ApiService) {}

  provinces(): Observable<ApiResponse<string[]>> {
    return this.cached('/geo/provinces');
  }

  districts(province: string): Observable<ApiResponse<string[]>> {
    return this.cached(`/geo/districts/${encodeURIComponent(province)}`);
  }

  municipalities(province: string, district: string): Observable<ApiResponse<string[]>> {
    return this.cached(`/geo/municipalities/${encodeURIComponent(province)}/${encodeURIComponent(district)}`);
  }

  wards(province: string, district: string, municipality: string): Observable<ApiResponse<string[]>> {
    return this.cached(`/geo/wards/${encodeURIComponent(province)}/${encodeURIComponent(district)}/${encodeURIComponent(municipality)}`);
  }

  clearCache(): void {
    this.cache.clear();
  }

  private cached(path: string): Observable<ApiResponse<string[]>> {
    const existing = this.cache.get(path);

    if (existing) {
      return existing;
    }

    const request = this.api.get<ApiResponse<string[]>>(path).pipe(
      shareReplay({ bufferSize: 1, refCount: false })
    );

    this.cache.set(path, request);

    return request;
  }
}
