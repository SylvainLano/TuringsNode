import levelsData from '../../../assets/levels.json';
import fr from '../../../assets/i18n/fr.json';
import en from '../../../assets/i18n/en.json';
import { BUTTON_NAMES, MAX_BUTTON_VALUE, MIN_BUTTON_VALUE } from './buttons';
import { Level } from './level';
import { groupByWorld } from './worlds';

// Vérifications de structure des niveaux livrés avec le jeu
const LEVELS = levelsData as Level[];
type LevelTexts = Record<string, { name: string; story: string; jab: string }>;

describe('levels.json', () => {
  it('numbers the levels from 1 without gaps', () => {
    expect(LEVELS.map(level => level.levelNumber)).toEqual(LEVELS.map((_, i) => i + 1));
  });

  it('only uses known buttons with values from 1 to 9', () => {
    LEVELS.forEach(level => level.buttons.forEach(button => {
      expect(BUTTON_NAMES).toContain(button.name);
      expect(button.initialValue).toBeGreaterThanOrEqual(MIN_BUTTON_VALUE);
      expect(button.initialValue).toBeLessThanOrEqual(MAX_BUTTON_VALUE);
    }));
  });

  it('has increasing medal thresholds', () => {
    LEVELS.forEach(level => {
      expect(level.minSteps).toBeLessThanOrEqual(level.goldSteps);
      expect(level.goldSteps).toBeLessThanOrEqual(level.silverSteps);
      expect(level.silverSteps).toBeLessThanOrEqual(level.bronzeSteps);
    });
  });
});

describe('levels.json worlds', () => {
  it('gives every level a world, numbered from 1 without gaps and in order', () => {
    const worlds = LEVELS.map(level => level.world);
    expect(worlds.every(world => Number.isInteger(world))).toBe(true);
    expect(worlds[0]).toBe(1);
    worlds.slice(1).forEach((world, i) => expect([worlds[i], worlds[i] + 1]).toContain(world));
  });

  it('sizes the worlds along the Fibonacci sequence (2, 3, 5, 8, 13…)', () => {
    const sizes = groupByWorld(LEVELS).map(world => world.levels.length);
    expect(sizes.slice(0, 2)).toEqual([2, 3]);
    sizes.slice(2).forEach((size, i) => expect(size).toBe(sizes[i] + sizes[i + 1]));
  });
});

describe('levels.json names', () => {
  it('pays tribute to a different person in every level', () => {
    const names = LEVELS.map(level => level.name);
    names.forEach(name => expect(name).toMatch(/^[a-z0-9_]+$/));
    expect(new Set(names).size).toBe(names.length);
  });

  it('tells each story and its jab in French and in English', () => {
    [fr.levels as LevelTexts, en.levels as LevelTexts].forEach(texts => LEVELS.forEach(level => {
      const { name, story, jab } = texts[level.name] ?? {};
      expect([name, story, jab].every(text => !!text?.trim()), level.name).toBe(true);
    }));
    expect(Object.keys(en.levels)).toEqual(Object.keys(fr.levels));
  });

  it('can write any number of clicks for the jabs that quote it', () => {
    [fr.gameboard, en.gameboard].forEach(texts => {
      expect(texts.clicksInWords.length).toBe(13);
      expect(texts.clicksInDigits).toContain('{count}');
    });
  });
});
