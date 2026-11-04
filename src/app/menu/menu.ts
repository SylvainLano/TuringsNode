import { Component, OnInit, computed, ChangeDetectionStrategy } from '@angular/core';

import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../shared/pipes/translate-pipe';
import { LevelService } from '../core/services/level';
import { TranslationService } from '../core/services/translation';
import { BackgroundService } from '../core/services/background';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [
    RouterLink,
    TranslatePipe
],
  templateUrl: './menu.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './menu.scss'
})
export class MenuComponent implements OnInit {

  public isTranslationsLoaded;
  public hasSaveData = computed(() => {
    const medals = this.levelService.bestMedals();
    // La condition est vraie si l'objet des médailles n'est pas vide.
    return Object.keys(medals).length > 0;
  });


  constructor(
    private backgroundService: BackgroundService,
    private translationService: TranslationService,
    private levelService: LevelService
  ) {
    this.isTranslationsLoaded = this.translationService.isLoaded;
  }

  ngOnInit(): void {
    const defaultTheme = this.backgroundService.getDefaultThemeName();
    this.backgroundService.changeBackground(defaultTheme);
  }
}
