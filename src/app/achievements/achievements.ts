import { Component, ChangeDetectionStrategy } from '@angular/core';
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
  // La liste de tous les succès possibles : les 9 constantes en or, puis un bouton légendaire par type
  public allAchievementsIds = [
    'golden_1', 'golden_2', 'golden_3',
    'golden_4', 'golden_5', 'golden_6',
    'golden_7', 'golden_8', 'golden_9',
    ...BUTTON_NAMES.map(name => `legendary_${name}`)
  ];

  public achievementIcon(achievementId: string): string {
    return achievementId.startsWith('legendary_') ? '🌈' : '🏆';
  }

  // On expose le Set des succès déverrouillés depuis le service
  public unlockedAchievements;

  constructor(
    private achievementService: AchievementService,
    public translationService: TranslationService
  ) {
    this.unlockedAchievements = this.achievementService.unlockedAchievements;
  }
}
