import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { APP_BASE_HREF } from '@angular/common';
import { AchievementService } from './achievement';

describe('AchievementService', () => {
  let service: AchievementService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withXhr()),
        provideHttpClientTesting(),
        { provide: APP_BASE_HREF, useValue: '/' }
      ]
    });
    service = TestBed.inject(AchievementService);
  });

  afterEach(() => localStorage.removeItem('turings_node_achievements'));

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('erases every unlocked achievement', () => {
    service.unlock('golden_3');
    expect(service.unlockedAchievements().has('golden_3')).toBe(true);

    service.resetAchievements();

    expect(service.unlockedAchievements().size).toBe(0);
    expect(localStorage.getItem('turings_node_achievements')).toBeNull();
  });
});
