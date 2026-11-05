import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { APP_BASE_HREF } from '@angular/common';

import { LevelService } from './level';
import { Level } from '../engine';

const BEST_MEDALS_KEY = 'turings_node_best_medals_v2';
const OBSOLETE_MEDALS_KEY = 'turings_node_best_medals_v1';

const makeLevel = (levelNumber: number, world = 1): Level => ({
  levelNumber,
  world,
  name: `level_${levelNumber}`,
  startScore: 10,
  minScore: 10,
  maxScore: null,
  minSteps: 1,
  goldSteps: 2,
  silverSteps: 3,
  bronzeSteps: 4,
  buttons: []
});

describe('LevelService', () => {
  let service: LevelService;

  beforeEach(() => {
    localStorage.removeItem(BEST_MEDALS_KEY);
    // Progression d'un joueur sur les anciens niveaux
    localStorage.setItem(OBSOLETE_MEDALS_KEY, JSON.stringify({ 1: 'Or', 2: 'Platine' }));
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withXhr()),
        provideHttpClientTesting(),
        { provide: APP_BASE_HREF, useValue: '/' }
      ]
    });
    service = TestBed.inject(LevelService);
    TestBed.inject(HttpTestingController).expectOne('/assets/levels.json').flush([makeLevel(1), makeLevel(2)]);
  });

  afterEach(() => {
    localStorage.removeItem(BEST_MEDALS_KEY);
    localStorage.removeItem(OBSOLETE_MEDALS_KEY);
  });

  it('forgets the medals saved for the previous levels', () => {
    expect(localStorage.getItem(OBSOLETE_MEDALS_KEY)).toBeNull();
    expect(service.bestMedals()).toEqual({});
  });

  it('shows a world only once the previous one is complete', () => {
    service.levels.set([makeLevel(1, 1), makeLevel(2, 2)]);
    expect(service.visibleWorlds().map(world => world.number)).toEqual([1]);

    service.saveLevelResult(1, null);
    expect(service.visibleWorlds().map(world => world.number)).toEqual([1, 2]);
  });

  it('starts on the first level', () => {
    expect(service.currentLevelNumber()).toBe(1);
    expect(service.hasNextLevel()).toBe(true);
  });

  it('stops advancing on the last level', () => {
    service.advanceToNextLevel();
    expect(service.currentLevelNumber()).toBe(2);
    expect(service.hasNextLevel()).toBe(false);

    service.advanceToNextLevel();
    expect(service.currentLevelNumber()).toBe(2);
  });

  it('keeps only the best medal of a level', () => {
    service.saveLevelResult(1, 'Or');
    service.saveLevelResult(1, 'Bronze');
    service.saveLevelResult(2, null);

    expect(service.bestMedals()).toEqual({ 1: 'Or', 2: 'Terminé' });
  });

  it('erases every medal and goes back to the first level', () => {
    service.saveLevelResult(1, 'Or');
    service.advanceToNextLevel();

    service.resetProgress();

    expect(service.bestMedals()).toEqual({});
    expect(localStorage.getItem(BEST_MEDALS_KEY)).toBeNull();
    expect(service.currentLevelNumber()).toBe(1);
  });
});
