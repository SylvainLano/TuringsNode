import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BackgroundService, BackgroundState } from '../core/services/background';

// Interface pour typer nos objets boutons, pour un code plus sûr
interface GameButton {
  name: 'Primer' | 'Split' | 'Boost' | 'Digit' | 'Reduce' | 'Align' | 'Fiber' | 'Factor' | 'Cipher'; // Noms possibles pour les boutons
  value: number; // Le chiffre associé (1-9)
  colorClass: 'is-green' | 'is-red'; // La classe CSS dynamique
  isDisabled: boolean;
  totalClickCount: number;
  consecutiveClickCount: number;
  totalClickLimit: number|null;
  consecutiveClickLimit: number|null;
}

@Component({
  selector: 'app-game-board',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './game-board.html',
  styleUrls: ['./game-board.scss']
})

export class GameBoardComponent implements OnInit {

  public score: number = 42;
  public buttons: GameButton[] = [];
  private minScore: number = 10;
  private backgroundHasPriority: boolean = false;

  constructor(private backgroundService: BackgroundService) {}

  ngOnInit(): void {
    // Initialisation de nos boutons
    const buttonConfigs = [
      { name: 'Primer', value: 1 },
      { name: 'Split', value: 2 },
      { name: 'Boost', value: 3 },
      { name: 'Digit', value: 4 },
      { name: 'Reduce', value: 5 },
      { name: 'Align', value: 6 },
      { name: 'Fiber', value: 7 },
      { name: 'Factor', value: 8 },
      { name: 'Cipher', value: 9 },
    ];

    // 2. Utiliser .map() et la fonction fabrique pour créer le tableau final
    this.buttons = buttonConfigs.map(config =>
      this.createButton(config.name as GameButton['name'], config.value)
    );

    // Calculer la couleur et l'état initiaux des boutons au chargement
    this.updateAllButtonColors();
    this.updateAllButtonDisabledStates();
  }

  /**
   * 3. Voici la fonction fabrique !
   * Elle prend le minimum d'informations et retourne un objet GameButton complet.
   */
  private createButton(name: GameButton['name'], value: number): GameButton {
    return {
      name: name,
      value: value,
      colorClass: 'is-red', // Valeur par défaut
      isDisabled: false, // Valeur par défaut
      totalClickCount: 0, // Valeur par défaut
      consecutiveClickCount: 0, // Valeur par défaut
      totalClickLimit: null, // Valeur par défaut
      consecutiveClickLimit: null, // Valeur par défaut
    };
  }

  /**
   * Méthode centrale appelée au clic sur n'importe quel bouton.
   * @param button L'objet bouton sur lequel on a cliqué
   */
  public onButtonClick(button: GameButton): void {

    // 1. Exécute l'action spécifique au bouton (qui modifie le score)
    switch (button.name) {
      case 'Primer': this.performPrimerAction(); break;
      case 'Split': this.performSplitAction(button); break;
      case 'Boost': this.performBoostAction(button); break;
      case 'Digit': this.performDigitAction(button); break;
      case 'Reduce': this.performReduceAction(button); break;
      case 'Align': this.performAlignAction(button); break;
      case 'Fiber': this.performFiberAction(); break;
      case 'Factor': this.performFactorAction(button); break;
      case 'Cipher': this.performCipherAction(button); break;
    }

    // 2. Incrémente la valeur du bouton cliqué (de 1 à 9, puis revient à 1)
    button.value = (button.value % 9) + 1;

    // Mise à jour des compteurs de clics
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

    // 3. Met à jour TOUS les boutons et vérifie les conditions de victoire ou de background, car le score a changé
    this.updateAllButtonColors();
    this.updateAllButtonDisabledStates();
    this.checkBackgroundConditions();

  }

  /**
   * Met à jour la classe de couleur pour chaque bouton en fonction de sa condition.
   */
  private updateAllButtonColors(): void {
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
      button.colorClass = isConditionMet ? 'is-green' : 'is-red';
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
    if (this.backgroundService.state().value == "matrix" || this.backgroundService.state().value == "snow") {
      return "light";
    } else  {
      return "dark";
    }
  }

