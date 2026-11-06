import levelsData from '../../../assets/levels.json';
import fr from '../../../assets/i18n/fr.json';
import en from '../../../assets/i18n/en.json';
import { BUTTON_NAMES, MAX_BUTTON_VALUE, MIN_BUTTON_VALUE } from './buttons';
import { Level, secretAchievementId, secretLevelNumber } from './level';
import { groupByWorld } from './worlds';

// Vérifications de structure des niveaux livrés avec le jeu : la campagne, et à part les niveaux secrets
const LEVELS = levelsData as Level[];
const CAMPAIGN = LEVELS.filter(level => !level.secret);
const SECRETS = LEVELS.filter(level => level.secret);
type LevelTexts = Record<string, { name: string; story: string; jab: string }>;
const achievementTitle = (achievements: object, id: string) =>
  ((achievements as Record<string, unknown>)[id] as { title?: string } | undefined)?.title;

describe('levels.json', () => {
  it('numbers the levels of the campaign from 1 without gaps', () => {
    expect(CAMPAIGN.map(level => level.levelNumber)).toEqual(CAMPAIGN.map((_, i) => i + 1));
  });

  it('only uses known buttons with values from 1 to 9', () => {
    LEVELS.forEach(level => level.buttons.forEach(button => {
      expect(BUTTON_NAMES).toContain(button.name);
      expect(button.initialValue).toBeGreaterThanOrEqual(MIN_BUTTON_VALUE);
      expect(button.initialValue).toBeLessThanOrEqual(MAX_BUTTON_VALUE);
    }));
  });

  it('only limits clicks with a whole number of at least one', () => {
    LEVELS.forEach(level => level.buttons.forEach(({ totalClickLimit, consecutiveClickLimit }) => {
      [totalClickLimit, consecutiveClickLimit].filter(limit => limit !== undefined)
        .forEach(limit => expect(Number.isInteger(limit) && limit! >= 1).toBe(true));
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
    const worlds = CAMPAIGN.map(level => level.world);
    expect(worlds.every(world => Number.isInteger(world))).toBe(true);
    expect(worlds[0]).toBe(1);
    worlds.slice(1).forEach((world, i) => expect([worlds[i], worlds[i] + 1]).toContain(world));
  });

  it('sizes the worlds along the Fibonacci sequence (2, 3, 5, 8, 13…)', () => {
    const sizes = groupByWorld(CAMPAIGN).map(world => world.levels.length);
    expect(sizes.slice(0, 2)).toEqual([2, 3]);
    sizes.slice(2).forEach((size, i) => expect(size).toBe(sizes[i] + sizes[i + 1]));
  });

  it('has an achievement for every world, in French and in English', () => {
    [fr.achievements, en.achievements].forEach(achievements => groupByWorld(CAMPAIGN).forEach(world =>
      expect(achievementTitle(achievements, `world_${world.number}`), `world_${world.number}`).toBeTruthy()));
  });
});

describe('levels.json secret levels', () => {
  it('numbers the secret levels of each world in order, outside the campaign', () => {
    groupByWorld(CAMPAIGN).forEach(world => SECRETS.filter(level => level.world === world.number)
      .forEach((level, index) => expect(level.levelNumber, level.name).toBe(secretLevelNumber(world.number, index))));
    expect(SECRETS.every(level => groupByWorld(CAMPAIGN).some(world => world.number === level.world))).toBe(true);
  });

  it('gives each secret level of a world its own secret score', () => {
    groupByWorld(CAMPAIGN).forEach(world => {
      const scores = SECRETS.filter(level => level.world === world.number).map(level => level.secret?.unlockScore);
      expect(new Set(scores).size, `monde ${world.number}`).toBe(scores.length);
    });
  });

  it('gives every secret level a score to unlock it, a target and an achievement in French and in English', () => {
    SECRETS.forEach(level => {
      expect(Number.isInteger(level.secret?.unlockScore) && Number.isInteger(level.targetScore), level.name).toBe(true);
      [fr.achievements, en.achievements].forEach(achievements =>
        expect(achievementTitle(achievements, secretAchievementId(level)), level.name).toBeTruthy());
    });
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
