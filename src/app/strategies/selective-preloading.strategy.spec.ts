import { of } from 'rxjs';
import { SelectivePreloadingStrategy } from './selective-preloading.strategy';

describe('SelectivePreloadingStrategy', () => {
  let strategy: SelectivePreloadingStrategy;

  beforeEach(() => {
    strategy = new SelectivePreloadingStrategy();
  });

  it('preloads only routes explicitly marked for preload', (done) => {
    const load = jasmine.createSpy('load').and.returnValue(of('loaded'));

    strategy.preload({ data: { preload: true } }, load).subscribe(result => {
      expect(result).toBe('loaded');
      expect(load).toHaveBeenCalled();
      done();
    });
  });

  it('skips unmarked routes', (done) => {
    const load = jasmine.createSpy('load').and.returnValue(of('loaded'));

    strategy.preload({}, load).subscribe(result => {
      expect(result).toBeNull();
      expect(load).not.toHaveBeenCalled();
      done();
    });
  });
});
