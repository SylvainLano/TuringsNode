import { Component, ElementRef, OnDestroy, effect, untracked, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BackgroundService } from '../core/services/background';
import { LevelService } from '../core/services/level';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '../shared/pipes/translate-pipe';
import { AchievementService } from '../core/services/achievement';
import { FaviconService } from '../core/services/favicon';
import { NOTICE_PARTS, StatsService } from '../core/services/stats';
import {
  ButtonName,
  ButtonState,
  DEFAULT_MIN_SCORE,
  Level,
  MAX_BUTTON_VALUE,
  Medal,
  ScoreBounds,
  createBoard,
  getMedal,
  getScoreBounds,
  isButtonConditionMet,
  isButtonDisabled,
  isButtonLegendary,
  isAllPlatinum,
  isGoldenScore,
  isWorldComplete,
  countPalmares,
  pickMedalToMelt,
  pressButton,
  remainingClicks,
  remainingStreakClicks,
  secretAchievementId
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

// Ce que la machine dit sous les boutons après une supplication : rien à donner, ou la médaille qui vient de fondre
type BegNote = { kind: 'nothing' } | { kind: 'melted'; icon: string; levelName: string; remark: number };

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
  styleUrls: ['./game-board.scss', './game-board-help.scss', './game-board-victory.scss', './game-board-tribute.scss', './game-board-limits.scss',
    './game-board-crash.scss', './game-board-beg.scss'],
  host: { '(document:keydown)': 'onKeydown($event)' }
})

export class GameBoardComponent implements OnDestroy {

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
  private readonly MEDAL_ICONS: Record<string, string> = { Platine: '💎', Or: '🥇', Argent: '🥈', Bronze: '🥉', Chocolat: '🍫', Terminé: '✔️' };

  // Victoire : le plateau tremble de plus en plus fort, puis explose. Un clic pendant le tremblement l'apaise.
  public isRumbling = false;
  public isExploding = false;
  private victoryTimer: ReturnType<typeof setTimeout> | undefined;
  private readonly RUMBLE_DURATION_MS = 2000;
  private readonly EXPLOSION_DURATION_MS = 600;
  private boardAnimation?: Animation;

  // Personne à qui le niveau rend hommage : son nom pendant la partie, son histoire et la pique de la machine à la fin
  public levelName = '';
  // Objectif d'un niveau secret : le score à atteindre exactement, à la place des boutons tous verts
  public targetScore: number | null = null;
  // Les piques qui citent le nombre de clics l'écrivent en toutes lettres jusqu'à douze
  private readonly MAX_CLICKS_IN_WORDS = 12;

  // Mini-tutoriel : affiché au premier niveau de la campagne, puis à la demande avec le bouton « ? »
  public showHelp = false;
  private isHelpDismissed = false;

  // Division par zéro : quand le favicon affiche 0, Split peut passer de 9 à 0 dans le monde qui cache ce secret.
  // Un clic dessus fait « planter » le jeu, débloque le secret, puis redémarre le niveau.
  public isCrashing = false;
  private crashTimer: ReturnType<typeof setTimeout> | undefined;
  private readonly CRASH_DURATION_MS = 3000;

  // Une minute sans cliquer pendant une partie : le joueur « bulle », le fond aussi (jusqu'au clic suivant)
  private idleTimer: ReturnType<typeof setTimeout> | undefined;
  private readonly IDLE_DELAY_MS = 60 * 1000;

  // L'aide qui se paie en honte : après trois redémarrages, le joueur peut implorer la notice d'un bouton.
  // Le prix : sa plus belle médaille fond (en chocolat sur son niveau, jusqu'à ce qu'il le regagne), et la pique de fin
  // de niveau devient une pique de honte. Les notices restent affichées jusqu'à ce qu'il quitte le niveau.
  private readonly RESTARTS_BEFORE_BEG = 3;
  private readonly RESTARTS_FOR_MULE = 10;
  public readonly BEG_REMARKS = 8;
  public readonly SHAME_JABS = 8;
  // « Du premier coup » : seulement dans les deux derniers mondes
  private readonly FIRST_TRY_FROM_WORLD = 6;
  private visitedLevel: number | null = null;
  private restartsSinceBeg = 0;
  private restartsInARow = 0;
  private cleanAttempt = true; // Ni annulation ni redémarrage depuis l'arrivée dans le niveau
  public isChoosingNotice = false;
  public begPrice: { icon: string; levelName: string } | null = null;
  public begNote: BegNote | null = null;
  // Pour chaque bouton imploré : le nombre de moitiés de notice dévoilées (quand il est vert, puis ce qu'il fait)
  public notices = new Map<ButtonName, number>();
  public lastBeggedButton: ButtonName | null = null;
  public shameJab = 0;

