import { Level } from './level';
import { getVisibleWorlds, groupByWorld, isWorldComplete } from './worlds';

const level = (levelNumber: number, world: number): Level => ({
  levelNumber, world, name: `level_${levelNumber}`, startScore: 20, minScore: 10, maxScore: null,
  minSteps: 1, goldSteps: 2, silverSteps: 3, bronzeSteps: 4, buttons: [{ name: 'Plus', initialValue: 1 }]
});
const LEVELS = [level(1, 1), level(2, 1), level(3, 2), level(4, 2), level(5, 2), level(6, 3)];

describe('Engine worlds', () => {
  it('groups the levels by world', () => {
    const worlds = groupByWorld(LEVELS);
    expect(worlds.map(world => [world.number, world.levels.length])).toEqual([[1, 2], [2, 3], [3, 1]]);
  });

  it('completes a world when every level has a result, whatever the medal', () => {
    const [first] = groupByWorld(LEVELS);
    expect(isWorldComplete(first, { 1: 'Platine' })).toBe(false);
    expect(isWorldComplete(first, { 1: 'Platine', 2: 'Terminé' })).toBe(true);
  });

  it('only shows a world once the previous one is complete', () => {
    const worlds = groupByWorld(LEVELS);
    const visible = (results: Record<number, string>) => getVisibleWorlds(worlds, results).map(world => world.number);
    expect(visible({})).toEqual([1]);
    expect(visible({ 1: 'Or', 2: 'Bronze' })).toEqual([1, 2]);
    expect(visible({ 1: 'Or', 2: 'Bronze', 3: 'Or', 4: 'Or', 5: 'Or' })).toEqual([1, 2, 3]);
  });
});