  private checkBackgroundConditions(): void {
    // Si un fond prioritaire (victoire) est déjà actif, on ne fait rien.
    if (this.backgroundHasPriority) {
      return;
    }

    // Condition de Victoire : Tous les boutons sont verts
    const isVictory = this.buttons.every(btn => btn.colorClass === 'is-green');
    if (isVictory) {
      this.backgroundService.setActiveBackground({ type: 'particles', value: 'constellation' });
      this.backgroundHasPriority = true; // Bloque les autres changements de fond
      return; // On arrête ici, c'est la condition la plus importante
    }

    // Condition d'Échec : Tous les boutons sont rouges
    const isFailure = this.buttons.every(btn => btn.colorClass === 'is-red');
    if (isFailure) {
      this.backgroundService.setActiveBackground({ type: 'particles', value: 'angry' });
      return;
    }

    // Condition "Matrix" : Score est une chaîne de 8 caractères contenant uniquement 0 et 1
    const isMatrixScore = /^[01]{8}$/.test(String(this.score));
    if (isMatrixScore) {
      this.backgroundService.setActiveBackground({ type: 'particles', value: 'matrix' });
      return;
    }

    // Condition "Snow" : Le score a atteint le minimum
    if (this.score === this.minScore) {
      this.backgroundService.setActiveBackground({ type: 'particles', value: 'snow' });
      return;
    }

    // Si aucune des conditions spéciales n'est remplie, on revient au fond par défaut
    if (this.backgroundService.state().value !== 'pastel') {
        this.backgroundService.setActiveBackground({ type: 'particles', value: 'pastel' });
    }
  }

  // --- ACTIONS DES BOUTONS ---

  private performPrimerAction(): void {
    this.score = this.findNextPrime(this.score);
    this.score = this.checkMinScore(this.score);
  }

  private performSplitAction(button: GameButton): void {
    // On divise, en s'assurant de ne pas avoir de nombres à virgule
    this.score = Math.ceil(this.score / button.value);
    this.score = this.checkMinScore(this.score);
  }

  private performBoostAction(button: GameButton): void {
    this.score += button.value;
    this.score = this.checkMinScore(this.score);
  }

  private performDigitAction(button: GameButton): void {
    this.score *= button.value;
    this.score = this.checkMinScore(this.score);
  }

  private performReduceAction(button: GameButton): void {
    this.score = Math.ceil(this.score ** (1 / button.value));
    this.score = this.checkMinScore(this.score);
  }

  private performAlignAction(button: GameButton): void {
    this.score = this.score + (button.value - (this.score % button.value));
    this.score = this.checkMinScore(this.score);
  }

  private performFiberAction(): void {
    let a = 0, b = 1;
    while (b <= this.score) {
      let temp = a;
      a = b;
      b = temp + b;
    }
    this.score = b;
    this.score = this.checkMinScore(this.score);
  }

  private performFactorAction(button: GameButton): void {
    this.score += this.factorial(button.value);
    this.score = this.checkMinScore(this.score);
  }

  private performCipherAction(button: GameButton): void {
    const newScoreStr = String(this.score)
      .split('')
      .map(digit => (Number(digit) + button.value) % 10)
      .join('');
    this.score = Number(newScoreStr);
    this.score = this.checkMinScore(this.score);
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
    // Le bouton est vert si le score est une puissance parfaite de la valeur du bouton
    return this.estPuissanceParfaiteLog(this.score, button.value);
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

  private checkMinScore(num:number): number {
    if (num < this.minScore) {
      num = this.minScore - (num - this.minScore);
    }
    return num;
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

  private estPuissanceParfaiteLog(score:number, bouton:number): boolean {
    // Une puissance ne peut pas être calculée avec une base inférieure ou égale à 1
    // (sauf le cas trivial 1^n = 1).
    if (bouton <= 1) {
      return score === 1;
    }

    // Calcule l'exposant 'n' potentiel
    const exposant = Math.log(score) / Math.log(bouton);

    // Arrondit au nombre entier le plus proche pour contrer les imprécisions
    const exposantArrondi = Math.round(exposant);

    // Vérifie si la base élevée à la puissance de l'exposant arrondi redonne bien le score original.
    return Math.pow(bouton, exposantArrondi) === score;
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
}
