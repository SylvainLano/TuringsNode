import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AchievementService } from '../core/services/achievement';
import { TranslationService } from '../core/services/translation';
import { TranslatePipe } from '../shared/pipes/translate-pipe';

@Component({
  selector: 'app-achievements',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslatePipe],
  templateUrl: './achievements.html',
  styleUrls: ['./achievements.scss']
})
export class AchievementsComponent {
  // La liste de tous les succès possibles. Pour l'instant, ce sont nos 9 "golden".
  public allAchievementsIds = [
    'golden_1', 'golden_2', 'golden_3',
    'golden_4', 'golden_5', 'golden_6',
    'golden_7', 'golden_8', 'golden_9'
  ];

  // On expose le Set des succès déverrouillés depuis le service
  public unlockedAchievements;

  constructor(
    private achievementService: AchievementService,
    public translationService: TranslationService
  ) {
    this.unlockedAchievements = this.achievementService.unlockedAchievements;
  }
}
