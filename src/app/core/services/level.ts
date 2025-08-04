import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { StorageService } from './storage';

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

  public readonly completedLevels = signal<number[]>([]);
  private readonly COMPLETED_LEVELS_KEY = 'turings_node_completed_levels';

  public readonly currentLevelData = computed(() => {
    const allLevels = this.levels();
    const levelNum = this.currentLevelNumber();
    return allLevels.find(l => l.levelNumber === levelNum) || null;
  });

  constructor(
    private http: HttpClient,
    private storageService: StorageService
  ) {
    this.http.get<Level[]>('assets/levels.json').subscribe(data => {
      this.levels.set(data);

      // On charge la liste des niveaux terminés depuis la sauvegarde
      const savedCompleted = this.storageService.getData(this.COMPLETED_LEVELS_KEY);
      if (Array.isArray(savedCompleted)) {
        this.completedLevels.set(savedCompleted);
      }

      // On définit le niveau de départ comme le premier niveau non terminé
      this.setInitialLevel();
    });
  }

  // Marquer un niveau comme terminé
  public markLevelAsComplete(levelNumber: number): void {
    // On met à jour le signal en ajoutant le nouveau niveau (s'il n'y est pas déjà)
    this.completedLevels.update(completed => {
      const levelSet = new Set(completed);
      levelSet.add(levelNumber);
      return [...levelSet];
    });

    // On sauvegarde la nouvelle liste
    this.storageService.saveData(this.COMPLETED_LEVELS_KEY, this.completedLevels());
  }

  // Déterminer le niveau de départ
  private setInitialLevel(): void {
    const completed = this.completedLevels();
    let highestConsecutive = 0;
    for (let i = 1; i <= this.levels().length; i++) {
      if (completed.includes(i)) {
        highestConsecutive = i;
      } else {
        break; // On a trouvé le premier niveau non terminé
      }
    }
    this.currentLevelNumber.set(highestConsecutive + 1);
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
}
