import { Injectable, signal } from '@angular/core';

export interface BackgroundState {
  type: 'none' | 'particles';
  value?: any;
  scoreColor?: string;
}

const backgroundConfigs: Record<string, BackgroundState> = {
  'pastel':    { type: 'particles', value: 'pastel',    scoreColor: '#3c4a61' },
  'angry':     { type: 'particles', value: 'angry',     scoreColor: '#3c4a61' },
  'matrix':    { type: 'particles', value: 'matrix',    scoreColor: '#3c4a61' },
  'snow':      { type: 'particles', value: 'snow',      scoreColor: '#3c4a61' },
  'aurea':     { type: 'particles', value: 'snow',      scoreColor: '#3c4a61' },
  'night':     { type: 'particles', value: 'matrix',    scoreColor: '#c7cedb' },
  'neural':    { type: 'particles', value: 'snow',      scoreColor: '#c7cedb' },
  'fireflies': { type: 'particles', value: 'matrix',    scoreColor: '#c7cedb' },
  'bubbles':   { type: 'particles', value: 'snow',      scoreColor: '#c7cedb' },
  'fireworks': { type: 'particles', value: 'snow',      scoreColor: '#c7cedb' },
  'cyberpunk': { type: 'particles', value: 'snow',      scoreColor: '#c7cedb' },
  'burnt':     { type: 'particles', value: 'snow',      scoreColor: '#c7cedb' },
  'abyss':     { type: 'particles', value: 'snow',      scoreColor: '#c7cedb' },
  'constellation':     { type: 'particles', value: 'angry',     scoreColor: '#c7cedb' },
};

@Injectable({
  providedIn: 'root'
})

export class BackgroundService {
  public readonly state = signal<BackgroundState>(backgroundConfigs['pastel']);

  /**
   * Change le fond d'écran actif en utilisant son nom.
   * @param name Le nom du fond à activer (ex: 'matrix', 'pastel', 'none').
   */
  public changeBackground(name: string): void {
    const newConfig = backgroundConfigs[name];

    // On vérifie que la configuration existe et qu'elle est différente de l'actuelle pour éviter des mises à jour inutiles.
    if (newConfig && this.state().value !== newConfig.value) {
      this.state.set(newConfig);
    }
  }
}
