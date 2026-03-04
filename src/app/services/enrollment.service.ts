import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { ApiResponse, PaginatedData } from '../interfaces/api-response.interface';
import {
  Enrollment, EnrollmentConfig, FamilyMember, NidLookupResponse
} from '../interfaces/enrollment.interface';

@Injectable({ providedIn: 'root' })
export class EnrollmentService {
  constructor(private api: ApiService) {}

  // ── Config ──────────────────────────────────────────────────

  getConfig(): Observable<ApiResponse<EnrollmentConfig>> {
    return this.api.get<ApiResponse<EnrollmentConfig>>('/enrollment-config');
  }

  // ── CRUD ────────────────────────────────────────────────────

  list(params?: Record<string, any>): Observable<ApiResponse<PaginatedData<Enrollment>>> {
    return this.api.get<ApiResponse<PaginatedData<Enrollment>>>('/enrollments', params);
  }

  get(id: number): Observable<ApiResponse<Enrollment>> {
    return this.api.get<ApiResponse<Enrollment>>(`/enrollments/${id}`);
  }

  create(): Observable<ApiResponse<Enrollment>> {
    return this.api.post<ApiResponse<Enrollment>>('/enrollments', { enrollment_type: 'new' });
  }

  // ── Step saves ──────────────────────────────────────────────

  saveStep1(id: number, data: any): Observable<ApiResponse<Enrollment>> {
    return this.api.post<ApiResponse<Enrollment>>(`/enrollments/${id}/step1`, data);
  }

  saveStep2(id: number, formData: FormData): Observable<ApiResponse<Enrollment>> {
    return this.api.postFormData<ApiResponse<Enrollment>>(`/enrollments/${id}/step2`, formData);
  }

  // ── Members ─────────────────────────────────────────────────

  addMember(enrollmentId: number, formData: FormData): Observable<ApiResponse<FamilyMember>> {
    return this.api.postFormData<ApiResponse<FamilyMember>>(
      `/enrollments/${enrollmentId}/members`, formData
    );
  }

  removeMember(enrollmentId: number, memberId: number): Observable<ApiResponse<any>> {
    return this.api.delete<ApiResponse<any>>(`/enrollments/${enrollmentId}/members/${memberId}`);
  }

  // ── Submit ──────────────────────────────────────────────────

  submit(id: number): Observable<ApiResponse<Enrollment>> {
    return this.api.post<ApiResponse<Enrollment>>(`/enrollments/${id}/submit`, {});
  }

  // ── NID Lookup ──────────────────────────────────────────────

  nidLookup(nationalId: string): Observable<NidLookupResponse> {
    return this.api.post<NidLookupResponse>('/nid-lookup', { national_id: nationalId });
  }
}