  constructor(
    private backgroundService: BackgroundService,
    public levelService: LevelService,
    private route: ActivatedRoute,
    private achievementService: AchievementService,
    private faviconService: FaviconService,
    private statsService: StatsService,
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

  ngOnDestroy(): void {
    clearTimeout(this.victoryTimer);
    clearTimeout(this.crashTimer);
    clearTimeout(this.idleTimer);
    this.boardAnimation?.cancel();
  }

  // Pendant l'animation du score, la victoire ou le plantage, les boutons ne répondent plus
  public get isBusy(): boolean {
    return this.isAnimatingScore || this.isExploding || this.isCrashing;
  }

  private setupLevel(levelData: Level): void {
    if (!levelData) {
      console.error("Données du niveau introuvables !");
      return;
    }

    // Réinitialisation des états du jeu
    this.stopVictorySequence();
    clearTimeout(this.crashTimer);
    this.isCrashing = false;
    const board = createBoard(levelData);
    this.specialBackground = null;
    // Hors suivi : l'effet qui appelle setupLevel ne doit pas se relancer à chaque changement de fond
    untracked(() => this.backgroundService.changeBackground(this.levelBackground()));
    this.levelName = levelData.name;
    this.targetScore = levelData.targetScore ?? null;
    this.bounds = getScoreBounds(levelData);
    this.score = board.score;
    this.displayedScore = board.score;
    this.gameState = 'playing';
    this.levelClicks = 0;
    this.history = [];
    this.isChoosingNotice = false;
    if (levelData.levelNumber !== this.visitedLevel) {
      this.visitedLevel = levelData.levelNumber;
      this.restartsSinceBeg = 0;
      this.restartsInARow = 0;
      this.cleanAttempt = true;
      this.notices = new Map();
      this.begNote = null;
      this.lastBeggedButton = null;
    }
    this.restartIdleTimer();

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

  // Le niveau suivant met en place son propre fond (voir setupLevel)
  public goToNextLevel(): void {
    this.levelService.advanceToNextLevel();
  }

  // Recommencer en pleine partie compte pour l'aide et pour « Têtu comme une mule » ; rejouer après une victoire, non
  public retryLevel(): void {
    if (this.gameState === 'playing') {
      this.restartsSinceBeg++;
      this.restartsInARow++;
      this.cleanAttempt = false;
      if (this.restartsInARow >= this.RESTARTS_FOR_MULE) this.achievementService.unlock('habit_restart');
    }
    this.reloadLevel();
  }

  private reloadLevel(): void {
    const levelData = this.levelService.currentLevelData();
    if (levelData) {
      this.setupLevel(levelData);
    }
  }

  // Fond d'ambiance du niveau s'il en a un (abysses des niveaux secrets, réseau de neurones des pionniers de l'IA),
  // sinon celui du moment de la journée
  private levelBackground(): string {
    return this.levelService.currentLevelData()?.background ?? this.backgroundService.getDefaultThemeName();
  }

  /**
   * Méthode centrale appelée au clic sur n'importe quel bouton.
   * @param button L'objet bouton sur lequel on a cliqué
   */
  public onButtonClick(button: GameButton): void {
    if (this.isChoosingNotice) {
      this.chooseNotice(button);
      return;
    }
    if (this.isBusy || button.isDisabled || this.gameState !== 'playing') return;
    this.wakeUp();
    this.stopVictorySequence();
    if (button.name === 'Split' && button.value === 0) {
      this.divideByZero();
      return;
    }

    this.history.push({
      score: this.score,
      buttons: this.buttons.map(({ name, value, totalClickCount, consecutiveClickCount, totalClickLimit, consecutiveClickLimit }) =>
        ({ name, value, totalClickCount, consecutiveClickCount, totalClickLimit, consecutiveClickLimit })),
      clicks: this.levelClicks
    });

    // Le moteur calcule le nouveau score ainsi que les nouvelles valeurs et compteurs des boutons
    const index = this.buttons.indexOf(button);
    const board = pressButton({ score: this.score, buttons: this.buttons }, index, this.bounds);
    // Favicon à 0 : dans le monde de la division par zéro, Split passe de 9 à 0 au lieu de revenir à 1
    if (button.name === 'Split' && button.value === MAX_BUTTON_VALUE && this.zeroSecret()) {
      board.buttons[index].value = 0;
    }
    board.buttons.forEach((state, i) => Object.assign(this.buttons[i], state));
    this.levelClicks++;
    this.statsService.addClick();
    if (new Date().getHours() < 4) this.achievementService.unlock('habit_night');

    this.animateScoreTo(board.score, () => {
      // Ce code ne s'exécutera QUE lorsque le score aura atteint sa cible
      this.updateAllButtons();
      this.checkGameState();
      this.checkBackgroundConditions();
      this.checkSecretScore();
      if (this.allLimitedButtonsUsedUp()) this.achievementService.unlock('habit_burnt');
    });
  }

  public get canUndo(): boolean {
    return this.history.length > 0 && !this.isBusy && this.gameState === 'playing';
  }

  /**
   * Annule le dernier clic : le score, les boutons et le nombre de clics reviennent à leur état précédent.
   */
  public undo(): void {
    const previous = this.canUndo ? this.history.pop() : undefined;
    if (!previous) return;
    this.wakeUp();
    this.stopVictorySequence();
    this.isChoosingNotice = false;
    this.cleanAttempt = false;
    this.statsService.addUndo();

    this.score = previous.score;
    this.displayedScore = previous.score;
    this.levelClicks = previous.clicks;
    previous.buttons.forEach((state, i) => Object.assign(this.buttons[i], state));
    this.updateAllButtons();
    // Retour à un plateau tout vert : ça se remet à trembler
    this.checkGameState();
  }

  // Le joueur agit : les bulles disparaissent, et la minute d'inaction repart de zéro
  private wakeUp(): void {
    if (this.specialBackground === 'bubbles') {
      this.specialBackground = null;
      this.backgroundService.changeBackground(this.levelBackground());
    }
    this.restartIdleTimer();
  }

  private restartIdleTimer(): void {
    clearTimeout(this.idleTimer);
    this.idleTimer = setTimeout(() => {
      // Pas de bulles par-dessus un autre fond spécial, une victoire ou un plantage
      if (this.gameState !== 'playing' || this.isBusy || this.isRumbling) return;
      this.achievementService.unlock('habit_idle');
      if (this.specialBackground) return;
      this.backgroundService.changeBackground('bubbles');
      this.specialBackground = 'bubbles';
    }, this.IDLE_DELAY_MS);
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

    if (event.key === 'Escape' && this.isChoosingNotice) {
      this.cancelBeg();
      return;
    }

    if (event.key === 'Escape' && this.showHelp) {
      this.closeHelp();
      return;
    }

    if (((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') || event.key === 'Backspace') {
      if (this.isChoosingNotice) return;
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

  // Bilan de la campagne, affiché après le dernier niveau, médailles fondues (en chocolat) comprises
  public medalTally(): { name: string; icon: string; count: number }[] {
    const palmares = countPalmares(this.levelService.bestMedals());
    return Object.entries(palmares).map(([name, count]) => ({ name, icon: this.MEDAL_ICONS[name], count }));
  }

  public isAllPlatinum(): boolean {
    return isAllPlatinum(this.levelService.levels(), this.levelService.bestMedals());
  }

  // --- L'AIDE QUI SE PAIE EN HONTE ---

  // Pas dans un niveau secret, et plus une fois que chaque bouton du niveau a sa notice complète
  public get canBeg(): boolean {
    const level = this.levelService.currentLevelData();
    return this.gameState === 'playing' && !!level && !level.secret && this.restartsSinceBeg >= this.RESTARTS_BEFORE_BEG
      && this.buttons.some(button => !this.isNoticeComplete(button));
  }

  public isNoticeComplete(button: GameButton): boolean {
    return (this.notices.get(button.name) ?? 0) >= NOTICE_PARTS.length;
  }

  // Un clic sur « Implorer » : la machine annonce son prix, puis le joueur clique sur le bouton qui le dépasse
  public beg(): void {
    if (this.isChoosingNotice) {
      this.cancelBeg();
      return;
    }
    if (this.isBusy || this.isRumbling || !this.canBeg) return;
    this.wakeUp();
    const results = this.levelService.bestMedals();
    const levelNumber = pickMedalToMelt(results);
    if (levelNumber === undefined) {
      this.begNote = { kind: 'nothing' };
      return;
    }
    this.begPrice = { icon: this.MEDAL_ICONS[results[levelNumber]], levelName: this.levelNameOf(levelNumber) };
    this.isChoosingNotice = true;
  }

  public cancelBeg(): void {
    this.isChoosingNotice = false;
  }

  // Le prix est payé : la médaille fond (en chocolat sur son niveau), et la moitié suivante de la notice s'affiche
  private chooseNotice(button: GameButton): void {
    if (this.isNoticeComplete(button)) return;
    const levelNumber = pickMedalToMelt(this.levelService.bestMedals());
    this.isChoosingNotice = false;
    if (levelNumber === undefined) return;

    const meltedMedal = this.levelService.bestMedals()[levelNumber];
    this.levelService.meltMedal(levelNumber);
    const revealed = this.notices.get(button.name) ?? 0;
    this.statsService.payForNotice(`${button.name}:${NOTICE_PARTS[revealed]}`, this.levelService.bestMedals());
    this.notices = new Map(this.notices).set(button.name, revealed + 1);
    this.begNote = {
      kind: 'melted',
      icon: this.MEDAL_ICONS[meltedMedal],
      levelName: this.levelNameOf(levelNumber),
      remark: Math.floor(Math.random() * this.BEG_REMARKS)
    };
    this.lastBeggedButton = button.name;
    this.restartsSinceBeg = 0;
  }

  // Les notices obtenues dans ce niveau, une par bouton, dans l'ordre des boutons
  public noticeButtons(): { name: ButtonName; parts: string[] }[] {
    const names = [...new Set(this.buttons.map(button => button.name))].filter(name => this.notices.has(name));
    return names.map(name => ({ name, parts: NOTICE_PARTS.slice(0, this.notices.get(name)) }));
  }

  private levelNameOf(levelNumber: number): string {
    return [...this.levelService.levels(), ...this.levelService.secretLevels()].find(level => level.levelNumber === levelNumber)?.name ?? '';
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

  const won = this.targetScore !== null ? this.score === this.targetScore : this.buttons.every(btn => btn.isConditionMet);
  if (won) {
    this.startVictorySequence();
  }
}

/**
 * Un score secret, atteint dans l'un des niveaux de son monde, débloque le niveau secret correspondant (avec un succès).
 */
private checkSecretScore(): void {
  const level = this.levelService.currentLevelData();
  if (!level || level.secret) return;
  this.levelService.secretLevelsOf(level.world)
    .filter(secretLevel => this.score === secretLevel.secret?.unlockScore)
    .forEach(secretLevel => this.achievementService.unlock(secretAchievementId(secretLevel)));
}

// Tous les boutons limités en nombre de clics n'en ont plus : « vous avez tout grillé »
private allLimitedButtonsUsedUp(): boolean {
  const limited = this.buttons.filter(button => button.clicksLeft !== null);
  return limited.length > 0 && limited.every(button => button.clicksLeft === 0);
}

// Le niveau secret de la division par zéro du monde en cours, tant qu'il reste à trouver et que le favicon affiche 0
private zeroSecret(): Level | undefined {
  const level = this.levelService.currentLevelData();
  if (!level || level.secret || this.faviconService.digit() !== 0) return undefined;
  return this.levelService.secretLevelsOf(level.world).find(secretLevel =>
    secretLevel.secret?.divisionByZero && !this.achievementService.unlockedAchievements().has(secretAchievementId(secretLevel)));
}

/**
 * Split à 0 : le jeu tente de diviser par zéro et « plante » (fond qui bugue, message d'erreur, plateau qui tremble),
 * puis débloque le niveau secret et redémarre le niveau. Le zéro a servi : l'onglet affiche un autre chiffre.
 */
private divideByZero(): void {
  const secretLevel = this.zeroSecret();
  this.isCrashing = true;
  this.backgroundService.changeBackground('cyberpunk');
  this.shakeBoard(RUMBLE_QUAKE, this.CRASH_DURATION_MS);
  this.crashTimer = setTimeout(() => {
    if (secretLevel) this.achievementService.unlock(secretAchievementId(secretLevel));
    this.faviconService.showDigit(1 + Math.floor(Math.random() * MAX_BUTTON_VALUE));
    this.reloadLevel();
  }, this.CRASH_DURATION_MS);
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
  const level = this.levelService.currentLevelData();
  const isFirstResult = !this.levelService.bestMedals()[levelNumber];
  this.isExploding = false;
  this.gameState = 'level_complete';
  this.calculateEarnedMedal();
  this.levelService.saveLevelResult(levelNumber, this.earnedMedal);
  this.backgroundService.changeBackground('constellation');
  // Niveau joué avec une notice : la pique de fin sera une pique de honte
  this.shameJab = Math.floor(Math.random() * this.SHAME_JABS);
  this.restartsInARow = 0;

  if (isFirstResult && this.cleanAttempt && this.earnedMedal === 'Platine' && level && !level.secret
    && level.world >= this.FIRST_TRY_FROM_WORLD) {
    this.achievementService.unlock('feat_first_try');
  }
  this.statsService.checkMedalAchievements(this.levelService.levels(), this.levelService.worlds(), this.levelService.bestMedals());

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
      this.backgroundService.changeBackground(this.levelBackground());
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
  } else if (this.allLimitedButtonsUsedUp()) {
    targetTheme = 'burnt';
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
