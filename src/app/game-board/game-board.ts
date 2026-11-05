import { Component, ElementRef, OnDestroy, OnInit, effect, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BackgroundService } from '../core/services/background';
import { LevelService } from '../core/services/level';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '../shared/pipes/translate-pipe';
import { AchievementService } from '../core/services/achievement';
import {
  ButtonState,
  DEFAULT_MIN_SCORE,
  Level,
  Medal,
  ScoreBounds,
  createBoard,
  getMedal,
  getScoreBounds,
  isButtonConditionMet,
  isButtonDisabled,
  isButtonLegendary,
  isGoldenScore,
  isWorldComplete,
  pressButton,
  remainingClicks,
  remainingStreakClicks
} from '../core/engine';
import { EXPLOSION_QUAKE, QuakeOptions, RUMBLE_QUAKE, quakeKeyframes } from './victory-quake';

// Un bouton affiché : son état dans le moteur, complété par son état visuel
interface GameButton extends ButtonState {
  colorClass: 'is-green' | 'is-red' | 'is-gold' | 'is-legendary'; // La classe CSS dynamique
  isDisabled: boolean;
  isConditionMet: boolean;
  clicksLeft: number | null; // Seulement pour un bouton limité en nombre de clics
  streakLeft: number | null; // Seulement pour un bouton limité en clics d'affilée
}

// État du plateau avant un clic, pour pouvoir l'annuler
interface BoardSnapshot {
  score: number;
  buttons: ButtonState[];
  clicks: number;
}

@Component({
  selector: 'app-game-board',
  standalone: true,
  imports: [
    CommonModule,
    TranslatePipe,
    RouterLink
  ],
  templateUrl: './game-board.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./game-board.scss', './game-board-help.scss', './game-board-victory.scss', './game-board-tribute.scss', './game-board-limits.scss'],
  host: { '(document:keydown)': 'onKeydown($event)' }
})

export class GameBoardComponent implements OnInit, OnDestroy {

  public gameState: 'playing' | 'level_complete' = 'playing';
  public earnedMedal: Medal | null = null;
  public levelClicks: number = 0;
  private score: number = 42;
  public displayedScore: number = 42;
  public isAnimatingScore: boolean = false;
  public buttons: GameButton[] = [];
  private bounds: ScoreBounds = { min: DEFAULT_MIN_SCORE, max: Number.MAX_SAFE_INTEGER };
  private specialBackground: string | null = null;
  private clicksSinceBgChange: number = 0;
  private timestampBgChange: number = 0;
  private readonly SPECIAL_BG_CLICK_LIMIT = 25;
  private readonly SPECIAL_BG_TIME_LIMIT_MS = 60 * 1000; // 1 minute en millisecondes
  private initialSetupDone = false;
  private history: BoardSnapshot[] = [];
  private readonly MEDAL_ICONS = { Platine: '💎', Or: '🥇', Argent: '🥈', Bronze: '🥉', Terminé: '✔️' };

  // Victoire : le plateau tremble de plus en plus fort, puis explose. Un clic pendant le tremblement l'apaise.
  public isRumbling = false;
  public isExploding = false;
  private victoryTimer: ReturnType<typeof setTimeout> | undefined;
  private readonly RUMBLE_DURATION_MS = 2000;
  private readonly EXPLOSION_DURATION_MS = 600;
  private boardAnimation?: Animation;

  // Personne à qui le niveau rend hommage : son nom pendant la partie, son histoire et la pique de la machine à la fin
  public levelName = '';
  // Les piques qui citent le nombre de clics l'écrivent en toutes lettres jusqu'à douze
  private readonly MAX_CLICKS_IN_WORDS = 12;

  // Mini-tutoriel : affiché au premier niveau de la campagne, puis à la demande avec le bouton « ? »
  public showHelp = false;
  private isHelpDismissed = false;

