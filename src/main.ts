import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { tsParticles } from '@tsparticles/engine';
import { loadFull } from 'tsparticles';

// 2. On appelle loadFull pour charger TOUTES les fonctionnalités (y compris les émetteurs)
loadFull(tsParticles).then(() => {
  // ...AVANT de lancer l'application Angular.
  bootstrapApplication(App, appConfig)
    .catch((err) => console.error(err));
});
