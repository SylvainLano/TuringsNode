import { Component, OnInit, effect, ChangeDetectionStrategy } from '@angular/core';
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
  isGoldenScore,
  pressButton
} from '../core/engine';

// Un bouton affiché : son état dans le moteur, complété par son état visuel
interface GameButton extends ButtonState {
  colorClass: 'is-green' | 'is-red' | 'is-gold'; // La classe CSS dynamique
  isDisabled: boolean;
  isConditionMet: boolean;
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
  styleUrls: ['./game-board.scss']
})

export class GameBoardComponent implements OnInit {

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

  constructor(
    private backgroundService: BackgroundService,
    public levelService: LevelService,
    private route: ActivatedRoute,
    private achievementService: AchievementService
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
          this.setupLevel(levelData);
        }
      }
    });
  }

  ngOnInit(): void {}

  private setupLevel(levelData: Level): void {
    if (!levelData) {
      console.error("Données du niveau introuvables !");
      return;
    }

    // Réinitialisation des états du jeu
    const board = createBoard(levelData);
    this.specialBackground = null;
    this.bounds = getScoreBounds(levelData);
    this.score = board.score;
    this.displayedScore = board.score;
    this.gameState = 'playing';
    this.levelClicks = 0;

    // Création des boutons à partir des données du niveau
    this.buttons = board.buttons.map(state => ({
      ...state,
      colorClass: 'is-red',
      isDisabled: false,
      isConditionMet: false
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
    if (this.isAnimatingScore || button.isDisabled) return;

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

      button.isDisabled = isButtonDisabled(button);
    });
  }

  // --- FONCTIONS ESTHÉTIQUES ---
  public getScoreColor() {
    return this.backgroundService.state().scoreColor;
  }

/**
 * Logique de l'état de victoire/défaite.
 */
private checkGameState(): void {
  if (this.gameState !== 'playing') return;

  if (this.buttons.every(btn => btn.isConditionMet)) {
    this.gameState = 'level_complete';
    this.calculateEarnedMedal();
    const currentLevelNum = this.levelService.currentLevelNumber();
    this.levelService.saveLevelResult(currentLevelNum, this.earnedMedal);
  }
}

/**
 * Logique du fond d'écran.
 */
private checkBackgroundConditions(): void {
  // --- ÉTAPE 1 : Si on a gagné, forcer le thème de victoire ---
  if (this.gameState === 'level_complete') {
    this.backgroundService.changeBackground('constellation');
    return; // On arrête tout, la victoire a la priorité
  }

  // --- ÉTAPE 2 : Gérer l'expiration d'un thème en cours ---
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

  // --- ÉTAPE 3 : Vérifier si un nouveau thème doit s'activer ---
  let targetTheme: string | null = null;
  if (this.buttons.every(btn => btn.colorClass === 'is-red')) {
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
