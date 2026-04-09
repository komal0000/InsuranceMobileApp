import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly baseUrls = this.resolveBaseUrls();

  constructor(private http: HttpClient) {}

  get<T>(path: string, params?: Record<string, any>): Observable<T> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }
    return this.requestWithFallback<T>(baseUrl =>
      this.http.get<T>(this.buildUrl(baseUrl, path), { params: httpParams })
    );
  }

  post<T>(path: string, body: any): Observable<T> {
    return this.requestWithFallback<T>(baseUrl =>
      this.http.post<T>(this.buildUrl(baseUrl, path), body)
    );
  }

  put<T>(path: string, body: any): Observable<T> {
    return this.requestWithFallback<T>(baseUrl =>
      this.http.put<T>(this.buildUrl(baseUrl, path), body)
    );
  }

  patch<T>(path: string, body?: any): Observable<T> {
    return this.requestWithFallback<T>(baseUrl =>
      this.http.patch<T>(this.buildUrl(baseUrl, path), body || {})
    );
  }

  delete<T>(path: string, body?: any): Observable<T> {
    return this.requestWithFallback<T>(baseUrl =>
      this.http.delete<T>(this.buildUrl(baseUrl, path), { body })
    );
  }

  postFormData<T>(path: string, formData: FormData): Observable<T> {
    return this.requestWithFallback<T>(baseUrl =>
      this.http.post<T>(this.buildUrl(baseUrl, path), formData)
    );
  }

  putFormData<T>(path: string, formData: FormData): Observable<T> {
    return this.requestWithFallback<T>(baseUrl =>
      this.http.put<T>(this.buildUrl(baseUrl, path), formData)
    );
  }

  private resolveBaseUrls(): string[] {
    const configuredUrls = Array.isArray(environment.apiUrls) && environment.apiUrls.length > 0
      ? environment.apiUrls
      : [environment.apiUrl];

    const normalized = configuredUrls
      .map(url => this.normalizeBaseUrl(url))
      .filter((url): url is string => !!url);

    return normalized.length > 0 ? Array.from(new Set(normalized)) : [''];
  }

  private normalizeBaseUrl(url: string | undefined): string | null {
    if (!url) {
      return null;
    }

    const trimmed = url.trim();
    if (!trimmed) {
      return null;
    }

    return trimmed.replace(/\/+$/, '');
  }

  private buildUrl(baseUrl: string, path: string): string {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${baseUrl}${normalizedPath}`;
  }

  private requestWithFallback<T>(requestFactory: (baseUrl: string) => Observable<T>, index = 0): Observable<T> {
    const baseUrl = this.baseUrls[index] ?? this.baseUrls[0];

    return requestFactory(baseUrl).pipe(
      catchError((error: unknown) => {
        if (this.shouldRetryWithNextBaseUrl(error, index)) {
          return this.requestWithFallback(requestFactory, index + 1);
        }

        return throwError(() => error);
      })
    );
  }

  private shouldRetryWithNextBaseUrl(error: unknown, index: number): boolean {
    const hasNextBaseUrl = index < this.baseUrls.length - 1;
    return hasNextBaseUrl && error instanceof HttpErrorResponse && error.status === 0;
  }
}
