import { Component, ChangeDetectionStrategy, computed, effect, signal, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BUTTON_NAMES, countPalmares } from '../core/engine';
import { AchievementService } from '../core/services/achievement';
import { LevelService } from '../core/services/level';
import { StatsService } from '../core/services/stats';
import { TranslationService } from '../core/services/translation';
import { TranslatePipe } from '../shared/pipes/translate-pipe';

// Une famille de succès : son icône, ses succès, et son total (aucun pour les mondes et les secrets, qui ne se trahissent pas)
interface AchievementSection {
  key: string;
  icon: string;
  ids: string[];
  unlocked: number;
  total: number | null;
}

// Ce que l'encart affiche : le succès débloqué ou la médaille sous la souris (ou touché, sur téléphone)
interface DossierDetail {
  key: string;
  icon: string;
  title: string; // Clés de traduction
  description: string;
}

// Le dossier que la machine tient sur le joueur : le palmarès, puis les succès famille par famille,
// et à droite un encart avec le retour au menu et la description de ce que le joueur pointe
@Component({
  selector: 'app-achievements',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslatePipe],
  templateUrl: './achievements.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./achievements.scss', './achievements-dossier.scss', './achievements-aside.scss']
})
export class AchievementsComponent {
  private readonly SECTIONS: { key: string; icon: string; ids: string[] }[] = [
    { key: 'golden', icon: '🏆', ids: Array.from({ length: 9 }, (_, i) => `golden_${i + 1}`) },
    { key: 'legendary', icon: '🌈', ids: BUTTON_NAMES.map(name => `legendary_${name}`) },
    { key: 'feat', icon: '🎯', ids: ['feat_first_try', 'feat_world', 'feat_campaign'] },
    { key: 'habit', icon: '👁️', ids: ['habit_restart', 'habit_undo', 'habit_clicks', 'habit_idle', 'habit_night', 'habit_burnt'] },
    { key: 'shame', icon: '🍫', ids: ['shame_first', 'shame_ten', 'shame_all', 'shame_wonka'] }
  ];
  // Familles qui n'apparaissent qu'une fois l'un de leurs succès gagné, sans total : la liste ne trahit rien
  private readonly HIDDEN_SECTIONS = [
    { key: 'world', icon: '🔑' },
    { key: 'secret', icon: '❓' }
  ];
  private readonly MEDAL_ICONS: Record<string, string> = { Platine: '💎', Or: '🥇', Argent: '🥈', Bronze: '🥉', Chocolat: '🍫' };

  public readonly unlockedAchievements;

  public readonly sections = computed<AchievementSection[]>(() => {
    const unlocked = this.unlockedAchievements();
    const known = this.SECTIONS.map(section => ({
      ...section,
      unlocked: section.ids.filter(id => unlocked.has(id)).length,
      total: section.ids.length
    }));
    const hidden = this.HIDDEN_SECTIONS
      .map(section => {
        const ids = [...unlocked].filter(id => id.startsWith(`${section.key}_`)).sort();
        return { ...section, ids, unlocked: ids.length, total: null };
      })
      .filter(section => section.ids.length > 0);
    return [...known, ...hidden];
  });

  // Le palmarès : les médailles de tous les niveaux, chocolat compris, puis le nombre de succès
  public readonly palmares = computed(() => {
    const palmares = countPalmares(this.levelService.bestMedals());
    const medals = Object.entries(this.MEDAL_ICONS).map(([name, icon]) => ({
      key: name, icon, count: palmares[name as keyof typeof palmares],
      title: `medals.${name}`, description: `achievements.palmares.${name}`
    }));
    return [...medals, {
      key: 'count', icon: '🏆', count: this.unlockedAchievements().size,
      title: 'achievements.count', description: 'achievements.palmares.count'
    }];
  });

  // Ce que l'encart décrit ; rien tant que le joueur n'a rien pointé
  public readonly detail = signal<DossierDetail | null>(null);

  constructor(
    private achievementService: AchievementService,
    private levelService: LevelService,
    private statsService: StatsService,
    public translationService: TranslationService
  ) {
    this.unlockedAchievements = this.achievementService.unlockedAchievements;

    // Succès de médailles déjà mérités avant qu'ils n'existent : accordés à l'ouverture du dossier
    effect(() => {
      const levels = this.levelService.levels();
      const results = this.levelService.bestMedals();
      if (levels.length === 0) return;
      untracked(() => this.statsService.checkMedalAchievements(levels, this.levelService.worlds(), results));
    });
  }

  public showAchievement(achievementId: string, icon: string): void {
    this.detail.set({
      key: achievementId, icon,
      title: `achievements.${achievementId}.title`, description: `achievements.${achievementId}.description`
    });
  }

  public showMedal(medal: DossierDetail): void {
    this.detail.set({ key: medal.key, icon: medal.icon, title: medal.title, description: medal.description });
  }
}
