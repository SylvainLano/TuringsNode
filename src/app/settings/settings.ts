import { Component, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../shared/pipes/translate-pipe';
import { TranslationService } from '../core/services/translation';
import { LevelService } from '../core/services/level';
import { AchievementService } from '../core/services/achievement';
import { BackgroundService } from '../core/services/background';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [RouterLink, TranslatePipe],
  templateUrl: './settings.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './settings.scss'
})
export class SettingsComponent implements OnInit {
  // Chaque langue est affichée dans sa propre langue, pour être reconnue quelle que soit la langue actuelle
  public readonly LANGUAGES = [
    { code: 'fr', name: 'Français' },
    { code: 'en', name: 'English' }
  ];

  // L'effacement de la progression se fait en deux temps pour éviter les accidents
  public readonly resetState = signal<'idle' | 'confirming' | 'done'>('idle');

  constructor(
    public translationService: TranslationService,
    private levelService: LevelService,
    private achievementService: AchievementService,
    private backgroundService: BackgroundService
  ) {}

  ngOnInit(): void {
    this.backgroundService.changeBackground(this.backgroundService.getDefaultThemeName());
  }

  public selectLanguage(code: string): void {
    this.translationService.setLanguage(code);
  }

  public confirmReset(): void {
    this.levelService.resetProgress();
    this.achievementService.resetAchievements();
    this.resetState.set('done');
  }
}
