import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { APP_BASE_HREF } from '@angular/common';

import { GameBoardComponent } from './game-board';
import { LevelService } from '../core/services/level';
import { AchievementService } from '../core/services/achievement';
import { FaviconService } from '../core/services/favicon';
import { BackgroundService } from '../core/services/background';
import { Level } from '../core/engine';

// Le score 11 a pour racine numérique 2 : Digit passe au vert dès que sa valeur vaut 2
const LEVEL: Level = {
  levelNumber: 1,
  world: 1,
  name: 'tester',
  startScore: 11,
  minScore: 10,
  maxScore: null,
  minSteps: 1,
  goldSteps: 2,
  silverSteps: 3,
  bronzeSteps: 4,
  buttons: [{ name: 'Digit', initialValue: 1 }]
};

describe('GameBoardComponent', () => {
  let component: GameBoardComponent;
  let fixture: ComponentFixture<GameBoardComponent>;
  let levelService: LevelService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GameBoardComponent],
      providers: [
        provideHttpClient(withXhr()),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: APP_BASE_HREF, useValue: '/' }
      ]
    })
    .compileComponents();

    levelService = TestBed.inject(LevelService);
    fixture = TestBed.createComponent(GameBoardComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    localStorage.removeItem('turings_node_best_medals_v2');
    localStorage.removeItem('turings_node_achievements');
    vi.useRealTimers();
  });

  // Gagne l'unique niveau en un clic, puis laisse passer le tremblement et l'explosion
  function winLevel(): void {
    vi.useFakeTimers();
    levelService.levels.set([LEVEL]);
    fixture.detectChanges();
    component.onButtonClick(component.buttons[0]);
    vi.advanceTimersByTime(3000);
    fixture.detectChanges();
  }

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('updates the buttons, shakes the board, then shows the victory', () => {
    vi.useFakeTimers();
    levelService.levels.set([LEVEL]);
    fixture.detectChanges();
    const digit = component.buttons[0];
    expect(digit.colorClass).toBe('is-red');

    component.onButtonClick(digit); // 11 × 1 = 11, mais Digit passe à 2

    expect(digit.value).toBe(2);
    expect(digit.colorClass).toBe('is-green');
    expect([component.isRumbling, component.gameState]).toEqual([true, 'playing']);

    vi.advanceTimersByTime(2000);
    expect([component.isRumbling, component.isExploding]).toEqual([false, true]);

    vi.advanceTimersByTime(600);
    expect(component.gameState).toBe('level_complete');
    expect(component.earnedMedal).toBe('Platine');
  });

  it('calms the shaking when the player clicks again, and shakes again after an undo', () => {
    vi.useFakeTimers();
    levelService.levels.set([LEVEL]);
    fixture.detectChanges();
    const digit = component.buttons[0];
    component.onButtonClick(digit);
    expect(component.isRumbling).toBe(true);

    component.onButtonClick(digit); // 11 × 2 = 22 : Digit 3 repasse au rouge
    expect(component.isRumbling).toBe(false);
    vi.advanceTimersByTime(3000);
    expect([digit.colorClass, component.gameState]).toEqual(['is-red', 'playing']);

    component.undo();
    expect(component.isRumbling).toBe(true);
    vi.advanceTimersByTime(2600);
    expect(component.gameState).toBe('level_complete');
    expect(component.earnedMedal).toBe('Platine');
  });

  it('welcomes the player with a short help on the first level, which can be closed and reopened', () => {
    levelService.levels.set([LEVEL, { ...LEVEL, levelNumber: 2 }]);
    fixture.detectChanges();
    const helpCard = () => fixture.nativeElement.querySelector('.help-card');
    expect(helpCard()).toBeTruthy();

    component.closeHelp();
    fixture.detectChanges();
    expect(helpCard()).toBeNull();

    (fixture.nativeElement.querySelector('.help-button') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(helpCard()).toBeTruthy();
  });

  it('does not show the help after the first level', () => {
    levelService.levels.set([LEVEL, { ...LEVEL, levelNumber: 2 }]);
    levelService.currentLevelNumber.set(2);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.help-card')).toBeNull();
  });

  describe('during a level', () => {
    // Digit passe au vert sans changer le score, mais Split 3 reste rouge sur 11 : le niveau continue
    const TWO_BUTTONS: Level = { ...LEVEL, buttons: [{ name: 'Digit', initialValue: 1 }, { name: 'Split', initialValue: 3 }] };

    beforeEach(() => {
      levelService.levels.set([TWO_BUTTONS]);
      fixture.detectChanges();
    });

    it('undoes the last click', () => {
      const digit = component.buttons[0];
      component.onButtonClick(digit);
      expect([digit.value, digit.colorClass, component.levelClicks]).toEqual([2, 'is-green', 1]);
      expect(component.canUndo).toBe(true);

      component.undo();

      expect([digit.value, digit.colorClass, component.levelClicks]).toEqual([1, 'is-red', 0]);
      expect(component.buttons[0].totalClickCount).toBe(0);
      expect(component.canUndo).toBe(false);
    });

    it('presses buttons with number keys and undoes with Backspace', () => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: '1' }));
      expect(component.buttons[0].value).toBe(2);

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace' }));
      expect(component.buttons[0].value).toBe(1);
      expect(component.levelClicks).toBe(0);
    });

    it('shows a symbol matching each button state', () => {
      component.onButtonClick(component.buttons[0]);
      expect(component.buttons.map(button => component.stateIcon(button))).toEqual(['✓', '✕']);
    });
  });

  it('shows the clicks left on a limited button, and disables it once they are used up', () => {
    // Le miroir de 11 vaut 11 : le score ne bouge pas, et Digit 9 reste rouge
    levelService.levels.set([{ ...LEVEL, buttons: [{ name: 'Mirror', initialValue: 1, totalClickLimit: 2 }, { name: 'Digit', initialValue: 9 }] }]);
    fixture.detectChanges();
    const [mirror, digit] = component.buttons;
    expect([component.clickPips(mirror), component.clickPips(digit)]).toEqual(['●●', '']);

    component.onButtonClick(mirror);
    component.onButtonClick(mirror);
    fixture.detectChanges();
    expect([component.clickPips(mirror), mirror.isDisabled]).toEqual(['○○', true]);
    expect(fixture.nativeElement.querySelectorAll('.click-pips').length).toBe(1);
    // Plus aucun clic sur les boutons limités : tout est grillé
    expect(TestBed.inject(BackgroundService).state().value).toBe('burnt');

    component.undo();
    expect([component.clickPips(mirror), mirror.isDisabled]).toEqual(['●○', false]);
  });

  it('shows the clicks left in a row, which come back after clicking another button', () => {
    // Le score 11 ne bouge pas : son miroir vaut 11, et 11 / 1 = 11
    levelService.levels.set([{ ...LEVEL, buttons: [{ name: 'Mirror', initialValue: 1, consecutiveClickLimit: 2 }, { name: 'Split', initialValue: 1 }] }]);
    fixture.detectChanges();
    const [mirror, split] = component.buttons;

    component.onButtonClick(mirror);
    component.onButtonClick(mirror);
    expect([component.clickPips(mirror), mirror.isDisabled]).toEqual(['□□', true]);

    component.onButtonClick(split);
    expect([component.clickPips(mirror), mirror.isDisabled]).toEqual(['■■', false]);
  });

  it('offers the level selection instead of a next level after the last level', () => {
    winLevel();

    const nextButton: HTMLElement = fixture.nativeElement.querySelector('.next-level-button');
    expect(nextButton.textContent).toContain('menu.levelSelectButton');
  });

  it('shows the name of the level during the game', () => {
    levelService.levels.set([LEVEL]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.level-name')?.textContent).toBe('levels.tester.name');
  });

  it('completes the world with an achievement, then tells the story of the level and the machine jab', () => {
    winLevel();
    expect(TestBed.inject(AchievementService).unlockedAchievements().has('world_1')).toBe(true);

    const tribute: HTMLElement = fixture.nativeElement.querySelector('.tribute');
    expect([...tribute.querySelectorAll('p')].map(p => p.textContent)).toEqual(['levels.tester.name', 'levels.tester.story', 'levels.tester.jab']);
  });

  it('writes the real number of clicks in words for the jabs that quote it', () => {
    winLevel();
    expect(component.clicksInWordsKey()).toBe('gameboard.clicksInWords.1');
    component.levelClicks = 13;
    expect(component.clicksInWordsKey()).toBe('gameboard.clicksInDigits');
  });

  it('shows the campaign summary after the last level', () => {
    winLevel();

    const summary: HTMLElement = fixture.nativeElement.querySelector('.campaign-summary');
    expect(summary.querySelector('.medal-tally')?.textContent).toContain('💎 1');
    expect(component.isAllPlatinum()).toBe(true);
  });

  describe('with a secret level in the world', () => {
    // Digit 1 laisse le score à 11 : c'est le score secret, et l'objectif du niveau secret
    const SECRET: Level = { ...LEVEL, levelNumber: 1001, name: 'secret', targetScore: 11, secret: { unlockScore: 11 },
      buttons: [{ name: 'Digit', initialValue: 1 }, { name: 'Split', initialValue: 3 }] };

    beforeEach(() => {
      vi.useFakeTimers();
      levelService.levels.set([{ ...LEVEL, buttons: [{ name: 'Digit', initialValue: 1 }, { name: 'Split', initialValue: 3 }] }]);
      levelService.secretLevels.set([SECRET]);
    });

    it('unlocks the secret level when its score appears in a level of its world', () => {
      fixture.detectChanges();
      component.onButtonClick(component.buttons[0]);
      expect(TestBed.inject(AchievementService).unlockedAchievements().has('secret_secret')).toBe(true);
    });

    it('wins a level with a target by reaching that exact score, even with red buttons', () => {
      levelService.currentLevelNumber.set(1001);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.target-score')?.textContent).toBe('gameboard.target');

      component.onButtonClick(component.buttons[0]); // Split 3 reste rouge sur 11
      expect(component.buttons[1].colorClass).toBe('is-red');
      vi.advanceTimersByTime(3000);
      fixture.detectChanges();

      expect(component.gameState).toBe('level_complete');
      expect(fixture.nativeElement.querySelector('h2')?.textContent).toContain('gameboard.secretCompleteTitle');
      expect(fixture.nativeElement.querySelector('.campaign-summary')).toBeNull();
      expect(levelService.bestMedals()[1001]).toBe('Platine');
    });
  });

  describe('with a division by zero hidden in the world', () => {
    const ZERO_SECRET: Level = { ...LEVEL, levelNumber: 1011, name: 'zero', minScore: 0, targetScore: 0, secret: { divisionByZero: true } };

    beforeEach(() => {
      vi.useFakeTimers();
      levelService.levels.set([{ ...LEVEL, buttons: [{ name: 'Split', initialValue: 9 }, { name: 'Digit', initialValue: 9 }] }]);
      levelService.secretLevels.set([ZERO_SECRET]);
    });

    it('keeps Split from 9 to 1 while the favicon does not show 0', () => {
      TestBed.inject(FaviconService).digit.set(4);
      fixture.detectChanges();
      component.onButtonClick(component.buttons[0]);
      expect(component.buttons[0].value).toBe(1);
    });

    it('takes Split from 9 to 0 when the favicon shows 0, and crashes, unlocks and restarts when it is clicked', () => {
      const favicon = TestBed.inject(FaviconService);
      favicon.digit.set(0);
      vi.spyOn(favicon, 'showDigit').mockResolvedValue();
      fixture.detectChanges();
      component.onButtonClick(component.buttons[0]);
      expect(component.buttons[0].value).toBe(0);

      component.isAnimatingScore = false;
      component.onButtonClick(component.buttons[0]);
      fixture.detectChanges();
      expect(component.isCrashing).toBe(true);
      expect(fixture.nativeElement.querySelector('.crash-screen')).toBeTruthy();

      vi.advanceTimersByTime(3000);
      expect(TestBed.inject(AchievementService).unlockedAchievements().has('secret_zero')).toBe(true);
      expect(favicon.showDigit).toHaveBeenCalledWith(expect.any(Number));
      expect([component.isCrashing, component.buttons[0].value, component.levelClicks]).toEqual([false, 9, 0]);
    });
  });

  it('blows bubbles after a minute without a click, until the next click', () => {
    vi.useFakeTimers();
    levelService.levels.set([LEVEL]);
    fixture.detectChanges();
    const background = TestBed.inject(BackgroundService);
    const levelBackground = background.state().value;

    vi.advanceTimersByTime(59 * 1000);
    expect(background.state().value).toBe(levelBackground);
    vi.advanceTimersByTime(1000);
    expect(background.state().value).toBe('bubbles');

    component.onButtonClick(component.buttons[0]); // Digit 1 : le score ne bouge pas
    expect(background.state().value).not.toBe('bubbles');
  });

  it('marks the buttons the player discovers in this level', () => {
    levelService.levels.set([LEVEL, { ...LEVEL, levelNumber: 2, buttons: [{ name: 'Digit', initialValue: 1 }, { name: 'Split', initialValue: 1 }] }]);
    levelService.currentLevelNumber.set(2);
    fixture.detectChanges();

    expect(component.buttons.map(button => component.isNewButton(button))).toEqual([false, true]);
    expect(fixture.nativeElement.querySelectorAll('.new-tag').length).toBe(1);
  });
});
