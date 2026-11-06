import { Injectable, inject } from '@angular/core';
import { Location } from '@angular/common';
import { NavigationStart, Router } from '@angular/router';
import { SwUpdate } from '@angular/service-worker';
import { filter } from 'rxjs';

/**
 * Le jeu se garde en cache pour être joué hors ligne. Quand une nouvelle version a été téléchargée en arrière-plan,
 * elle s'installe au changement de page suivant (jamais au milieu d'un niveau) : la navigation devient alors un
 * rechargement complet, qui démarre la nouvelle version.
 */
@Injectable({
  providedIn: 'root'
})
export class AppUpdateService {
  private readonly updates = inject(SwUpdate, { optional: true });
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private isUpdateReady = false;
  // Le rechargement complet, remplaçable dans les tests
  public reloadTo = (url: string) => window.location.assign(url);

  public start(): void {
    if (!this.updates?.isEnabled) return; // En développement et dans les tests : pas de cache hors ligne

    this.updates.versionUpdates
      .pipe(filter(event => event.type === 'VERSION_READY'))
      .subscribe(() => this.isUpdateReady = true);

    // Le cache ne correspond plus à rien de cohérent : seul un rechargement complet répare
    this.updates.unrecoverable.subscribe(() => window.location.reload());

    this.router.events
      .pipe(filter(event => event instanceof NavigationStart))
      .subscribe(event => {
        if (this.isUpdateReady) this.reloadTo(this.location.prepareExternalUrl(event.url));
      });
  }
}
