import { Level } from './level';
import { World } from './worlds';

// Les vraies médailles, de la moins belle à la plus belle ; « Terminé » n'en est pas une
export const MEDAL_RANKS = ['Bronze', 'Argent', 'Or', 'Platine'] as const;

// Une médaille fondue pour payer une aide devient du chocolat sur son niveau, jusqu'à ce que le joueur regagne
// ce niveau avec une vraie médaille. Elle compte toujours comme niveau terminé
export const CHOCOLATE = 'Chocolat';

export type PalmaresEntry = typeof MEDAL_RANKS[number] | typeof CHOCOLATE | 'Terminé';
export type Palmares = Record<PalmaresEntry, number>;

// Willy Wonka : que du chocolat, mais seulement une fois le jeu bien entamé
export const WONKA_MINIMUM_MEDALS = 18;

const medalRank = (result: string | undefined) => MEDAL_RANKS.indexOf(result as typeof MEDAL_RANKS[number]);

/**
 * Le niveau dont la médaille fond pour payer une aide : la plus belle, et à égalité celle du niveau le plus avancé.
 * Seulement parmi les niveaux donnés (ceux du monde en cours) : la médaille d'un niveau du premier monde, regagnée en
 * un clic, ne peut pas payer toutes les aides du jeu
 */
export function pickMedalToMelt(results: Record<number, string>, among?: number[]): number | undefined {
  return Object.keys(results).map(Number)
    .filter(levelNumber => medalRank(results[levelNumber]) >= 0 && (!among || among.includes(levelNumber)))
    .sort((a, b) => medalRank(results[b]) - medalRank(results[a]) || b - a)[0];
}

/** Le compte des résultats de tous les niveaux */
export function countPalmares(results: Record<number, string>): Palmares {
  const palmares: Palmares = { Platine: 0, Or: 0, Argent: 0, Bronze: 0, Chocolat: 0, Terminé: 0 };
  for (const result of Object.values(results)) {
    if (result in palmares) palmares[result as PalmaresEntry]++;
  }
  return palmares;
}

/** Plus une seule vraie médaille, et assez de chocolat pour que ce soit une vocation */
export function isAllChocolate(results: Record<number, string>): boolean {
  const palmares = countPalmares(results);
  return palmares.Chocolat >= WONKA_MINIMUM_MEDALS && MEDAL_RANKS.every(medal => palmares[medal] === 0);
}

/** Tous les niveaux en platine */
export function isAllPlatinum(levels: Level[], results: Record<number, string>): boolean {
  return levels.length > 0 && levels.every(level => results[level.levelNumber] === 'Platine');
}

/** Un monde assez grand entièrement en platine */
export function hasPlatinumWorld(worlds: World[], results: Record<number, string>, fromWorld: number): boolean {
  return worlds.some(world => world.number >= fromWorld && isAllPlatinum(world.levels, results));
}
