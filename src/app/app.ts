import { Component, computed, effect, Renderer2, RendererStyleFlags2, signal, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { BackgroundService } from './core/services/background';
import { FaviconService } from './core/services/favicon';
import { ParticlesBackgroundComponent } from './shared/components/particles-background/particles-background';
import { NotificationComponent } from './shared/components/notification/notification';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    ParticlesBackgroundComponent,
    NotificationComponent
],
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './app.scss'
})

export class App {
  // Votre signal de titre ne change pas
  protected readonly title = signal('TuringsNode');

  // Cette propriété nous aidera à garder une trace de la classe actuelle
  private currentBackgroundClass = '';

  // Ce signal est toujours utile pour notre template (*ngIf)
  public readonly backgroundType = computed(() => this.backgroundService.state().type);

  constructor(
    private backgroundService: BackgroundService,
    private renderer: Renderer2, // On injecte Renderer2 pour manipuler le DOM
    faviconService: FaviconService
  ) {
    // Un chiffre au hasard dans l'onglet à chaque visite
    faviconService.showRandomDigit();

    // Cet `effect` est la nouvelle logique clé.
    // Il s'exécute automatiquement chaque fois que le signal `state` du service change.
    effect(() => {
      const state = this.backgroundService.state();

      // On retire l'ancienne classe CSS du <body>
      if (this.currentBackgroundClass) {
        this.renderer.removeClass(document.body, this.currentBackgroundClass);
      }

      // Couleur de texte lisible sur le fond actuel (sombre sur fond clair, claire sur fond sombre),
      // reprise par les titres et les boutons secondaires de toutes les pages
      if (state.scoreColor) {
        this.renderer.setStyle(document.documentElement, '--theme-text-color', state.scoreColor, RendererStyleFlags2.DashCase);
      }
    });
  }
}
