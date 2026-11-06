import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { APP_BASE_HREF } from '@angular/common';
import { AchievementsComponent } from './achievements';
import { AchievementService } from '../core/services/achievement';
import { LevelService } from '../core/services/level';
import { Level } from '../core/engine';

describe('AchievementsComponent', () => {
  let component: AchievementsComponent;
  let fixture: ComponentFixture<AchievementsComponent>;
  let achievements: AchievementService;
  let levelService: LevelService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AchievementsComponent],
      providers: [
        provideHttpClient(withXhr()),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: APP_BASE_HREF, useValue: '/' }
      ]
    })
    .compileComponents();

    achievements = TestBed.inject(AchievementService);
    levelService = TestBed.inject(LevelService);
    fixture = TestBed.createComponent(AchievementsComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    localStorage.removeItem('turings_node_best_medals_v2');
    localStorage.removeItem('turings_node_achievements');
    localStorage.removeItem('turings_node_stats');
  });

  const texts = (selector: string) =>
    [...fixture.nativeElement.querySelectorAll(selector)].map((element: HTMLElement) => element.textContent?.trim());
  const detail = () => texts('.dossier-detail p');

  it('shows the palmares, chocolate medals included', () => {
    levelService.saveLevelResult(1, 'Platine');
    levelService.saveLevelResult(2, 'Or');
    levelService.meltMedal(1);
    fixture.detectChanges();

    expect(texts('.palmares-item strong')).toEqual(['0', '1', '0', '0', '1', '0']);
    expect(fixture.nativeElement.querySelector('.palmares-item.is-chocolate strong')?.textContent).toBe('1');
  });

  it('groups the achievements by family, with a total only for the families that betray nothing', () => {
    achievements.unlock('golden_1');
    fixture.detectChanges();
    expect(texts('.section-title small')).toEqual(['1 / 9', '0 / 14', '0 / 3', '0 / 6', '0 / 4']);
    expect(texts('.badge-title').filter(title => title === 'achievements.locked').length).toBe(9 + 14 + 3 + 6 + 4 - 1);

    achievements.unlock('world_2');
    achievements.unlock('secret_murphy');
    fixture.detectChanges();
    expect(texts('.section-title small').slice(-2)).toEqual(['1', '1']);
  });

  it('describes in the side panel the unlocked achievement or the medal under the pointer', () => {
    achievements.unlock('habit_idle');
    fixture.detectChanges();
    expect(detail()).toEqual(['achievements.hint']);

    const badge: HTMLButtonElement = fixture.nativeElement.querySelector('button.badge');
    badge.dispatchEvent(new MouseEvent('mouseenter'));
    fixture.detectChanges();
    expect(detail()).toEqual(['achievements.habit_idle.title', 'achievements.habit_idle.description']);
    expect(badge.classList.contains('is-selected')).toBe(true);

    // Une pastille verrouillée ne dit rien : l'encart garde la dernière description
    fixture.nativeElement.querySelector('.badge.is-locked').dispatchEvent(new MouseEvent('mouseenter'));
    fixture.detectChanges();
    expect(detail()[0]).toBe('achievements.habit_idle.title');

    // Sur téléphone, on touche la médaille
    const chocolate: HTMLButtonElement = fixture.nativeElement.querySelector('.palmares-item.is-chocolate');
    chocolate.click();
    fixture.detectChanges();
    expect(detail()).toEqual(['medals.Chocolat', 'achievements.palmares.Chocolat']);
  });

  it('puts the back link first in the side panel', () => {
    fixture.detectChanges();
    const aside: HTMLElement = fixture.nativeElement.querySelector('.dossier-aside');
    expect(aside.firstElementChild?.classList.contains('back-button')).toBe(true);
  });

  it('grants the platinum achievements a player had already earned', () => {
    const level: Level = { levelNumber: 1, world: 1, name: 'tester', startScore: 20, minScore: 10, maxScore: null,
      minSteps: 1, goldSteps: 2, silverSteps: 3, bronzeSteps: 4, buttons: [{ name: 'Plus', initialValue: 1 }] };
    levelService.levels.set([level]);
    levelService.saveLevelResult(1, 'Platine');
    fixture.detectChanges();
    expect(achievements.unlockedAchievements().has('feat_campaign')).toBe(true);
  });
});
