import { ButtonName } from './buttons';

export interface LevelButtonConfig {
  name: ButtonName;
  initialValue: number;
}

export interface Level {
  levelNumber: number;
  world: number;
  // Personne à qui le niveau rend hommage : clé de son nom, de son histoire et de la pique de la machine (levels.<name> dans les traductions)
  name: string;
  startScore: number;
  minScore: number | null;
  maxScore: number | null;
  minSteps: number;
  goldSteps: number;
  silverSteps: number;
  bronzeSteps: number;
  buttons: LevelButtonConfig[];
}

export interface ScoreBounds {
  min: number;
  max: number;
}

// Borne basse utilisée quand un niveau ne précise pas de minScore
export const DEFAULT_MIN_SCORE = 10;

export function getScoreBounds(level: Level): ScoreBounds {
  return {
    min: level.minScore ?? DEFAULT_MIN_SCORE,
    max: level.maxScore ?? Number.MAX_SAFE_INTEGER
  };
}

/**
 * Fait "rebondir" un score sur les bornes du niveau.
 * Ex : avec les bornes [10, 20], 25 devient 15 et 7 devient 13.
 */
export function applyBouncingBoundaries(num: number, bounds: ScoreBounds): number {
  const range = bounds.max - bounds.min;

  // Si la plage est nulle ou invalide, on ne fait rien pour éviter les divisions par zéro.
  if (range <= 0) {
    return num;
  }

  // On travaille sur le double de la plage pour simuler l'aller-retour.
  // Le rebond étant symétrique autour de la borne basse, on part de la distance à celle-ci :
  // cela évite d'additionner des nombres au-delà de 2^53, où ils perdent leur précision.
  const remainder = Math.abs(num - bounds.min) % (2 * range);

  return remainder < range
    ? bounds.min + remainder              // Phase "montante" depuis la borne basse
    : bounds.max - (remainder - range);   // Phase "descendante" depuis la borne haute
}

// Les noms restent en français car ils servent de clés de sauvegarde et de traduction
export type Medal = 'Platine' | 'Or' | 'Argent' | 'Bronze';

export function getMedal(clicks: number, level: Level): Medal | null {
  if (clicks <= level.minSteps) return 'Platine';
  if (clicks <= level.goldSteps) return 'Or';
  if (clicks <= level.silverSteps) return 'Argent';
  if (clicks <= level.bronzeSteps) return 'Bronze';
  return null;
}

/** Boutons qui apparaissent pour la première fois dans chaque niveau, en suivant l'ordre de la liste */
export function getIntroducedButtons(levels: Level[]): Map<number, ButtonName[]> {
  const seen = new Set<ButtonName>();
  return new Map(levels.map(level => {
    const introduced = [...new Set(level.buttons.map(button => button.name))].filter(name => !seen.has(name));
    introduced.forEach(name => seen.add(name));
    return [level.levelNumber, introduced] as [number, ButtonName[]];
  }));
}
