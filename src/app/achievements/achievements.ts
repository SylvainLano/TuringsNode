import { Component, ChangeDetectionStrategy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BUTTON_NAMES } from '../core/engine';
import { AchievementService } from '../core/services/achievement';
import { TranslationService } from '../core/services/translation';
import { TranslatePipe } from '../shared/pipes/translate-pipe';

@Component({
  selector: 'app-achievements',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslatePipe],
  templateUrl: './achievements.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./achievements.scss']
})
export class AchievementsComponent {
  // Les 9 constantes en or, puis un bouton légendaire par type
  private readonly BASE_ACHIEVEMENTS_IDS = [
    'golden_1', 'golden_2', 'golden_3',
    'golden_4', 'golden_5', 'golden_6',
    'golden_7', 'golden_8', 'golden_9',
    ...BUTTON_NAMES.map(name => `legendary_${name}`)
  ];

  // On expose le Set des succès déverrouillés depuis le service
  public unlockedAchievements;

  // Les succès de fin de monde et de niveau secret n'apparaissent qu'une fois gagnés : la liste ne trahit rien
  public readonly allAchievementsIds = computed(() => [
    ...this.BASE_ACHIEVEMENTS_IDS,
    ...[...this.unlockedAchievements()].filter(id => id.startsWith('world_')).sort(),
    ...[...this.unlockedAchievements()].filter(id => id.startsWith('secret_')).sort()
  ]);

  public achievementIcon(achievementId: string): string {
    if (achievementId.startsWith('legendary_')) return '🌈';
    if (achievementId.startsWith('world_')) return '🔑';
    if (achievementId.startsWith('secret_')) return '❓';
    return '🏆';
  }

  constructor(
    private achievementService: AchievementService,
    public translationService: TranslationService
  ) {
    this.unlockedAchievements = this.achievementService.unlockedAchievements;
  }
}
