import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { ApiResponse } from '../interfaces/api-response.interface';

@Injectable({ providedIn: 'root' })
export class GeoService {
  constructor(private api: ApiService) {}

  provinces(): Observable<ApiResponse<string[]>> {
    return this.api.get<ApiResponse<string[]>>('/geo/provinces');
  }

  districts(province: string): Observable<ApiResponse<string[]>> {
    return this.api.get<ApiResponse<string[]>>(`/geo/districts/${encodeURIComponent(province)}`);
  }

  municipalities(province: string, district: string): Observable<ApiResponse<string[]>> {
    return this.api.get<ApiResponse<string[]>>(
      `/geo/municipalities/${encodeURIComponent(province)}/${encodeURIComponent(district)}`
    );
  }

  wards(province: string, district: string, municipality: string): Observable<ApiResponse<string[]>> {
    return this.api.get<ApiResponse<string[]>>(
      `/geo/wards/${encodeURIComponent(province)}/${encodeURIComponent(district)}/${encodeURIComponent(municipality)}`
    );
  }
}
