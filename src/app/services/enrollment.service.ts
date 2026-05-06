import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { shareReplay } from 'rxjs/operators';
import { ApiService } from './api.service';
import { ApiResponse, PaginatedData } from '../interfaces/api-response.interface';
import {
  Enrollment, EnrollmentCardsResponse, EnrollmentConfig, EnrollmentShowResponse, EnrollmentSubmitResponse, FamilyMember, NidLookupResponse
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
  private configRequest$?: Observable<ApiResponse<EnrollmentConfig>>;

  constructor(
    private api: ApiService,
    private dateService: DateService
  ) {}

  // ── Config ──────────────────────────────────────────────────

  getConfig(): Observable<ApiResponse<EnrollmentConfig>> {
    if (!this.configRequest$) {
      this.configRequest$ = this.api.get<ApiResponse<EnrollmentConfig>>('/enrollment-config').pipe(
        shareReplay({ bufferSize: 1, refCount: false })
      );
    }

    return this.configRequest$;
  }

  clearConfigCache(): void {
    this.configRequest$ = undefined;
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

  headNidLookup(id: number, nationalId: string): Observable<NidLookupResponse> {
    return this.api.post<NidLookupResponse>(`/enrollments/${id}/head/nid-lookup`, { national_id: nationalId });
  }

  saveHouseholdHead(id: number, formData: FormData): Observable<ApiResponse<Enrollment>> {
    return this.api.postFormData<ApiResponse<Enrollment>>(
      `/enrollments/${id}/household-head`,
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

  updateMember(enrollmentId: number, memberId: number, formData: FormData): Observable<ApiResponse<FamilyMember>> {
    const prepared = this.dateService.prepareFormDataForApi(formData, this.memberDateFields);
    prepared.append('_method', 'PUT');
    return this.api.postFormData<ApiResponse<FamilyMember>>(
      `/enrollments/${enrollmentId}/members/${memberId}`,
      prepared
    );
  }

  removeMember(enrollmentId: number, memberId: number): Observable<ApiResponse<any>> {
    return this.api.delete<ApiResponse<any>>(`/enrollments/${enrollmentId}/members/${memberId}`);
  }

  // ── Submit ──────────────────────────────────────────────────

  submit(id: number): Observable<EnrollmentSubmitResponse> {
    return this.api.post<EnrollmentSubmitResponse>(`/enrollments/${id}/submit`, {});
  }

  getPdfUrl(id: number): Observable<ApiResponse<{ pdf_download_url: string | null; pdf_generated: boolean }>> {
    return this.api.get<ApiResponse<{ pdf_download_url: string | null; pdf_generated: boolean }>>(`/enrollments/${id}/pdf-url`);
  }

  getCards(id: number): Observable<EnrollmentCardsResponse> {
    return this.api.get<EnrollmentCardsResponse>(`/enrollments/${id}/cards`);
  }

  getAllCardsPdfUrl(id: number): Observable<ApiResponse<{ card_download_url: string | null; card_generated: boolean }>> {
    return this.api.get<ApiResponse<{ card_download_url: string | null; card_generated: boolean }>>(`/enrollments/${id}/cards/pdf-url`);
  }

  getHeadCardPdfUrl(id: number): Observable<ApiResponse<{ card_download_url: string | null; card_generated: boolean }>> {
    return this.api.get<ApiResponse<{ card_download_url: string | null; card_generated: boolean }>>(`/enrollments/${id}/cards/head/pdf-url`);
  }

  getMemberCardPdfUrl(enrollmentId: number, memberId: number): Observable<ApiResponse<{ card_download_url: string | null; card_generated: boolean }>> {
    return this.api.get<ApiResponse<{ card_download_url: string | null; card_generated: boolean }>>(`/enrollments/${enrollmentId}/cards/members/${memberId}/pdf-url`);
  }

  // ── NID Lookup ──────────────────────────────────────────────

  nidLookup(nationalId: string): Observable<NidLookupResponse> {
    return this.api.post<NidLookupResponse>('/nid-lookup', { national_id: nationalId });
  }
}
