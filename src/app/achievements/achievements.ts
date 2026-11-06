import { Component, ChangeDetectionStrategy, computed, effect, signal, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BUTTON_NAMES, countPalmares } from '../core/engine';
import { AchievementService } from '../core/services/achievement';
import { LevelService } from '../core/services/level';
import { StatsService } from '../core/services/stats';
import { TranslationService } from '../core/services/translation';
import { TranslatePipe } from '../shared/pipes/translate-pipe';
import { IconComponent } from '../shared/components/icon/icon';

// Une famille de succès : son icône, ses succès, et son total (aucun pour les mondes et les secrets, qui ne se trahissent pas)
interface AchievementSection {
  key: string;
  icon: string;
  ids: string[];
  unlocked: number;
  total: number | null;
}

// Ce que l'encart affiche : le succès débloqué ou la case sous la souris (ou touchée, sur téléphone)
interface DossierDetail {
  key: string;
  icon: string; // Nom d'une icône de src/assets/icons
  tint: string; // Sa couleur : gold, ou celle d'une médaille
  title: string; // Clés de traduction
  description: string;
}

// Le dossier que la machine tient sur le joueur : à gauche le palmarès, les compteurs et l'encart qui décrit ce que
// le joueur pointe ; à droite les succès, famille par famille
@Component({
  selector: 'app-achievements',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslatePipe, IconComponent],
  templateUrl: './achievements.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./achievements.scss', './achievements-dossier.scss', './achievements-aside.scss']
})
export class AchievementsComponent {
  private readonly SECTIONS: { key: string; icon: string; ids: string[] }[] = [
    { key: 'golden', icon: 'golden-spiral', ids: Array.from({ length: 9 }, (_, i) => `golden_${i + 1}`) },
    { key: 'legendary', icon: 'prism', ids: BUTTON_NAMES.map(name => `legendary_${name}`) },
    { key: 'feat', icon: 'target', ids: ['feat_first_try', 'feat_world', 'feat_campaign'] },
    { key: 'habit', icon: 'eye', ids: ['habit_restart', 'habit_undo', 'habit_clicks', 'habit_idle', 'habit_night', 'habit_burnt'] },
    { key: 'shame', icon: 'chocolate', ids: ['shame_first', 'shame_ten', 'shame_all', 'shame_wonka'] }
  ];
  // Familles qui n'apparaissent qu'une fois l'un de leurs succès gagné, sans total : la liste ne trahit rien
  private readonly HIDDEN_SECTIONS = [
    { key: 'world', icon: 'key' },
    { key: 'secret', icon: 'question' }
  ];
  // Chaque succès a sa propre icône, qui fait allusion à son nom sans rien dévoiler de la façon de l'obtenir.
  // Les mondes sont des polygones réguliers à autant de côtés que leur numéro. Un succès absent d'ici (un ajout
  // futur) prend l'icône de sa famille
  private readonly ACHIEVEMENT_ICONS: Record<string, string> = {
    golden_1: 'golden-spiral', golden_2: 'graph', golden_3: 'pi', golden_4: 'door', golden_5: 'thermometer',
    golden_6: 'atom', golden_7: 'slide-rule', golden_8: 'bell-jar', golden_9: 'comet',
    legendary_Plus: 'nested-squares', legendary_Minus: 'vinyl', legendary_Double: 'rings', legendary_Half: 'anchor',
    legendary_Mirror: 'hand-mirror', legendary_Primer: 'twin-columns', legendary_Split: 'crown',
    legendary_Boost: 'cube-in-square', legendary_Digit: 'narcissus', legendary_Reduce: 'switches',
    legendary_Align: 'planets', legendary_Fiber: 'nautilus', legendary_Factor: 'staircase', legendary_Cipher: 'sun',
    feat_first_try: 'target', feat_world: 'laurel', feat_campaign: 'diamond',
    habit_restart: 'restart', habit_undo: 'undo', habit_clicks: 'pointing-hand',
    habit_idle: 'bubble', habit_night: 'moon', habit_burnt: 'match',
    shame_first: 'praying-hands', shame_ten: 'candle', shame_all: 'scroll', shame_wonka: 'chocolate',
    world_1: 'world-1', world_2: 'world-2', world_3: 'world-3', world_4: 'world-4', world_5: 'world-5',
    world_6: 'world-6', world_7: 'world-7',
    secret_murphy: 'black-cat', secret_edison: 'light-bulb', secret_richardson: 'rain-cloud', secret_goodyear: 'tire',
    secret_brahmagupta: 'broken-circle', secret_mersenne: 'envelope', secret_kepler: 'orbit',
    secret_hamilton: 'lunar-lander', secret_collatz: 'hailstones', secret_kaprekar: 'u-turn'
  };
  // Une icône par médaille, teintée de sa couleur (voir les classes tint-* des styles)
  private readonly MEDAL_ICONS: Record<string, string> = { Platine: 'diamond', Or: 'medal', Argent: 'medal', Bronze: 'medal', Chocolat: 'chocolate' };
  // Ce que la machine compte, sous le palmarès : six cases, comme lui
  private readonly COUNTERS = [
    { key: 'clicks', icon: 'pointing-hand' },
    { key: 'undos', icon: 'undo' },
    { key: 'restarts', icon: 'restart' },
    { key: 'levels', icon: 'check' },
    { key: 'melts', icon: 'praying-hands' },
    { key: 'notices', icon: 'scroll' }
  ] as const;

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
      key: name, icon, tint: name, count: palmares[name as keyof typeof palmares],
      title: `medals.${name}`, description: `achievements.palmares.${name}`
    }));
    return [...medals, {
      key: 'count', icon: 'trophy', tint: 'gold', count: this.unlockedAchievements().size,
      title: 'achievements.count', description: 'achievements.palmares.count'
    }];
  });

  // Les compteurs de la machine, écrits avec les séparateurs de milliers de la langue du joueur
  public readonly counters = computed(() => {
    const stats = this.statsService.stats();
    const lang = this.translationService.currentLang();
    const values = {
      clicks: stats.clicks, undos: stats.undos, restarts: stats.restarts, melts: stats.melts,
      levels: Object.keys(this.levelService.bestMedals()).length,
      notices: stats.notices.length
    };
    return this.COUNTERS.map(({ key, icon }) => ({
      key: `stat_${key}`, icon, tint: 'gold', count: values[key].toLocaleString(lang),
      title: `achievements.stats.${key}.title`, description: `achievements.stats.${key}.description`
    }));
  });

  // Les deux blocs de cases de l'encart : le palmarès, puis les compteurs
  public readonly blocks = computed(() => [
    { key: 'palmares', items: this.palmares() },
    { key: 'counters', items: this.counters() }
  ]);

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

  public iconOf(achievementId: string, sectionIcon: string): string {
    return this.ACHIEVEMENT_ICONS[achievementId] ?? sectionIcon;
  }

  public showAchievement(achievementId: string, sectionIcon: string): void {
    this.detail.set({
      key: achievementId, icon: this.iconOf(achievementId, sectionIcon), tint: 'gold',
      title: `achievements.${achievementId}.title`, description: `achievements.${achievementId}.description`
    });
  }

  // Une médaille du palmarès ou un compteur de la machine
  public showDetail(item: DossierDetail): void {
    this.detail.set({ key: item.key, icon: item.icon, tint: item.tint, title: item.title, description: item.description });
  }
}
