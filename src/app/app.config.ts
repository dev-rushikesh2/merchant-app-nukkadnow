import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { tenantHeaderInterceptor } from './core/http/tenant-header.interceptor';
import { errorInterceptor } from './core/http/error.interceptor';
import { baseUrlInterceptor } from './core/http/base-url.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(
      // Order matters: baseUrl runs first (prepends gateway URL),
      // then tenantHeader adds auth/tenant headers, then error handles failures.
      withInterceptors([baseUrlInterceptor, tenantHeaderInterceptor, errorInterceptor])
    )
  ]
};
