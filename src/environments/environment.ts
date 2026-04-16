// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  apiUrl: 'https://insurance.needtechnosoft.com/api',
  // Ordered by preference for local testing, with production fallback last.
  apiUrls: [
    'http://192.168.254.24:8000/api',
    'http://192.168.254.20:8000/api',
    'http://10.0.2.2:8000/api',
    'http://localhost:8000/api',
    'https://insurance.needtechnosoft.com/api'
  ]
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
