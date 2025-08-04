import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  public readonly message = signal<string | null>(null);
  private timer: any;

  /**
   * Affiche un message de notification pendant une durée déterminée.
   * @param message Le message à afficher.
   * @param duration Durée en millisecondes (par défaut 4000ms).
   */
  public show(message: string, duration: number = 4000): void {
    // Efface le timer précédent s'il y en avait un
    clearTimeout(this.timer);

    // Affiche le nouveau message
    this.message.set(message);

    // Programme la disparition du message
    this.timer = setTimeout(() => {
      this.message.set(null);
    }, duration);
  }
}
