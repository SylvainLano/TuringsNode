import { DEFAULT_MIN_SCORE, Level, applyBouncingBoundaries, getIntroducedButtons, getMedal, getScoreBounds } from './level';

const LEVEL: Level = {
  levelNumber: 1,
  world: 1,
  name: 'tester',
  startScore: 50,
  minScore: 20,
  maxScore: null,
  minSteps: 4,
  goldSteps: 6,
  silverSteps: 10,
  bronzeSteps: 20,
  buttons: []
};

describe('Engine level', () => {
  it('getScoreBounds uses defaults for missing bounds', () => {
    expect(getScoreBounds(LEVEL)).toEqual({ min: 20, max: Number.MAX_SAFE_INTEGER });
    expect(getScoreBounds({ ...LEVEL, minScore: null }).min).toBe(DEFAULT_MIN_SCORE);
    expect(getScoreBounds({ ...LEVEL, minScore: 0 }).min).toBe(0);
    expect(getScoreBounds({ ...LEVEL, maxScore: 500 }).max).toBe(500);
  });

  it('applyBouncingBoundaries bounces on both bounds', () => {
    const bounds = { min: 10, max: 20 };
    expect(applyBouncingBoundaries(15, bounds)).toBe(15);
    expect(applyBouncingBoundaries(10, bounds)).toBe(10);
    expect(applyBouncingBoundaries(20, bounds)).toBe(20);
    expect(applyBouncingBoundaries(25, bounds)).toBe(15);
    expect(applyBouncingBoundaries(7, bounds)).toBe(13);
    expect(applyBouncingBoundaries(35, bounds)).toBe(15);
  });

  it('applyBouncingBoundaries stays exact without an upper bound', () => {
    const bounds = getScoreBounds({ ...LEVEL, minScore: 10 });
    expect(applyBouncingBoundaries(7, bounds)).toBe(13);
    expect(applyBouncingBoundaries(4, bounds)).toBe(16);
    expect(applyBouncingBoundaries(123456, bounds)).toBe(123456);
  });

  it('applyBouncingBoundaries ignores an empty range', () => {
    expect(applyBouncingBoundaries(42, { min: 10, max: 10 })).toBe(42);
  });

  it('getMedal follows the level thresholds', () => {
    expect([4, 5, 6, 7, 10, 11, 20].map(clicks => getMedal(clicks, LEVEL)))
      .toEqual(['Platine', 'Or', 'Or', 'Argent', 'Argent', 'Bronze', 'Bronze']);
    expect(getMedal(21, LEVEL)).toBeNull();
  });
});

describe('Engine introduced buttons', () => {
  const level = (levelNumber: number, names: Level['buttons'][number]['name'][]): Level =>
    ({ ...LEVEL, levelNumber, buttons: names.map(name => ({ name, initialValue: 1 })) });

  it('getIntroducedButtons lists the buttons appearing for the first time in each level', () => {
    const introduced = getIntroducedButtons([
      level(1, ['Split', 'Boost']),
      level(2, ['Boost', 'Split']),
      level(3, ['Primer', 'Split', 'Primer']),
      level(4, ['Split', 'Boost'])
    ]);
    expect([1, 2, 3, 4].map(n => introduced.get(n))).toEqual([['Split', 'Boost'], [], ['Primer'], []]);
  });
});
