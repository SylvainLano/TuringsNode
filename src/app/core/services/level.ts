import { Injectable, computed, signal, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { StorageService } from './storage';
import { APP_BASE_HREF } from '@angular/common';

// On définit des interfaces pour typer nos données, c'est plus propre
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

@Injectable({
  providedIn: 'root'
})
export class LevelService {
  public readonly levels = signal<Level[]>([]);
  public readonly currentLevelNumber = signal(1);

  public readonly bestMedals = signal<Record<number, string>>({});
  private readonly BEST_MEDALS_KEY = 'turings_node_best_medals';
  private readonly MEDAL_HIERARCHY = ['Terminé', 'Bronze', 'Argent', 'Or', 'Platine'];

  public readonly currentLevelData = computed(() => {
    const allLevels = this.levels();
    const levelNum = this.currentLevelNumber();
    return allLevels.find(l => l.levelNumber === levelNum) || null;
  });

  constructor(
    private http: HttpClient,
    private storageService: StorageService,
    @Inject(APP_BASE_HREF) private baseHref: string
  ) {
    const path = `${this.baseHref}assets/levels.json`;

    this.http.get<Level[]>(path).subscribe(data => {
      this.levels.set(data);

      const savedMedals = this.storageService.getData(this.BEST_MEDALS_KEY);
      if (savedMedals) {
        this.bestMedals.set(savedMedals);
      }

      // On définit le niveau de départ comme le premier niveau non terminé
      this.setInitialLevel();
    });
  }

  public saveLevelResult(levelNumber: number, medal: string | null): void {
    // Si le joueur n'a gagné aucune médaille, on considère le niveau comme "Terminé".
    const resultToSave = medal || 'Terminé';

    const currentBestMedals = this.bestMedals();
    const existingResult = currentBestMedals[levelNumber];

    // On compare la valeur du nouveau résultat avec l'ancien
    const newResultValue = this.MEDAL_HIERARCHY.indexOf(resultToSave);
    const existingResultValue = existingResult ? this.MEDAL_HIERARCHY.indexOf(existingResult) : -1;

    // On ne sauvegarde que si le nouveau résultat est meilleur (ou si c'est la première fois)
    if (newResultValue > existingResultValue) {
      this.bestMedals.update(medals => ({
        ...medals,
        [levelNumber]: resultToSave
      }));
      this.storageService.saveData(this.BEST_MEDALS_KEY, this.bestMedals());
    }
  }

  private setInitialLevel(): void {
    const bestMedals = this.bestMedals();
    const completedLevels = Object.keys(bestMedals).map(Number);

    let highestConsecutive = 0;
    for (let i = 1; i <= this.levels().length; i++) {
      if (completedLevels.includes(i)) {
        highestConsecutive = i;
      } else {
        break;
      }
    }
    // On commence au niveau suivant le plus haut niveau consécutif terminé
    // ou au dernier niveau si tout est terminé
    const startLevel = Math.min(highestConsecutive + 1, this.levels().length || 1);
    this.currentLevelNumber.set(startLevel);
  }

  public advanceToNextLevel(): void {
    const allLevels = this.levels();
    const currentNum = this.currentLevelNumber();
    const currentIndex = allLevels.findIndex(l => l.levelNumber === currentNum);

    if (currentIndex > -1 && currentIndex < allLevels.length - 1) {
      this.currentLevelNumber.set(allLevels[currentIndex + 1].levelNumber);
    } else {
      console.log("Dernier niveau terminé !");
    }
  }

  public restartProgress(): void {
    this.currentLevelNumber.set(1);
  }
}
