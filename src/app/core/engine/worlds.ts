import { Level } from './level';

// Les mondes n'ont qu'un numéro : ce sont leurs niveaux qui portent des noms
export interface World {
  number: number;
  levels: Level[];
}

/** Niveaux regroupés par monde, dans l'ordre des mondes puis dans celui de la liste */
export function groupByWorld(levels: Level[]): World[] {
  const numbers = [...new Set(levels.map(level => level.world))].sort((a, b) => a - b);
  return numbers.map(number => ({ number, levels: levels.filter(level => level.world === number) }));
}

/** Un monde est terminé quand chacun de ses niveaux a un résultat, quelle que soit la médaille */
export function isWorldComplete(world: World, results: Record<number, string>): boolean {
  return world.levels.every(level => !!results[level.levelNumber]);
}

/** Le premier monde, puis chaque monde dont le précédent est entièrement terminé : les autres restent cachés */
export function getVisibleWorlds(worlds: World[], results: Record<number, string>): World[] {
  const visible: World[] = [];
  for (const world of worlds) {
    visible.push(world);
    if (!isWorldComplete(world, results)) break;
  }
  return visible;
}
