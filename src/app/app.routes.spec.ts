import { routes } from './app.routes';

describe('app routes', () => {
  it('uses login as the default guest entry point and preserves sync route', () => {
    const emptyRoute = routes.find(route => route.path === '');
    const affiliationRoute = routes.find(route => route.path === 'affiliation');
    const syncRoute = routes.find(route => route.path === 'affiliation/sync');

    expect(emptyRoute?.redirectTo).toBe('login');
    expect(affiliationRoute?.redirectTo).toBe('/login');
    expect(syncRoute?.loadComponent).toEqual(jasmine.any(Function));
  });
});
