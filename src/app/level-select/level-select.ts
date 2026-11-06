import { Component, OnInit, ChangeDetectionStrategy, computed, signal } from '@angular/core';

import { Router, RouterLink } from '@angular/router';
import { LevelService } from '../core/services/level';
import { BackgroundService } from '../core/services/background';
import { TranslatePipe } from '../shared/pipes/translate-pipe';
import { IconComponent } from '../shared/components/icon/icon';
import { MEDAL_ICON_NAMES } from '../shared/components/icon/medal-icons';
import { AchievementService } from '../core/services/achievement';
import { Level, World, isWorldComplete, secretAchievementId } from '../core/engine';

@Component({
  selector: 'app-level-select',
  standalone: true,
  imports: [RouterLink, TranslatePipe, IconComponent],
  templateUrl: './level-select.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./level-select.scss', './world-pager.scss', './secret-slot.scss']
})
export class LevelSelectComponent implements OnInit {
  public introducedButtons;
  public bestMedals;
  public visibleWorlds;

  // Un monde à la fois : celui du niveau en cours au départ, puis celui choisi avec les flèches
  private readonly chosenWorld = signal<number | null>(null);
  public readonly shownWorld = computed(() => {
    const worlds = this.visibleWorlds();
    const wanted = this.chosenWorld()
      ?? worlds.find(world => world.levels.some(level => level.levelNumber === this.levelService.currentLevelNumber()))?.number;
    return worlds.find(world => world.number === wanted) ?? worlds[worlds.length - 1];
  });

  // Niveaux secrets du monde affiché : leurs tuiles « ? » apparaissent une fois le monde terminé,
  // ou chacune dès que son score secret est trouvé
  public readonly secretLevels = computed(() => {
    const world = this.shownWorld();
    return world ? this.visibleSecretsOf(world) : [];
  });

  // Des tuiles secrètes dans au moins un monde : le panneau s'élargit pour leur faire de la place,
  // et garde cette largeur d'un monde à l'autre
  public readonly hasSecrets = computed(() => this.visibleWorlds().some(world => this.visibleSecretsOf(world).length > 0));


  constructor(
    private levelService: LevelService,
    private backgroundService: BackgroundService,
    private achievementService: AchievementService,
    private router: Router
  ) {
    this.introducedButtons = this.levelService.introducedButtons;
    this.bestMedals = this.levelService.bestMedals;
    this.visibleWorlds = this.levelService.visibleWorlds;
  }

  ngOnInit(): void {
    // On quitte le fond de victoire si on arrive depuis la fin d'un niveau
    this.backgroundService.changeBackground(this.backgroundService.getDefaultThemeName());
  }

  /** Monde visible juste avant (-1) ou juste après (+1) celui affiché, s'il y en a un */
  public neighbourWorld(step: number): World | undefined {
    const worlds = this.visibleWorlds();
    const shown = this.shownWorld();
    return shown ? worlds[worlds.indexOf(shown) + step] : undefined;
  }

  public showWorld(step: number): void {
    const world = this.neighbourWorld(step);
    if (world) this.chosenWorld.set(world.number);
  }

  public completedCount(world: World): number {
    return world.levels.filter(level => !!this.bestMedals()[level.levelNumber]).length;
  }

  // L'icône du meilleur résultat du niveau (teintée par la classe tint-<résultat>), rien s'il n'est pas terminé
  public medalIcon(levelNumber: number): string {
    return MEDAL_ICON_NAMES[this.bestMedals()[levelNumber]] ?? '';
  }

  private visibleSecretsOf(world: World): Level[] {
    const complete = isWorldComplete(world, this.bestMedals());
    return this.levelService.secretLevelsOf(world.number).filter(level => complete || this.isSecretUnlocked(level));
  }

  public isSecretUnlocked(level: Level): boolean {
    return this.achievementService.unlockedAchievements().has(secretAchievementId(level));
  }

  public selectSecretLevel(level: Level): void {
    if (!this.isSecretUnlocked(level)) return;
    this.levelService.currentLevelNumber.set(level.levelNumber);
    this.router.navigate(['/game']);
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
