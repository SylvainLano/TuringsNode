import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

// Interface pour typer nos objets boutons, pour un code plus sûr
interface GameButton {
  name: 'Primer' | 'Split' | 'Booster'; // Noms possibles pour les boutons
  value: number; // Le chiffre associé (1-9)
  colorClass: 'is-green' | 'is-red'; // La classe CSS dynamique
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

  public score: number = 13; // Score de départ, un nombre premier est un bon choix
  public buttons: GameButton[] = [];
  private minScore: number = 4;

  ngOnInit(): void {
    // Initialisation de nos boutons
    this.buttons = [
      { name: 'Primer', value: 3, colorClass: 'is-red' },
      { name: 'Split', value: 2, colorClass: 'is-red' },
      { name: 'Booster', value: 5, colorClass: 'is-red' },
    ];

    // Calculer la couleur initiale des boutons au chargement
    this.updateAllButtonColors();
  }

  /**
   * Méthode centrale appelée au clic sur n'importe quel bouton.
   * @param button L'objet bouton sur lequel on a cliqué
   */
  public onButtonClick(button: GameButton): void {
    // 1. Exécute l'action spécifique au bouton (qui modifie le score)
    switch (button.name) {
      case 'Primer':
        this.performPrimerAction();
        break;
      case 'Split':
        this.performSplitAction(button);
        break;
      case 'Booster':
        this.performBoosterAction(button);
        break;
    }

    // 2. Incrémente la valeur du bouton cliqué (de 1 à 9, puis revient à 1)
    button.value = (button.value % 9) + 1;

    // 3. Met à jour la couleur de TOUS les boutons, car le score a changé
    this.updateAllButtonColors();
  }

  /**
   * Met à jour la classe de couleur pour chaque bouton en fonction de sa condition.
   */
  private updateAllButtonColors(): void {
    this.buttons.forEach(button => {
      let isConditionMet = false;
      switch (button.name) {
        case 'Primer':
          isConditionMet = this.isPrimerConditionMet(button);
          break;
        case 'Split':
          isConditionMet = this.isSplitConditionMet(button);
          break;
        case 'Booster':
          isConditionMet = this.isBoosterConditionMet(button);
          break;
      }
      button.colorClass = isConditionMet ? 'is-green' : 'is-red';
    });
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

  private performBoosterAction(button: GameButton): void {
    this.score += button.value;
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

  private isBoosterConditionMet(button: GameButton): boolean {
    // Le bouton est vert si le score est un carré parfait
    const sqrt = Math.sqrt(this.score);
    return sqrt === Math.floor(sqrt);
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
}
