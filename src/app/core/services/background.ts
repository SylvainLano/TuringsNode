import { Injectable, signal } from '@angular/core';

export interface BackgroundState {
  type: 'none' | 'particles';
  value?: any;
}

@Injectable({
  providedIn: 'root'
})

export class BackgroundService {
  // On remplace le BehaviorSubject par un signal. C'est notre nouvelle source de vérité.
  public readonly state = signal<BackgroundState>({ type: 'particles', value: 'angry' });

  /**
   * Met à jour le signal avec le nouvel état.
   * @param newState Le nouvel état du fond d'écran.
   */
  public setActiveBackground(newState: BackgroundState): void {
    // On utilise .set() pour changer la valeur du signal
    this.state.set(newState);
  }
}
