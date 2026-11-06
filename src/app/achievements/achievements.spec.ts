import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { APP_BASE_HREF } from '@angular/common';
import { AchievementsComponent } from './achievements';
import { AchievementService } from '../core/services/achievement';
import { LevelService } from '../core/services/level';
import { StatsService } from '../core/services/stats';
import { Level } from '../core/engine';
import fr from '../../assets/i18n/fr.json';

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
  // Les cases d'un bloc de l'encart : 0 pour le palmarès, 1 pour les compteurs
  const block = (index: number) => [...fixture.nativeElement.querySelectorAll('.dossier-block')[index].querySelectorAll('.palmares-item')] as HTMLElement[];

  it('shows the palmares, chocolate medals included', () => {
    levelService.saveLevelResult(1, 'Platine');
    levelService.saveLevelResult(2, 'Or');
    levelService.meltMedal(1);
    fixture.detectChanges();

    expect(block(0).map(item => item.querySelector('strong')?.textContent)).toEqual(['0', '1', '0', '0', '1', '0']);
    expect(fixture.nativeElement.querySelector('.palmares-item.is-chocolate strong')?.textContent).toBe('1');
  });

  it('groups the achievements by family, with a total only for the families that betray nothing', () => {
    achievements.unlock('golden_1');
    fixture.detectChanges();
    expect(texts('.section-title small')).toEqual(['1 / 9', '0 / 14', '0 / 3', '0 / 6', '0 / 4']);
    expect(fixture.nativeElement.querySelectorAll('.badge.is-locked').length).toBe(9 + 14 + 3 + 6 + 4 - 1);
    // Comme sur une planche : l'icône seule, le nom n'est lu que par les lecteurs d'écran (et dans l'encart)
    const badge: HTMLElement = fixture.nativeElement.querySelector('button.badge');
    expect([badge.textContent?.trim(), badge.getAttribute('aria-label')]).toEqual(['', 'achievements.golden_1.title']);

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

  it('shows what the machine has counted under the palmares, and describes it in the side panel', () => {
    TestBed.inject(StatsService).stats.set({ melts: 2, clicks: 4213, undos: 87, restarts: 31, notices: ['Plus:green'] });
    levelService.saveLevelResult(1, 'Or');
    levelService.saveLevelResult(2, null);
    fixture.detectChanges();
    expect(block(1).map(item => item.querySelector('strong')?.textContent)).toEqual(['4,213', '87', '31', '2', '2', '1']);
    // Aucun compteur parmi les succès
    expect(fixture.nativeElement.querySelector('.achievements-list .palmares-item')).toBeNull();

    block(1)[0].dispatchEvent(new MouseEvent('mouseenter'));
    fixture.detectChanges();
    expect(detail()).toEqual(['achievements.stats.clicks.title', 'achievements.stats.clicks.description']);
  });

  const iconOf = (badge: Element) => (badge.querySelector('app-icon') as HTMLElement).style.getPropertyValue('--icon');

  it('draws each unlocked achievement with its own icon, and a padlock otherwise', () => {
    achievements.unlock('habit_night');
    achievements.unlock('golden_4');
    achievements.unlock('world_5');
    fixture.detectChanges();
    const unlocked = [...fixture.nativeElement.querySelectorAll('button.badge')];
    expect(unlocked.map(iconOf)).toEqual([
      'url("/assets/icons/door.svg")', 'url("/assets/icons/moon.svg")', 'url("/assets/icons/world-5.svg")'
    ]);
    expect(iconOf(fixture.nativeElement.querySelector('.badge.is-locked'))).toBe('url("/assets/icons/padlock.svg")');
  });

  it('never draws two achievements with the same icon', () => {
    const ids = Object.keys(fr.achievements).filter(id => /^(golden|legendary|feat|habit|shame|world|secret)_/.test(id));
    ids.forEach(id => achievements.unlock(id));
    fixture.detectChanges();
    const icons = [...fixture.nativeElement.querySelectorAll('button.badge')].map(iconOf);
    expect(icons.length).toBe(ids.length);
    expect(new Set(icons).size).toBe(ids.length);
  });

  it('puts the back link before the description', () => {
    fixture.detectChanges();
    const pointer: HTMLElement = fixture.nativeElement.querySelector('.dossier-pointer');
    expect([...pointer.children].map(child => child.className)).toEqual(['back-button', 'dossier-detail']);
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
