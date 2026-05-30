import { of } from 'rxjs';
import { TestBed } from '@angular/core/testing';
import { PolicyService } from './policy.service';
import { ApiService } from './api.service';

describe('PolicyService', () => {
  it('loads and normalizes the current policy payload', (done) => {
    const api = jasmine.createSpyObj('ApiService', ['get']);
    api.get.and.returnValue(of({
      success: true,
      data: {
        policy: { enrollment_id: 12, status: 'active' },
        history: [{ id: 1 }],
      },
    }));

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [{ provide: ApiService, useValue: api }],
    });
    const service = TestBed.inject(PolicyService);

    service.getMyPolicy().subscribe((payload) => {
      expect(api.get).toHaveBeenCalledOnceWith('/my-policy');
      expect(payload.policy?.enrollment_id).toBe(12);
      expect(payload.history).toEqual([{ id: 1 }]);
      done();
    });
  });

  it('uses empty defaults when the API omits optional payload fields', (done) => {
    const api = jasmine.createSpyObj('ApiService', ['get']);
    api.get.and.returnValue(of({ success: true, data: {} }));

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [{ provide: ApiService, useValue: api }],
    });
    const service = TestBed.inject(PolicyService);

    service.getMyPolicy().subscribe((payload) => {
      expect(payload.policy).toBeNull();
      expect(payload.history).toEqual([]);
      done();
    });
  });
});
