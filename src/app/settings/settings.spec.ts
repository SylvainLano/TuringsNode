import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { APP_BASE_HREF } from '@angular/common';

import { SettingsComponent } from './settings';
import { LevelService } from '../core/services/level';
import { AchievementService } from '../core/services/achievement';
import { StatsService } from '../core/services/stats';

describe('SettingsComponent', () => {
  let component: SettingsComponent;
  let fixture: ComponentFixture<SettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SettingsComponent],
      providers: [
        provideHttpClient(withXhr()),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: APP_BASE_HREF, useValue: '/' }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.removeItem('turings_node_best_medals_v2');
    localStorage.removeItem('turings_node_achievements');
    localStorage.removeItem('turings_node_stats');
  });

  it('asks for a confirmation before erasing the progress', () => {
    const levelService = TestBed.inject(LevelService);
    const achievementService = TestBed.inject(AchievementService);
    levelService.saveLevelResult(1, 'Or');
    achievementService.unlock('golden_1');
    const statsService = TestBed.inject(StatsService);
    statsService.payForNotice('Plus:green', levelService.bestMedals());

    const resetButton: HTMLButtonElement = fixture.nativeElement.querySelector('.is-danger');
    resetButton.click();
    fixture.detectChanges();
    expect(component.resetState()).toBe('confirming');
    expect(levelService.bestMedals()).toEqual({ 1: 'Or' });

    const confirmButton: HTMLButtonElement = fixture.nativeElement.querySelector('.is-danger');
    confirmButton.click();
    fixture.detectChanges();
    expect(component.resetState()).toBe('done');
    expect(levelService.bestMedals()).toEqual({});
    expect(achievementService.unlockedAchievements().size).toBe(0);
    expect(statsService.stats().melts).toBe(0);
  });

  it('shows the game version from package.json', () => {
    const shown = fixture.nativeElement.querySelector('.version')?.textContent?.trim();
    expect(shown).toMatch(/^v\d+\.\d+\.\d+$/);
    expect(shown).toBe(`v${component.version}`);
  });
});
