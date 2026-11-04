import { provideZoneChangeDetection } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

// Les modules de tsParticles (émetteurs compris) sont chargés par le composant de fond
bootstrapApplication(App, { ...appConfig, providers: [provideZoneChangeDetection(), ...appConfig.providers] })
  .catch((err) => console.error(err));
