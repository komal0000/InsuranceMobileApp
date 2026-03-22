import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { ApiResponse, PaginatedData } from '../interfaces/api-response.interface';
import {
  Enrollment, EnrollmentConfig, EnrollmentShowResponse, FamilyMember, NidLookupResponse
} from '../interfaces/enrollment.interface';
import { DateService } from './date.service';

@Injectable({ providedIn: 'root' })
export class EnrollmentService {
  private readonly headDateFields = ['date_of_birth', 'citizenship_issue_date'];
  private readonly memberDateFields = [
    'date_of_birth',
    'citizenship_issue_date',
    'birth_certificate_issue_date',
  ];

  constructor(
    private api: ApiService,
    private dateService: DateService
  ) {}

  // ── Config ──────────────────────────────────────────────────

  getConfig(): Observable<ApiResponse<EnrollmentConfig>> {
    return this.api.get<ApiResponse<EnrollmentConfig>>('/enrollment-config');
  }

  // ── CRUD ────────────────────────────────────────────────────

  list(params?: Record<string, any>): Observable<ApiResponse<PaginatedData<Enrollment>>> {
    return this.api.get<ApiResponse<PaginatedData<Enrollment>>>('/enrollments', params);
  }

  get(id: number): Observable<EnrollmentShowResponse> {
    return this.api.get<EnrollmentShowResponse>(`/enrollments/${id}`);
  }

  create(): Observable<ApiResponse<Enrollment>> {
    return this.api.post<ApiResponse<Enrollment>>('/enrollments', { enrollment_type: 'new' });
  }

  // ── Step saves ──────────────────────────────────────────────

  saveStep1(id: number, data: any): Observable<ApiResponse<Enrollment>> {
    return this.api.post<ApiResponse<Enrollment>>(`/enrollments/${id}/step1`, data);
  }

  saveStep2(id: number, formData: FormData): Observable<ApiResponse<Enrollment>> {
    return this.api.postFormData<ApiResponse<Enrollment>>(
      `/enrollments/${id}/step2`,
      this.dateService.prepareFormDataForApi(formData, this.headDateFields)
    );
  }

  // ── Members ─────────────────────────────────────────────────

  addMember(enrollmentId: number, formData: FormData): Observable<ApiResponse<FamilyMember>> {
    return this.api.postFormData<ApiResponse<FamilyMember>>(
      `/enrollments/${enrollmentId}/members`,
      this.dateService.prepareFormDataForApi(formData, this.memberDateFields)
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
