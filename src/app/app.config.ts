import { ApplicationConfig } from '@angular/core';
import { provideRouter, withInMemoryScrolling, withViewTransitions } from '@angular/router';
import { provideHttpClient, HTTP_INTERCEPTORS, withInterceptorsFromDi } from '@angular/common/http';
import { appRoutes } from './app.routes';
import { ErrorInterceptor } from './core/interceptors/error.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(
      appRoutes,
      withInMemoryScrolling({ scrollPositionRestoration: 'top' }),
      withViewTransitions(),
    ),
    provideHttpClient(withInterceptorsFromDi()),
    { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },
  ],
};