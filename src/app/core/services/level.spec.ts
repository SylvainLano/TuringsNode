import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { APP_BASE_HREF } from '@angular/common';

import { LevelService } from './level';
import { Level } from '../engine';

const BEST_MEDALS_KEY = 'turings_node_best_medals';

const makeLevel = (levelNumber: number): Level => ({
  levelNumber,
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
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: APP_BASE_HREF, useValue: '/' }
      ]
    });
    service = TestBed.inject(LevelService);
    TestBed.inject(HttpTestingController).expectOne('/assets/levels.json').flush([makeLevel(1), makeLevel(2)]);
  });

  afterEach(() => localStorage.removeItem(BEST_MEDALS_KEY));

  it('starts on the first level', () => {
    expect(service.currentLevelNumber()).toBe(1);
    expect(service.hasNextLevel()).toBeTrue();
  });

  it('stops advancing on the last level', () => {
    service.advanceToNextLevel();
    expect(service.currentLevelNumber()).toBe(2);
    expect(service.hasNextLevel()).toBeFalse();

    service.advanceToNextLevel();
    expect(service.currentLevelNumber()).toBe(2);
  });

  it('keeps only the best medal of a level', () => {
    service.saveLevelResult(1, 'Or');
    service.saveLevelResult(1, 'Bronze');
    service.saveLevelResult(2, null);

    expect(service.bestMedals()).toEqual({ 1: 'Or', 2: 'Terminé' });
  });
});
