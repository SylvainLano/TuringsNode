import levelsData from '../../../assets/levels.json';
import { BUTTON_NAMES, MAX_BUTTON_VALUE, MIN_BUTTON_VALUE } from './buttons';
import { Level } from './level';

// Vérifications de structure des niveaux livrés avec le jeu
const LEVELS = levelsData as Level[];

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

describe('levels.json chapters', () => {
  it('gives every level a chapter, numbered from 1 without gaps and in order', () => {
    const chapters = LEVELS.map(level => level.chapter);
    expect(chapters.every(chapter => Number.isInteger(chapter))).toBe(true);
    expect(chapters[0]).toBe(1);
    chapters.slice(1).forEach((chapter, i) => expect([chapters[i], chapters[i]! + 1]).toContain(chapter));
  });
});
