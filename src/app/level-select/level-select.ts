import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router'; // <-- Importer Router et RouterLink
import { LevelService } from '../core/services/level';
import { TranslatePipe } from '../shared/pipes/translate-pipe';

@Component({
  selector: 'app-level-select',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslatePipe],
  templateUrl: './level-select.html',
  styleUrl: './level-select.scss'
})
export class LevelSelectComponent {
  public allLevels;
  public bestMedals;

  constructor(
    private levelService: LevelService,
    private router: Router
  ) {
    this.allLevels = this.levelService.levels;
    this.bestMedals = this.levelService.bestMedals;
  }

  /**
   * Vérifie si un niveau est débloqué.
   * La règle : les niveaux terminés + le premier niveau non terminé consécutivement.
   * @param levelNumber Le numéro du niveau à vérifier.
   */
  isLevelUnlocked(levelNumber: number): boolean {
    if (levelNumber === 1) return true;
    // Un niveau est débloqué si le précédent a une médaille
    return !!this.bestMedals()[levelNumber - 1];
  }

  /**
   * Sélectionne un niveau et navigue vers le plateau de jeu.
   * @param levelNumber Le numéro du niveau à charger.
   */
  selectLevel(levelNumber: number): void {
    if (!this.isLevelUnlocked(levelNumber)) {
      return; // Ne fait rien si le niveau est verrouillé
    }
    // On dit au service quel niveau charger
    this.levelService.currentLevelNumber.set(levelNumber);
    // On navigue vers la page de jeu
    this.router.navigate(['/game']);
  }
}
