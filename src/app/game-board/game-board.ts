import { TranslationService } from './../core/services/translation';
import { NotificationService } from './../core/services/notification';
import { Component, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BackgroundService } from '../core/services/background';
import { LevelService } from '../core/services/level';
import { ActivatedRoute } from '@angular/router';
import { TranslatePipe } from '../shared/pipes/translate-pipe';
import { AchievementService } from '../core/services/achievement';

// Interface pour typer nos objets boutons, pour un code plus sûr
interface GameButton {
  name: 'Primer' | 'Split' | 'Boost' | 'Digit' | 'Reduce' | 'Align' | 'Fiber' | 'Factor' | 'Cipher'; // Noms possibles pour les boutons
  value: number; // Le chiffre associé (1-9)
  colorClass: 'is-green' | 'is-red' | 'is-gold'; // La classe CSS dynamique
  isDisabled: boolean;
  isConditionMet: boolean;
  totalClickCount: number;
  consecutiveClickCount: number;
  totalClickLimit: number|null;
  consecutiveClickLimit: number|null;
}

export interface LevelButtonConfig {
  name: any;
  initialValue: number;
}

export interface Level {
  levelNumber: number;
  startScore: number;
  minScore: number | null;
  maxScore: number | null;
  minSteps: number;
  goldSteps: number;
  silverSteps: number;
  bronzeSteps: number;
  buttons: LevelButtonConfig[];
}

@Component({
  selector: 'app-game-board',
  standalone: true,
  imports: [
    CommonModule,
    TranslatePipe
  ],
  templateUrl: './game-board.html',
  styleUrls: ['./game-board.scss']
})

export class GameBoardComponent implements OnInit {

  public gameState: 'playing' | 'level_complete' = 'playing';
  public earnedMedal: string | null = null;
  public levelClicks: number = 0;
  private score: number = 42;
  public displayedScore: number = 42;
  public isAnimatingScore: boolean = false;
  public buttons: GameButton[] = [];
  private minScore: number = 10;
  private maxScore: number = Number.MAX_SAFE_INTEGER;
  private specialBackground: string | null = null;
  private clicksSinceBgChange: number = 0;
  private timestampBgChange: number = 0;
  private readonly SPECIAL_BG_CLICK_LIMIT = 25;
  private readonly SPECIAL_BG_TIME_LIMIT_MS = 60 * 1000; // 1 minute en millisecondes
  private initialSetupDone = false;

  // On stocke les constantes sous forme de chaînes de caractères pour éviter les limites de précision
  private readonly FAMOUS_NUMBERS: Record<number, string> = {
    1: '16180339887', // Nombre d'or (Phi)
    2: '27182818284', // Nombre d'Euler (e)
    3: '31415926535', // Pi (π)
    4: '4815162342',  // Série de nombres dans Lost
    5: '5670374419',  // Constante de Stefan-Boltzmann
    6: '662607015',   // Constante de Planck
    7: '76009024595', // ln(2000)
    8: '88541878128', // Permittivité du vide
    9: '299792458'    // Vitesse de la lumière
  };

