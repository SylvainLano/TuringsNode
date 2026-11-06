import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';
import { APP_BASE_HREF } from '@angular/common';
import { LevelSelectComponent } from './level-select';
import { LevelService } from '../core/services/level';
import { AchievementService } from '../core/services/achievement';

describe('LevelSelectComponent', () => {
  let component: LevelSelectComponent;
  let fixture: ComponentFixture<LevelSelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LevelSelectComponent],
      providers: [
        provideHttpClient(withXhr()),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: APP_BASE_HREF, useValue: '/' }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LevelSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('marks the levels introducing a button', () => {
    const base = { world: 1, name: 'tester', minScore: 10, maxScore: null, startScore: 20, minSteps: 1, goldSteps: 2, silverSteps: 3, bronzeSteps: 4 };
    TestBed.inject(LevelService).levels.set([
      { ...base, levelNumber: 1, buttons: [{ name: 'Split', initialValue: 1 }] },
      { ...base, levelNumber: 2, buttons: [{ name: 'Split', initialValue: 2 }] },
      { ...base, levelNumber: 3, buttons: [{ name: 'Split', initialValue: 1 }, { name: 'Boost', initialValue: 1 }] }
    ]);
    fixture.detectChanges();

    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelectorAll('.level-button').length).toBe(3);
    expect([...element.querySelectorAll('.intro-badge')].map(badge => badge.textContent?.trim())).toEqual(['+ Split', '+ Boost']);
  });

  it('shows one world at a time and hides the next one until the current one is complete', () => {
    const base = { minScore: 10, maxScore: null, startScore: 20, minSteps: 1, goldSteps: 2, silverSteps: 3, bronzeSteps: 4, buttons: [] };
    const levelService = TestBed.inject(LevelService);
    levelService.levels.set([
      { ...base, levelNumber: 1, world: 1, name: 'first' },
      { ...base, levelNumber: 2, world: 1, name: 'second' },
      { ...base, levelNumber: 3, world: 2, name: 'third' }
    ]);
    fixture.detectChanges();

    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelector('.world-name')?.textContent).toBe('levelSelect.world');
    expect(element.querySelectorAll('.level-button').length).toBe(2);
    expect(component.neighbourWorld(1)).toBeUndefined();

    levelService.saveLevelResult(1, 'Or');
    levelService.saveLevelResult(2, null);
    fixture.detectChanges();
    // Le nom d'un niveau ne se découvre qu'une fois celui-ci terminé
    expect([...element.querySelectorAll('.level-name')].map(name => name.textContent)).toEqual(['levels.first.name', 'levels.second.name']);

    component.showWorld(1);
    fixture.detectChanges();
    expect(element.querySelectorAll('.level-button').length).toBe(1);
    expect(element.querySelector('.level-name')).toBeNull();
    expect(element.querySelector('.world-progress')?.textContent?.trim()).toBe('0 / 1');
    localStorage.removeItem('turings_node_best_medals_v2');
  });

  it('shows the secret tile once the world is complete, and opens it once its score is found', () => {
    const base = { world: 1, minScore: 10, maxScore: null, startScore: 20, minSteps: 1, goldSteps: 2, silverSteps: 3, bronzeSteps: 4, buttons: [] };
    const levelService = TestBed.inject(LevelService);
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    levelService.levels.set([{ ...base, levelNumber: 1, name: 'first' }]);
    levelService.secretLevels.set([{ ...base, levelNumber: 1001, name: 'hidden', targetScore: 100, secret: { unlockScore: 50 } }]);
    fixture.detectChanges();

    const element: HTMLElement = fixture.nativeElement;
    const tile = () => element.querySelector('.secret-button');
    expect(tile()).toBeNull();

    levelService.saveLevelResult(1, 'Or');
    fixture.detectChanges();
    expect(tile()?.textContent).toContain('?');
    expect(tile()?.classList.contains('is-locked')).toBe(true);
    component.selectSecretLevel(component.secretLevel()!);
    expect(levelService.currentLevelNumber()).toBe(1);

    TestBed.inject(AchievementService).unlock('secret_hidden');
    fixture.detectChanges();
    expect(tile()?.classList.contains('is-waiting')).toBe(true);
    component.selectSecretLevel(component.secretLevel()!);
    expect(levelService.currentLevelNumber()).toBe(1001);

    localStorage.removeItem('turings_node_best_medals_v2');
    localStorage.removeItem('turings_node_achievements');
  });
});
