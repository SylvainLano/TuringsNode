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
  buttons: LevelButtonConfig[];
}

@Injectable({
  providedIn: 'root'
})
export class LevelService {
  public levels = signal<Level[]>([]);
  public currentLevelNumber = signal(1);

  // Un signal calculé qui nous donne directement les données du niveau actuel
  public currentLevelData = computed(() => {
    const allLevels = this.levels();
    const levelNum = this.currentLevelNumber();
    return allLevels.find(l => l.levelNumber === levelNum) || null;
  });

  constructor(private http: HttpClient) {
    this.loadAllLevels();
  }

  private loadAllLevels(): void {
    this.http.get<Level[]>('assets/levels.json').subscribe(data => {
      this.levels.set(data);
    });
  }

  public advanceToNextLevel(): void {
    // On vérifie s'il y a un niveau suivant avant d'incrémenter
    if (this.currentLevelNumber() < this.levels().length) {
      this.currentLevelNumber.update(n => n + 1);
    } else {
      console.log("Dernier niveau terminé !");
    }
  }
}