  constructor(
    private backgroundService: BackgroundService,
    private notificationService: NotificationService,
    private translationService: TranslationService,
    public levelService: LevelService,
    private route: ActivatedRoute,
    private achievementService: AchievementService
  ) {
    // L'effect reste bien dans le constructor
    effect(() => {
      const allLevels = this.levelService.levels();

      if (allLevels.length > 0) {

        // On n'exécute cette partie qu'une seule fois au démarrage
        if (!this.initialSetupDone) {
          this.initialSetupDone = true; // On lève le drapeau immédiatement

          const params = this.route.snapshot.queryParamMap;
          const orderParam = params.get('order');
          const startParam = params.get('start');

          let processedLevels = [...allLevels];

          if (orderParam === 'reverse') {
            processedLevels.reverse();
            // On met à jour le service avec la liste potentiellement inversée
            this.levelService.levels.set(processedLevels);
          }

          let startLevelNum = processedLevels[0].levelNumber;
          if (startParam === 'last') {
            startLevelNum = processedLevels[processedLevels.length - 1].levelNumber;
          }

          this.levelService.currentLevelNumber.set(startLevelNum);
        }

        // Cette partie s'exécutera à chaque changement de niveau (y compris le premier)
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
    this.specialBackground = null;
    this.score = levelData.startScore;
    if (levelData.minScore) { this.minScore = levelData.minScore}
    if (levelData.maxScore) { this.maxScore = levelData.maxScore}
    this.displayedScore = levelData.startScore;
    this.gameState = 'playing';
    this.levelClicks = 0;

    // Création des boutons à partir des données du niveau
    this.buttons = levelData.buttons.map(config =>
      this.createButton(config.name as GameButton['name'], config.initialValue)
    );

    // Mise à jour des boutons
    this.updateAllButtonStates();
    this.updateAllButtonColors();
    this.updateAllButtonDisabledStates();
  }

  /**
   * Fonction fabrique de boutons
   */
  private createButton(name: GameButton['name'], value: number): GameButton {
    return {
      name: name,
      value: value,
      colorClass: 'is-red', // Valeur par défaut
      isDisabled: false, // Valeur par défaut
      isConditionMet: false, // Valeur par défaut
      totalClickCount: 0, // Valeur par défaut
      consecutiveClickCount: 0, // Valeur par défaut
      totalClickLimit: null, // Valeur par défaut
      consecutiveClickLimit: null, // Valeur par défaut
    };
  }

  public goToNextLevel(): void {
    this.levelService.advanceToNextLevel();
    this.backgroundService.changeBackground(this.getDefaultThemeName());
  }

  public retryLevel(): void {
    const levelData = this.levelService.currentLevelData();
    if (levelData) {
      this.setupLevel(levelData);
      this.backgroundService.changeBackground(this.getDefaultThemeName());
    }
  }

  /**
   * Méthode centrale appelée au clic sur n'importe quel bouton.
   * @param button L'objet bouton sur lequel on a cliqué
   */
  public onButtonClick(button: GameButton): void {
    if (this.isAnimatingScore || button.isDisabled) return;
    let newScore = this.score;

    // 1. Exécute l'action spécifique au bouton (qui modifie le score)
    switch (button.name) {
      case 'Primer': newScore = this.performPrimerAction(); break;
      case 'Split': newScore = this.performSplitAction(button); break;
      case 'Boost': newScore = this.performBoostAction(button); break;
      case 'Digit': newScore = this.performDigitAction(button); break;
      case 'Reduce': newScore = this.performReduceAction(button); break;
      case 'Align': newScore = this.performAlignAction(button); break;
      case 'Fiber': newScore = this.performFiberAction(); break;
      case 'Factor': newScore = this.performFactorAction(button); break;
      case 'Cipher': newScore = this.performCipherAction(button); break;
    }

    // 2. Incrémente la valeur du bouton cliqué (de 1 à 9, puis revient à 1)
    button.value = (button.value % 9) + 1;

    newScore = this.applyBouncingBoundaries(newScore);
    this.animateScoreTo(newScore, () => {
      // Ce code ne s'exécutera QUE lorsque le score aura atteint sa cible
      this.updateAllButtonStates();
      this.updateAllButtonColors();
      this.updateAllButtonDisabledStates();
      this.checkGameState();
      this.checkBackgroundConditions();
    });

    // Mise à jour des compteurs de clics
    this.levelClicks++;
    this.buttons.forEach(btn => {
      if (btn === button) {
        // Pour le bouton qui vient d'être cliqué
        btn.totalClickCount++;
        btn.consecutiveClickCount++;
      } else {
        // Pour tous les autres boutons, la série de clics consécutifs est rompue
        btn.consecutiveClickCount = 0;
      }
    });
  }

  /**
   * Met à jour la classe de couleur pour chaque bouton en fonction de sa condition.
   */
  private updateAllButtonStates(): void {
    this.buttons.forEach(button => {
      let isConditionMet = false;
      switch (button.name) {
        case 'Primer': isConditionMet = this.isPrimerConditionMet(button); break;
        case 'Split': isConditionMet = this.isSplitConditionMet(button); break;
        case 'Boost': isConditionMet = this.isBoostConditionMet(button); break;
        case 'Digit': isConditionMet = this.isDigitConditionMet(button); break;
        case 'Reduce': isConditionMet = this.isReduceConditionMet(button); break;
        case 'Align': isConditionMet = this.isAlignConditionMet(button); break;
        case 'Fiber': isConditionMet = this.isFiberConditionMet(); break;
        case 'Factor': isConditionMet = this.isFactorConditionMet(); break;
        case 'Cipher': isConditionMet = this.isCipherConditionMet(); break;
      }
      button.isConditionMet = isConditionMet;
    });
  }

  // Met à jour la couleur en se basant sur l'état logique
  private updateAllButtonColors(): void {
    const scoreStr = String(this.score);
    this.buttons.forEach(button => {
      if (button.isConditionMet) {
        button.colorClass = 'is-green';
      } else {
        button.colorClass = 'is-red';
      }

      // --- CONDITION SPÉCIALE "OR" ---
      const famousNumber = this.FAMOUS_NUMBERS[button.value];
      // On vérifie si le score a au moins 4 chiffres et s'il est le début du nombre célèbre associé.
      if (famousNumber && scoreStr.length >= 4 && famousNumber.startsWith(scoreStr)) {
        button.colorClass = 'is-gold';

        // On récupère le nom traduit de la constante
        const achievementId = `golden_${button.value}`;
        this.achievementService.unlock(achievementId);
      }
    });
  }

  private updateAllButtonDisabledStates(): void {
    this.buttons.forEach(button => {
      const totalLimitReached = button.totalClickLimit !== null && button.totalClickLimit !== 0 && button.totalClickCount >= button.totalClickLimit;
      const consecutiveLimitReached = button.consecutiveClickLimit !== null && button.consecutiveClickLimit !== 0 && button.consecutiveClickCount >= button.consecutiveClickLimit;

      button.isDisabled = totalLimitReached || consecutiveLimitReached;
    });
  }

  // --- FONCTIONS ESTHÉTIQUES ---
  public getScoreColor() {
    return this.backgroundService.state().scoreColor;
  }

// Dans game-board.ts

/**
 * Logique de l'état de victoire/défaite.
 */
private checkGameState(): void {
  if (this.gameState !== 'playing') return;

  if (this.buttons.every(btn => btn.isConditionMet)) {
    this.gameState = 'level_complete';
    this.calculateEarnedMedal();
    const currentLevelNum = this.levelService.currentLevelNumber();
    this.levelService.markLevelAsComplete(currentLevelNum);
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
      this.backgroundService.changeBackground(this.getDefaultThemeName());
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
  } else if (this.score === this.minScore) {
    targetTheme = 'snow';
  }

  if (targetTheme && this.specialBackground !== targetTheme) {
    this.backgroundService.changeBackground(targetTheme);
    this.specialBackground = targetTheme;
    this.clicksSinceBgChange = 0;
    this.timestampBgChange = Date.now();
  }
}

  private getDefaultThemeName(): 'day' | 'night' {
    const now = new Date();
    const currentHour = now.getHours();

    // Calcule le jour de l'année (de 1 à 365)
    const startOfYear = new Date(now.getFullYear(), 0, 0);
    const diff = now.getTime() - startOfYear.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);

    // On définit nos extrêmes pour l'hémisphère Nord
    // Solstice d'hiver (jour ~170, le plus court) : nuit de 17h à 8h
    const winterSunset = 17;
    const winterSunrise = 8;
    // Solstice d'été (jour ~172, le plus long) : nuit de 22h à 5h
    const summerSunset = 22;
    const summerSunrise = 5;

    // On calcule la progression entre l'hiver et l'été.
    // On utilise une fonction cosinus pour une transition douce et cyclique.
    // Le résultat est entre -1 (pic de l'hiver) et 1 (pic de l'été).
    const progress = Math.cos((dayOfYear - 172) * (2 * Math.PI / 365.25));

    // On interpole les heures de lever et de coucher du soleil pour aujourd'hui
    // (progress + 1) / 2 nous donne une valeur de 0 (hiver) à 1 (été)
    const todaySunrise = winterSunrise + (summerSunrise - winterSunrise) * (progress + 1) / 2;
    const todaySunset = winterSunset + (summerSunset - winterSunset) * (progress + 1) / 2;

    // --- POUR L'HÉMISPHÈRE SUD ---
    // Il suffirait d'inverser la progression :
    // const progress = Math.cos((dayOfYear - 172 + 182.625) * (2 * Math.PI / 365.25));
    // Ou plus simplement, d'inverser les valeurs été/hiver au début.

    // On vérifie si l'heure actuelle est dans la plage de la nuit
    if (currentHour >= todaySunset || currentHour < todaySunrise) {
      return 'night';
    }

    return 'day';
  }

  // --- ACTIONS DES BOUTONS ---

  private performPrimerAction(): number {
    return this.findNextPrime(this.score);
  }

  private performSplitAction(button: GameButton): number {
    // On divise, en s'assurant de ne pas avoir de nombres à virgule
    return Math.ceil(this.score / button.value);
  }

  private performBoostAction(button: GameButton): number {
    return this.score + button.value;
  }

  private performDigitAction(button: GameButton): number {
    return this.score * button.value;
  }

  private performReduceAction(button: GameButton): number {
    return Math.ceil(this.score / (button.value * button.value));
  }

  private performAlignAction(button: GameButton): number {
    return this.score + (button.value - (this.score % button.value));
  }

  private performFiberAction(): number {
    let a = 0, b = 1;
    while (b <= this.score) {
      let temp = a;
      a = b;
      b = temp + b;
    }
    return b;
  }

  private performFactorAction(button: GameButton): number {
    return this.score + this.factorial(button.value);
  }

  private performCipherAction(button: GameButton): number {
    const newScoreStr = String(this.score)
      .split('')
      .map(digit => (Number(digit) + button.value) % 10)
      .join('');
    return Number(newScoreStr);
  }

  // --- CONDITIONS "VERT" DES BOUTONS ---

  private isPrimerConditionMet(button: GameButton): boolean {
    const lowerBound = this.score - button.value;
    const upperBound = this.score + button.value;
    for (let i = lowerBound; i <= upperBound; i++) {
      if (this.isPrime(i)) {
        return true; // Un nombre premier a été trouvé dans la fourchette
      }
    }
    return false;
  }

  private isSplitConditionMet(button: GameButton): boolean {
    // Le bouton est vert si le score est divisible par la valeur du bouton
    return this.score % button.value === 0;
  }

  private isBoostConditionMet(button: GameButton): boolean {
    // Le bouton est vert si le score est un carré parfait
    const sqrt = Math.sqrt(this.score);
    return sqrt === Math.floor(sqrt);
  }

  private isDigitConditionMet(button: GameButton): boolean {
    // Le bouton est vert si la somme des chiffres du score est la valeur du bouton
    const scoreValue = this.calculerRacineNumerique(this.score);
    return scoreValue === button.value;
  }

  private isReduceConditionMet(button: GameButton): boolean {
    // On boucle sur des carrés parfaits (4, 9, 16, 25...) jusqu'à la valeur du score
    for (let i = 2; i * i <= this.score; i++) {
      const perfectSquare = i * i;
      // Si le score est un multiple d'un carré parfait, la condition est remplie
      if (this.score % perfectSquare === 0) {
        return true;
      }
    }
    return false;
  }

  private isAlignConditionMet(button: GameButton): boolean {
    // Le bouton est vert si le score est une puissance parfaite de la valeur du bouton
    return this.estPalindrome(this.score);
  }

  private isFiberConditionMet(): boolean {
    if (this.score < 0) return false;
    const test1 = 5 * this.score * this.score + 4;
    const test2 = 5 * this.score * this.score - 4;
    return this.isPerfectSquare(test1) || this.isPerfectSquare(test2);
  }

  private isFactorConditionMet(): boolean {
    if (this.score <= 0) return false;
    let i = 1;
    let fact = 1;
    while (fact < this.score) {
      i++;
      fact *= i;
    }
    return fact === this.score;
  }

  private isCipherConditionMet(): boolean {
    const scoreStr = String(this.score);
    const uniqueDigits = new Set(scoreStr.split(''));
    return scoreStr.length === uniqueDigits.size;
  }

  // --- FONCTIONS UTILITAIRES ---

  private isPrime(num: number): boolean {
    if (num <= 1) return false;
    for (let i = 2; i <= Math.sqrt(num); i++) {
      if (num % i === 0) return false;
    }
    return true;
  }

  private findNextPrime(num: number): number {
    let nextNum = num + 1;
    while (true) {
      if (this.isPrime(nextNum)) {
        return nextNum;
      }
      nextNum++;
    }
  }

  private applyBouncingBoundaries(num: number): number {
    const range = this.maxScore - this.minScore;

    // Si la plage est nulle ou invalide, on ne fait rien pour éviter les divisions par zéro.
    if (range <= 0) {
      return num;
    }

    // 1. On normalise le nombre par rapport au minimum.
    const normalizedNum = num - this.minScore;

    // 2. On utilise le modulo sur le double de la plage pour simuler l'aller-retour.
    let remainder = normalizedNum % (2 * range);

    // S'assure que le reste est positif.
    if (remainder < 0) {
      remainder += (2 * range);
    }

    // 3. On détermine la position finale.
    if (remainder < range) {
      // Le nombre est dans la phase "montante" depuis le minScore.
      return this.minScore + remainder;
    } else {
      // Le nombre est dans la phase "descendante" depuis le maxScore.
      return this.maxScore - (remainder - range);
    }
  }

  private calculerRacineNumerique(nombre:number): number {
    // Continue la boucle tant que le nombre a plus d'un chiffre.
    while (nombre > 9) {
      // Ré-assigne 'nombre' avec la somme de ses propres chiffres.
      nombre = String(nombre)
        .split('')
        .reduce((accumulateur, chiffre) => accumulateur + Number(chiffre), 0);
    }

    // Retourne le résultat final, qui est un chiffre unique.
    return nombre;
  }

  private estPalindrome(nombre: number): boolean {
    // Convertit le nombre en chaîne de caractères.
    const chaineOriginale = String(nombre);

    // Inverse la chaîne.
    const chaineInversee = chaineOriginale.split('').reverse().join('');

    // Compare la chaîne originale à la chaîne inversée.
    return chaineOriginale === chaineInversee;
  }

  private isPerfectSquare(num: number): boolean {
    const sqrt = Math.sqrt(num);
    return sqrt === Math.floor(sqrt);
  }

  private factorial(n: number): number {
    if (n < 0) return 0;
    let result = 1;
    for (let i = 2; i <= n; i++) {
      result *= i;
    }
    return result;
  }

  private animateScoreTo(targetScore: number, onComplete?: () => void): void {
    // On arrondit la cible pour éviter les problèmes de nombres à virgule
    targetScore = Math.round(targetScore);
    const startScore = this.score;

    if (targetScore === startScore) return;

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
    if (!levelData) {
      this.earnedMedal = null;
      return;
    }

    const clicks = this.levelClicks;

    if (clicks <= levelData.minSteps) {
      this.earnedMedal = 'Platine';
    } else if (clicks <= levelData.goldSteps) {
      this.earnedMedal = 'Or';
    } else if (clicks <= levelData.silverSteps) {
      this.earnedMedal = 'Argent';
    } else if (clicks <= levelData.bronzeSteps) {
      this.earnedMedal = 'Bronze';
    } else {
      this.earnedMedal = null; // Aucune médaille
    }
  }
}
