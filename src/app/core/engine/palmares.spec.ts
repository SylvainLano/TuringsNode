import { Level } from './level';
import { groupByWorld } from './worlds';
import { WONKA_MINIMUM_MEDALS, countPalmares, hasPlatinumWorld, isAllChocolate, isAllPlatinum, pickMedalToMelt } from './palmares';

const level = (levelNumber: number, world: number): Level => ({
  levelNumber, world, name: `level_${levelNumber}`, startScore: 20, minScore: 10, maxScore: null,
  minSteps: 1, goldSteps: 2, silverSteps: 3, bronzeSteps: 4, buttons: [{ name: 'Plus', initialValue: 1 }]
});

describe('Engine palmares', () => {
  it('melts the most beautiful medal first, from the furthest level when several are equal', () => {
    expect(pickMedalToMelt({ 1: 'Platine', 2: 'Or', 3: 'Platine', 4: 'Terminé' })).toBe(3);
    expect(pickMedalToMelt({ 1: 'Platine', 2: 'Or', 3: 'Chocolat' })).toBe(1);
    expect(pickMedalToMelt({ 1: 'Chocolat', 2: 'Or', 3: 'Chocolat' })).toBe(2);
  });

  it('only melts a medal among the given levels, those of the world being played', () => {
    const results = { 1: 'Platine', 2: 'Or', 3: 'Bronze' };
    expect(pickMedalToMelt(results, [2, 3])).toBe(2);
    expect(pickMedalToMelt(results, [4, 5])).toBeUndefined();
  });

  it('has nothing to melt without a real medal left', () => {
    expect(pickMedalToMelt({})).toBeUndefined();
    expect(pickMedalToMelt({ 1: 'Terminé', 2: 'Chocolat' })).toBeUndefined();
  });

  it('counts every result, chocolate included', () => {
    const results = { 1: 'Platine', 2: 'Or', 3: 'Chocolat', 4: 'Terminé', 5: 'Chocolat' };
    expect(countPalmares(results)).toEqual({ Platine: 1, Or: 1, Argent: 0, Bronze: 0, Chocolat: 2, Terminé: 1 });
  });

  it('only calls it all chocolate once enough medals have melted and no real one is left', () => {
    expect(isAllChocolate({ 1: 'Chocolat', 2: 'Chocolat' })).toBe(false);

    const many: Record<number, string> = { 100: 'Terminé' };
    for (let levelNumber = 1; levelNumber <= WONKA_MINIMUM_MEDALS; levelNumber++) many[levelNumber] = 'Chocolat';
    expect(isAllChocolate(many)).toBe(true);
    expect(isAllChocolate({ ...many, 50: 'Bronze' })).toBe(false);
  });

  it('finds a whole level list or a big enough world in platinum', () => {
    const levels = [level(1, 1), level(2, 4), level(3, 4)];
    const worlds = groupByWorld(levels);
    expect(isAllPlatinum(levels, { 1: 'Platine', 2: 'Platine', 3: 'Chocolat' })).toBe(false);
    expect(isAllPlatinum(levels, { 1: 'Platine', 2: 'Platine', 3: 'Platine' })).toBe(true);
    expect(hasPlatinumWorld(worlds, { 1: 'Platine' }, 4)).toBe(false);
    expect(hasPlatinumWorld(worlds, { 2: 'Platine', 3: 'Platine' }, 4)).toBe(true);
    expect(hasPlatinumWorld(worlds, { 1: 'Platine' }, 1)).toBe(true);
  });
});
