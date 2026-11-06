// src/app/app.config.ts

import { ApplicationConfig, isDevMode } from '@angular/core';
import { provideRouter, withNavigationErrorHandler } from '@angular/router';
import { routes } from './app.routes';
import { reloadOnMissingChunk } from './core/missing-chunk';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { APP_BASE_HREF } from '@angular/common';

export const appConfig: ApplicationConfig = {
  providers: [
    // Une page dont le fichier a disparu depuis l'ouverture de l'onglet (mise à jour du jeu) : on recharge
    provideRouter(routes, withNavigationErrorHandler(error => reloadOnMissingChunk(error))),
    provideHttpClient(withXhr()),
    {
      provide: APP_BASE_HREF,
      useValue: isDevMode() ? '/' : '/TuringsNode/'
    }
  ]
};
