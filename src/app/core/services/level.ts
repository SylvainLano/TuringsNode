import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

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

  // Ce signal calculé ne change pas, il est parfait
  public readonly currentLevelData = computed(() => {
    const allLevels = this.levels();
    const levelNum = this.currentLevelNumber();
    return allLevels.find(l => l.levelNumber === levelNum) || null;
  });

  constructor(private http: HttpClient) {
    this.http.get<Level[]>('assets/levels.json').subscribe(data => {
      this.levels.set(data);
    });
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
