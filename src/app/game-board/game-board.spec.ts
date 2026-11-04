import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { APP_BASE_HREF } from '@angular/common';

import { GameBoardComponent } from './game-board';
import { LevelService } from '../core/services/level';
import { Level } from '../core/engine';

// Le score 11 a pour racine numérique 2 : Digit passe au vert dès que sa valeur vaut 2
const LEVEL: Level = {
  levelNumber: 1,
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

  afterEach(() => localStorage.removeItem('turings_node_best_medals_v1'));

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('updates the buttons and detects the victory when a click leaves the score unchanged', () => {
    levelService.levels.set([LEVEL]);
    fixture.detectChanges();
    const digit = component.buttons[0];
    expect(digit.colorClass).toBe('is-red');

    component.onButtonClick(digit); // 11 × 1 = 11, mais Digit passe à 2

    expect(digit.value).toBe(2);
    expect(digit.colorClass).toBe('is-green');
    expect(component.gameState).toBe('level_complete');
    expect(component.earnedMedal).toBe('Platine');
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

  it('offers the level selection instead of a next level after the last level', () => {
    levelService.levels.set([LEVEL]);
    fixture.detectChanges();
    component.onButtonClick(component.buttons[0]);
    fixture.detectChanges();

    const nextButton: HTMLElement = fixture.nativeElement.querySelector('.next-level-button');
    expect(nextButton.textContent).toContain('menu.levelSelectButton');
  });

  it('shows the campaign summary after the last level', () => {
    levelService.levels.set([LEVEL]);
    fixture.detectChanges();
    component.onButtonClick(component.buttons[0]);
    fixture.detectChanges();

    const summary: HTMLElement = fixture.nativeElement.querySelector('.campaign-summary');
    expect(summary.querySelector('.medal-tally')?.textContent).toContain('💎 1');
    expect(component.isAllPlatinum()).toBe(true);
  });

  it('marks the buttons the player discovers in this level', () => {
    levelService.levels.set([LEVEL, { ...LEVEL, levelNumber: 2, buttons: [{ name: 'Digit', initialValue: 1 }, { name: 'Split', initialValue: 1 }] }]);
    levelService.currentLevelNumber.set(2);
    fixture.detectChanges();

    expect(component.buttons.map(button => component.isNewButton(button))).toEqual([false, true]);
    expect(fixture.nativeElement.querySelectorAll('.new-tag').length).toBe(1);
  });
});
