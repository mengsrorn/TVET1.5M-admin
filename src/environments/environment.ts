// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
   api_url: 'http://localhost:3000',
  //api_url: 'https://s15-api.myplgs.com',
  file_static_url: 'https://s15-api.myplgs.com/shared/file_data/download/',
  file_streaming_url: 'https://s15-api.myplgs.com/shared/file_data/streaming/'
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
