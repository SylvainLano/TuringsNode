// src/app/app.config.ts

import { ApplicationConfig, isDevMode } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { APP_BASE_HREF } from '@angular/common';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withXhr()),
    {
      provide: APP_BASE_HREF,
      useValue: isDevMode() ? '/' : '/TuringsNode/'
    }
  ]
};
