// src/app/app.config.ts

import { ApplicationConfig, inject, isDevMode, provideAppInitializer } from '@angular/core';
import { provideRouter, withNavigationErrorHandler } from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';
import { routes } from './app.routes';
import { reloadOnMissingChunk } from './core/missing-chunk';
import { AppUpdateService } from './core/services/app-update';
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
    },
    // Jouer hors ligne : le jeu se garde en cache (seulement une fois publié, pas en développement),
    // et une nouvelle version s'installe au changement de page suivant
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000'
    }),
    provideAppInitializer(() => inject(AppUpdateService).start())
  ]
};
