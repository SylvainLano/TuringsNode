import { Injectable, signal } from '@angular/core';

export interface BackgroundState {
  type: 'none' | 'particles';
  value?: any;
  scoreColor?: string;
}

const backgroundConfigs: Record<string, BackgroundState> = {
  'day':    { type: 'particles', value: 'day',    scoreColor: '#3c4a61' },
  'angry':     { type: 'particles', value: 'angry',     scoreColor: '#3c4a61' },
  'matrix':    { type: 'particles', value: 'matrix',    scoreColor: '#3c4a61' },
  'snow':      { type: 'particles', value: 'snow',      scoreColor: '#c7cedb' },
  'aurea':     { type: 'particles', value: 'aurea',      scoreColor: '#3c4a61' },
  'night':     { type: 'particles', value: 'night',    scoreColor: '#c7cedb' },
  'neural':    { type: 'particles', value: 'neural',      scoreColor: '#c7cedb' },
  'fireflies': { type: 'particles', value: 'fireflies',    scoreColor: '#c7cedb' },
  'bubbles':   { type: 'particles', value: 'bubbles',      scoreColor: '#c7cedb' },
  'fireworks': { type: 'particles', value: 'fireworks',      scoreColor: '#c7cedb' },
  'cyberpunk': { type: 'particles', value: 'cyberpunk',      scoreColor: '#c7cedb' },
  'burnt':     { type: 'particles', value: 'burnt',      scoreColor: '#c7cedb' },
  'abyss':     { type: 'particles', value: 'abyss',      scoreColor: '#c7cedb' },
  'constellation':     { type: 'particles', value: 'constellation',     scoreColor: '#c7cedb' },
};

@Injectable({
  providedIn: 'root'
})

export class BackgroundService {
  public readonly state = signal<BackgroundState>(backgroundConfigs['day']);

  /**
   * Change le fond d'écran actif en utilisant son nom.
   * @param name Le nom du fond à activer (ex: 'matrix', 'day', 'none').
   */
  public changeBackground(name: string): void {
    const newConfig = backgroundConfigs[name];

    // On vérifie que la configuration existe et qu'elle est différente de l'actuelle pour éviter des mises à jour inutiles.
    if (newConfig && this.state().value !== newConfig.value) {
      this.state.set(newConfig);
    }
  }

  public getDefaultThemeName(): 'day' | 'night' {
    const now = new Date();
    const currentHour = now.getHours();

    // Calcule le jour de l'année (de 1 à 365)
    const startOfYear = new Date(now.getFullYear(), 0, 0);
    const diff = now.getTime() - startOfYear.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);

    // On définit nos extrêmes pour l'hémisphère Nord
    // Solstice d'hiver (jour ~170, le plus court) : nuit de 17h à 8h
    const winterSunset = 17;
    const winterSunrise = 8;
    // Solstice d'été (jour ~172, le plus long) : nuit de 22h à 5h
    const summerSunset = 22;
    const summerSunrise = 5;

    // On calcule la progression entre l'hiver et l'été.
    // On utilise une fonction cosinus pour une transition douce et cyclique.
    // Le résultat est entre -1 (pic de l'hiver) et 1 (pic de l'été).
    const progress = Math.cos((dayOfYear - 172) * (2 * Math.PI / 365.25));

    // On interpole les heures de lever et de coucher du soleil pour aujourd'hui
    // (progress + 1) / 2 nous donne une valeur de 0 (hiver) à 1 (été)
    const todaySunrise = winterSunrise + (summerSunrise - winterSunrise) * (progress + 1) / 2;
    const todaySunset = winterSunset + (summerSunset - winterSunset) * (progress + 1) / 2;

    // --- POUR L'HÉMISPHÈRE SUD ---
    // Il suffirait d'inverser la progression :
    // const progress = Math.cos((dayOfYear - 172 + 182.625) * (2 * Math.PI / 365.25));
    // Ou plus simplement, d'inverser les valeurs été/hiver au début.

    // On vérifie si l'heure actuelle est dans la plage de la nuit
    if (currentHour >= todaySunset || currentHour < todaySunrise) {
      return 'night';
    }

    return 'day';
  }
}
