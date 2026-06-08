import { HttpErrorResponse } from '@angular/common/http';
import { HttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiService } from './api.service';

describe('ApiService', () => {
  let http: jasmine.SpyObj<{ get: (...args: unknown[]) => unknown }>;

  beforeEach(() => {
    TestBed.resetTestingModule();
    sessionStorage.clear();
    http = jasmine.createSpyObj('HttpClient', ['get']);
    TestBed.configureTestingModule({
      providers: [{ provide: HttpClient, useValue: http }],
    });
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it('persists the working development base URL for the browser session', (done) => {
    const workingBaseUrl = environment.apiUrls[1].replace(/\/+$/, '');

    http.get.and.callFake((url: unknown) => {
      const requestUrl = String(url);
      if (requestUrl.startsWith(environment.apiUrls[0])) {
        return throwError(() => new HttpErrorResponse({ status: 0 }));
      }

      return of({ success: true });
    });

    const service = TestBed.inject(ApiService);
    service.get('/health').subscribe(() => {
      expect(sessionStorage.getItem('hib_api_preferred_base_url')).toBe(workingBaseUrl);
      done();
    });
  });

  it('tries the session preferred development base URL first', (done) => {
    const preferredBaseUrl = environment.apiUrls[2].replace(/\/+$/, '');
    sessionStorage.setItem('hib_api_preferred_base_url', preferredBaseUrl);
    http.get.and.returnValue(of({ success: true }));

    const service = TestBed.inject(ApiService);
    service.get('/health').subscribe(() => {
      expect(String(http.get.calls.first().args[0])).toBe(`${preferredBaseUrl}/health`);
      done();
    });
  });

  it('maps web document URLs to authenticated API document URLs', () => {
    const service = TestBed.inject(ApiService);
    const apiBaseUrl = service.getApiBaseUrl();
    const serverBaseUrl = apiBaseUrl.replace(/\/api$/, '');

    expect(service.formatImageUrl('/documents/member/12/photo.jpg'))
      .toBe(`${serverBaseUrl}/api/documents/member/12/photo.jpg`);
    expect(service.formatImageUrl('documents/enrollment/34/evidence.jpg'))
      .toBe(`${serverBaseUrl}/api/documents/enrollment/34/evidence.jpg`);
  });

  it('rebases absolute web document URLs to the active API host', () => {
    const service = TestBed.inject(ApiService);
    const apiBaseUrl = service.getApiBaseUrl();
    const serverBaseUrl = apiBaseUrl.replace(/\/api$/, '');

    expect(service.formatImageUrl('https://old.example.test/documents/member/12/photo.jpg?download=1'))
      .toBe(`${serverBaseUrl}/api/documents/member/12/photo.jpg?download=1`);
  });

  it('preserves data, blob, file, and public absolute image URLs', () => {
    const service = TestBed.inject(ApiService);

    expect(service.formatImageUrl('data:image/png;base64,abc')).toBe('data:image/png;base64,abc');
    expect(service.formatImageUrl('blob:http://localhost/id')).toBe('blob:http://localhost/id');
    expect(service.formatImageUrl('file:///tmp/photo.jpg')).toBe('file:///tmp/photo.jpg');
    expect(service.formatImageUrl('https://cdn.example.test/photos/photo.jpg')).toBe('https://cdn.example.test/photos/photo.jpg');
  });
});
