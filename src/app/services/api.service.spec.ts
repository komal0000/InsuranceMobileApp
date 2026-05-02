import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiService } from './api.service';

describe('ApiService', () => {
  let http: jasmine.SpyObj<{ get: (...args: unknown[]) => unknown }>;

  beforeEach(() => {
    sessionStorage.clear();
    http = jasmine.createSpyObj('HttpClient', ['get']);
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

    const service = new ApiService(http as any);
    service.get('/health').subscribe(() => {
      expect(sessionStorage.getItem('hib_api_preferred_base_url')).toBe(workingBaseUrl);
      done();
    });
  });

  it('tries the session preferred development base URL first', (done) => {
    const preferredBaseUrl = environment.apiUrls[2].replace(/\/+$/, '');
    sessionStorage.setItem('hib_api_preferred_base_url', preferredBaseUrl);
    http.get.and.returnValue(of({ success: true }));

    const service = new ApiService(http as any);
    service.get('/health').subscribe(() => {
      expect(String(http.get.calls.first().args[0])).toBe(`${preferredBaseUrl}/health`);
      done();
    });
  });
});