  constructor(
    private backgroundService: BackgroundService,
    public levelService: LevelService,
    private route: ActivatedRoute,
    private achievementService: AchievementService,
    private host: ElementRef<HTMLElement>
  ) {
    effect(() => {
      const allLevels = this.levelService.levels();

      if (allLevels.length > 0) {

        // On n'exécute la logique des paramètres que s'ils sont présents dans l'URL
        if (!this.initialSetupDone) {
          this.initialSetupDone = true;

          const params = this.route.snapshot.queryParamMap;
          const orderParam = params.get('order');
          const startParam = params.get('start');

          // On ne modifie l'état que si au moins un paramètre est fourni
          if (orderParam || startParam) {
            let processedLevels = [...allLevels];
            if (orderParam === 'reverse') {
              processedLevels.reverse();
              this.levelService.levels.set(processedLevels);
            }
            let startLevelNum = processedLevels[0].levelNumber;
            if (startParam === 'last') {
              startLevelNum = processedLevels[processedLevels.length - 1].levelNumber;
            }
            // On poursuit directement : currentLevelData() lira le niveau qu'on vient de choisir
            this.levelService.currentLevelNumber.set(startLevelNum);
          }
        }

        const levelData = this.levelService.currentLevelData();
        if (levelData) {
          this.showHelp = !this.isHelpDismissed && levelData.levelNumber === allLevels[0].levelNumber;
          this.setupLevel(levelData);
        }
      }
    });
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {
    clearTimeout(this.victoryTimer);
    this.boardAnimation?.cancel();
  }

  private setupLevel(levelData: Level): void {
    if (!levelData) {
      console.error("Données du niveau introuvables !");
      return;
    }

    // Réinitialisation des états du jeu
    this.stopVictorySequence();
    const board = createBoard(levelData);
    this.specialBackground = null;
    this.levelName = levelData.name;
    this.bounds = getScoreBounds(levelData);
    this.score = board.score;
    this.displayedScore = board.score;
    this.gameState = 'playing';
    this.levelClicks = 0;
    this.history = [];

    // Création des boutons à partir des données du niveau
    this.buttons = board.buttons.map(state => ({
      ...state,
      colorClass: 'is-red',
      isDisabled: false,
      isConditionMet: false,
      clicksLeft: null,
      streakLeft: null
    }));

    this.updateAllButtons();
  }

  public goToNextLevel(): void {
    this.levelService.advanceToNextLevel();
    this.backgroundService.changeBackground(this.backgroundService.getDefaultThemeName());
  }

  public retryLevel(): void {
    const levelData = this.levelService.currentLevelData();
    if (levelData) {
      this.setupLevel(levelData);
      this.backgroundService.changeBackground(this.backgroundService.getDefaultThemeName());
    }
  }

  /**
   * Méthode centrale appelée au clic sur n'importe quel bouton.
   * @param button L'objet bouton sur lequel on a cliqué
   */
  public onButtonClick(button: GameButton): void {
    if (this.isAnimatingScore || this.isExploding || button.isDisabled || this.gameState !== 'playing') return;
    this.stopVictorySequence();

    this.history.push({
      score: this.score,
      buttons: this.buttons.map(({ name, value, totalClickCount, consecutiveClickCount, totalClickLimit, consecutiveClickLimit }) =>
        ({ name, value, totalClickCount, consecutiveClickCount, totalClickLimit, consecutiveClickLimit })),
      clicks: this.levelClicks
    });

    // Le moteur calcule le nouveau score ainsi que les nouvelles valeurs et compteurs des boutons
    const board = pressButton({ score: this.score, buttons: this.buttons }, this.buttons.indexOf(button), this.bounds);
    board.buttons.forEach((state, i) => Object.assign(this.buttons[i], state));
    this.levelClicks++;

    this.animateScoreTo(board.score, () => {
      // Ce code ne s'exécutera QUE lorsque le score aura atteint sa cible
      this.updateAllButtons();
      this.checkGameState();
      this.checkBackgroundConditions();
    });
  }

  public get canUndo(): boolean {
    return this.history.length > 0 && !this.isAnimatingScore && !this.isExploding && this.gameState === 'playing';
  }

  /**
   * Annule le dernier clic : le score, les boutons et le nombre de clics reviennent à leur état précédent.
   */
  public undo(): void {
    const previous = this.canUndo ? this.history.pop() : undefined;
    if (!previous) return;
    this.stopVictorySequence();

    this.score = previous.score;
    this.displayedScore = previous.score;
    this.levelClicks = previous.clicks;
    previous.buttons.forEach((state, i) => Object.assign(this.buttons[i], state));
    this.updateAllButtons();
    // Retour à un plateau tout vert : ça se remet à trembler
    this.checkGameState();
  }

  public toggleHelp(): void {
    this.showHelp = !this.showHelp;
  }

  public closeHelp(): void {
    this.showHelp = false;
    this.isHelpDismissed = true;
  }

  /**
   * Raccourcis clavier : 1 à 9 pour les boutons, Ctrl+Z ou Retour arrière pour annuler.
   */
  public onKeydown(event: KeyboardEvent): void {
    if (event.altKey) return;

    if (event.key === 'Escape' && this.showHelp) {
      this.closeHelp();
      return;
    }

    if (((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') || event.key === 'Backspace') {
      event.preventDefault();
      this.undo();
      return;
    }

    const button = /^[1-9]$/.test(event.key) && !event.ctrlKey && !event.metaKey ? this.buttons[Number(event.key) - 1] : undefined;
    if (button) {
      this.onButtonClick(button);
    }
  }

  /**
   * Met à jour la condition, la couleur et l'état désactivé de chaque bouton.
   */
  private updateAllButtons(): void {
    this.buttons.forEach(button => {
      button.isConditionMet = isButtonConditionMet(button.name, this.score, button.value);
      button.colorClass = button.isConditionMet ? 'is-green' : 'is-red';

      // --- CONDITION SPÉCIALE "OR" ---
      if (isGoldenScore(this.score, button.value)) {
        button.colorClass = 'is-gold';
        this.achievementService.unlock(`golden_${button.value}`);
      }

      // --- CONDITION LÉGENDAIRE (encore plus rare, elle passe devant l'or) ---
      if (isButtonLegendary(button.name, this.score, button.value)) {
        button.colorClass = 'is-legendary';
        this.achievementService.unlock(`legendary_${button.name}`);
      }

      button.isDisabled = isButtonDisabled(button);
      button.clicksLeft = remainingClicks(button);
      button.streakLeft = remainingStreakClicks(button);
    });
  }

  // --- FONCTIONS ESTHÉTIQUES ---
  public getScoreColor() {
    return this.backgroundService.state().scoreColor;
  }

  // Symbole affiché en plus de la couleur, pour que l'état reste lisible sans distinguer le rouge du vert
  public stateIcon(button: GameButton): string {
    if (button.colorClass === 'is-legendary') return '✦';
    if (button.colorClass === 'is-gold') return '★';
    return button.isConditionMet ? '✓' : '✕';
  }

  // Bilan de la campagne, affiché après le dernier niveau
  public medalTally(): { name: string; icon: string; count: number }[] {
    const results = Object.values(this.levelService.bestMedals());
    return Object.entries(this.MEDAL_ICONS).map(([name, icon]) => ({ name, icon, count: results.filter(r => r === name).length }));
  }

  public isAllPlatinum(): boolean {
    const medals = this.levelService.bestMedals();
    return this.levelService.levels().every(level => medals[level.levelNumber] === 'Platine');
  }

  // Bouton que le joueur découvre pour la première fois dans ce niveau
  public isNewButton(button: GameButton): boolean {
    const introduced = this.levelService.introducedButtons().get(this.levelService.currentLevelNumber());
    return !!introduced?.includes(button.name);
  }

  // Un point plein par clic encore permis, un point vide par clic déjà utilisé ;
  // des carrés pour les clics d'affilée, qui reviennent dès qu'on clique sur un autre bouton
  public clickPips(button: GameButton): string {
    const pips = (left: number | null, limit: number | null, full: string, empty: string) =>
      left === null ? '' : full.repeat(left) + empty.repeat((limit ?? 0) - left);
    return [
      pips(button.clicksLeft, button.totalClickLimit, '●', '○'),
      pips(button.streakLeft, button.consecutiveClickLimit, '■', '□')
    ].filter(Boolean).join(' ');
  }

  public clicksInWordsKey(): string {
    return this.levelClicks <= this.MAX_CLICKS_IN_WORDS ? `gameboard.clicksInWords.${this.levelClicks}` : 'gameboard.clicksInDigits';
  }

  public stateLabelKey(button: GameButton): string {
    if (button.colorClass === 'is-legendary') return 'gameboard.stateLegendary';
    if (button.colorClass === 'is-gold') return 'gameboard.stateGold';
    return button.isConditionMet ? 'gameboard.stateGreen' : 'gameboard.stateRed';
  }

/**
 * Tous les boutons au vert : le plateau se met à trembler, avant d'exploser.
 */
private checkGameState(): void {
  if (this.gameState !== 'playing') return;

  if (this.buttons.every(btn => btn.isConditionMet)) {
    this.startVictorySequence();
  }
}

private startVictorySequence(): void {
  this.stopVictorySequence();
  this.isRumbling = true;
  this.shakeBoard(RUMBLE_QUAKE, this.RUMBLE_DURATION_MS);
  this.victoryTimer = setTimeout(() => {
    this.isRumbling = false;
    this.isExploding = true;
    this.shakeBoard(EXPLOSION_QUAKE, this.EXPLOSION_DURATION_MS);
    this.victoryTimer = setTimeout(() => this.completeLevel(), this.EXPLOSION_DURATION_MS);
  }, this.RUMBLE_DURATION_MS);
}

private stopVictorySequence(): void {
  clearTimeout(this.victoryTimer);
  this.boardAnimation?.cancel();
  this.boardAnimation = undefined;
  this.isRumbling = false;
  this.isExploding = false;
}

// Secousse tirée au hasard à chaque fois ; en mouvement réduit, le plateau s'illumine puis s'efface sans bouger
private shakeBoard(quake: QuakeOptions, duration: number): void {
  const board = this.host.nativeElement.querySelector<HTMLElement>('.board');
  if (!board || typeof board.animate !== 'function') return; // Navigateur (ou test) sans Web Animations
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const keyframes = !reducedMotion ? quakeKeyframes(quake)
    : quake.opacity ? [{ opacity: quake.opacity[0] }, { opacity: quake.opacity[1] }]
    : [{ filter: `brightness(${quake.brightness[0]})` }, { filter: `brightness(${quake.brightness[1]})` }];
  this.boardAnimation?.cancel();
  this.boardAnimation = board.animate(keyframes, { duration, fill: 'forwards' });
}

private completeLevel(): void {
  const levelNumber = this.levelService.currentLevelNumber();
  this.isExploding = false;
  this.gameState = 'level_complete';
  this.calculateEarnedMedal();
  this.levelService.saveLevelResult(levelNumber, this.earnedMedal);
  this.backgroundService.changeBackground('constellation');

  // Dernier niveau du monde terminé : un succès, et le monde suivant apparaît dans la sélection
  const world = this.levelService.worlds().find(w => w.levels.some(level => level.levelNumber === levelNumber));
  if (world && isWorldComplete(world, this.levelService.bestMedals())) {
    this.achievementService.unlock(`world_${world.number}`);
  }
}

/**
 * Logique du fond d'écran.
 */
private checkBackgroundConditions(): void {
  // --- ÉTAPE 1 : Gérer l'expiration d'un thème en cours ---
  if (this.specialBackground) {
    this.clicksSinceBgChange++;
    const timeElapsed = Date.now() - this.timestampBgChange;
    const clicksReached = this.clicksSinceBgChange >= this.SPECIAL_BG_CLICK_LIMIT;
    const timeReached = timeElapsed >= this.SPECIAL_BG_TIME_LIMIT_MS;

    if (clicksReached || timeReached) {
      this.backgroundService.changeBackground(this.backgroundService.getDefaultThemeName());
      this.specialBackground = null;
      return; // Le thème a expiré, on arrête.
    }
  }

  // --- ÉTAPE 2 : Vérifier si un nouveau thème doit s'activer ---
  let targetTheme: string | null = null;
  if (this.buttons.some(btn => btn.colorClass === 'is-legendary')) {
    targetTheme = 'fireworks';
  } else if (this.buttons.some(btn => btn.colorClass === 'is-gold')) {
    targetTheme = 'aurea';
  } else if (String(this.score).includes('777')) {
    targetTheme = 'casino';
  } else if (this.buttons.every(btn => btn.colorClass === 'is-red')) {
    targetTheme = 'angry';
  } else if (/^[01]{8}$/.test(String(this.score))) {
    targetTheme = 'matrix';
  } else if (this.score === this.bounds.min) {
    targetTheme = 'snow';
  }

  if (targetTheme && this.specialBackground !== targetTheme) {
    this.backgroundService.changeBackground(targetTheme);
    this.specialBackground = targetTheme;
    this.clicksSinceBgChange = 0;
    this.timestampBgChange = Date.now();
  }
}

  private animateScoreTo(targetScore: number, onComplete?: () => void): void {
    // On arrondit la cible pour éviter les problèmes de nombres à virgule
    targetScore = Math.round(targetScore);
    const startScore = this.score;

    // Score inchangé : pas d'animation, mais les boutons doivent quand même être mis à jour
    if (targetScore === startScore) {
      onComplete?.();
      return;
    }

    this.isAnimatingScore = true;

    // Facteur de vitesse d'animation : plus il est petit, plus l'animation est lente.
    const easingFactor = 0.2;

    const stepAnimation = () => {
      if (!this.isAnimatingScore) return;

      // --- NOUVELLE LOGIQUE DE VITESSE DYNAMIQUE ---
      const remainingDistance = targetScore - this.score;

      // Si on est très proche de la fin, on termine l'animation proprement.
      if (Math.abs(remainingDistance) < 1) {
        this.score = targetScore;
        this.displayedScore = targetScore;
        this.isAnimatingScore = false;
        onComplete?.();
        return;
      }

      // Le pas est une fraction de la distance restante (avec un minimum de 1).
      let step = remainingDistance * easingFactor;

      // On s'assure que le pas est au moins de 1 (ou -1) pour ne pas être bloqué.
      if (Math.abs(step) < 1) {
        step = Math.sign(step); // Renvoie 1 ou -1
      }

      // --- Progression et affichage ---
      this.score += step;

      // La magnitude du pas actuel, pour le brouillage des chiffres.
      const stepMagnitude = Math.abs(Math.round(step));
      const scramblingDigits = stepMagnitude > 1 ? Math.floor(Math.random() * stepMagnitude) : 0;

      this.displayedScore = Math.floor(this.score / stepMagnitude) * stepMagnitude + scramblingDigits;

      requestAnimationFrame(stepAnimation);
    };

    requestAnimationFrame(stepAnimation);
  }

  private calculateEarnedMedal(): void {
    const levelData = this.levelService.currentLevelData();
    this.earnedMedal = levelData ? getMedal(this.levelClicks, levelData) : null;
  }
}
