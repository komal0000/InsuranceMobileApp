import { of } from 'rxjs';
import { GeoService } from './geo.service';
import { ApiResponse } from '../interfaces/api-response.interface';

describe('GeoService', () => {
  let api: jasmine.SpyObj<{ get: (...args: unknown[]) => unknown }>;
  let service: GeoService;

  beforeEach(() => {
    api = jasmine.createSpyObj('ApiService', ['get']);
    service = new GeoService(api as any);
  });

  it('caches repeated province requests during one app session', (done) => {
    const response: ApiResponse<string[]> = {
      success: true,
      message: 'Loaded.',
      data: ['Koshi'],
    };

    api.get.and.returnValue(of(response));

    let received = 0;
    const assertResult = (result: ApiResponse<string[]>) => {
      expect(result).toEqual(response);
      received += 1;

      if (received === 2) {
        expect(api.get).toHaveBeenCalledTimes(1);
        expect(api.get).toHaveBeenCalledWith('/geo/provinces');
        done();
      }
    };

    service.provinces().subscribe(assertResult);
    service.provinces().subscribe(assertResult);
  });

  it('uses endpoint parameters as separate cache keys', () => {
    api.get.and.returnValue(of({
      success: true,
      message: 'Loaded.',
      data: [],
    }));

    service.districts('Koshi').subscribe();
    service.districts('Bagamati').subscribe();
    service.districts('Koshi').subscribe();

    expect(api.get).toHaveBeenCalledTimes(2);
    expect(api.get).toHaveBeenCalledWith('/geo/districts/Koshi');
    expect(api.get).toHaveBeenCalledWith('/geo/districts/Bagamati');
  });

  it('clears cached requests when requested', () => {
    api.get.and.returnValue(of({
      success: true,
      message: 'Loaded.',
      data: [],
    }));

    service.provinces().subscribe();
    service.clearCache();
    service.provinces().subscribe();

    expect(api.get).toHaveBeenCalledTimes(2);
  });
});
