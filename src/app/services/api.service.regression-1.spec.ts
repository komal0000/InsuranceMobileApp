import { resolveDevelopmentBrowserApiUrl } from './api.service';

describe('ApiService /qa regression', () => {
  it('prefers the matching browser dev host when Ionic runs on port 8100', () => {
    // Regression: ISSUE-001 - local Ionic registration waited on stale LAN API URLs.
    // Found by /qa on 2026-05-14.
    // Report: .gstack/qa-reports/qa-report-insurance-local-2026-05-14.md
    expect(resolveDevelopmentBrowserApiUrl({
      protocol: 'http:',
      hostname: '127.0.0.1',
      port: '8100',
    } as Location)).toBe('http://127.0.0.1:8000/api');
  });

  it('does not alter API URL order for the Karma test runner', () => {
    expect(resolveDevelopmentBrowserApiUrl({
      protocol: 'http:',
      hostname: 'localhost',
      port: '9876',
    } as Location)).toBeNull();
  });
});
