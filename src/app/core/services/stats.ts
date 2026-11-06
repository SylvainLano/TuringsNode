import { Injectable, signal } from '@angular/core';
import { StorageService } from './storage';
import { AchievementService } from './achievement';
import { BUTTON_NAMES, Level, World, hasPlatinumWorld, isAllChocolate, isAllPlatinum } from '../engine';

// Ce que la machine retient du joueur, en plus des médailles et des succès
export interface PlayerStats {
  melts: number; // Médailles fondues pour payer une aide, depuis le début (même celles regagnées depuis)
  clicks: number;
  undos: number;
  restarts: number; // Niveaux recommencés en pleine partie
  notices: string[]; // Moitiés de notice déjà obtenues, au moins une fois : « Plus:green », « Plus:action »…
}

export type NoticePart = 'green' | 'action';
// Une supplication dévoile d'abord quand le bouton est vert, puis ce qu'il fait au score
export const NOTICE_PARTS: NoticePart[] = ['green', 'action'];

const EMPTY_STATS: PlayerStats = { melts: 0, clicks: 0, undos: 0, restarts: 0, notices: [] };

@Injectable({
  providedIn: 'root'
})
export class StatsService {
  public readonly stats = signal<PlayerStats>(EMPTY_STATS);
  private readonly STATS_KEY = 'turings_node_stats';
  private readonly CLICKS_FOR_TENDINITIS = 5000;
  private readonly UNDOS_FOR_REWIND = 100;
  private readonly MELTS_FOR_CHOCOLATIER = 10;
  // « Sans fausse note » : un monde entier en platine, mais pas l'un des tout petits premiers
  private readonly PLATINUM_WORLD_FROM = 4;

  constructor(
    private storageService: StorageService,
    private achievementService: AchievementService
  ) {
    const saved = this.storageService.getData(this.STATS_KEY);
    if (saved && typeof saved === 'object') {
      this.stats.set({ ...EMPTY_STATS, ...saved });
    }
  }

  public addClick(): void {
    this.update(stats => ({ ...stats, clicks: stats.clicks + 1 }));
    if (this.stats().clicks >= this.CLICKS_FOR_TENDINITIS) this.achievementService.unlock('habit_clicks');
  }

  public addUndo(): void {
    this.update(stats => ({ ...stats, undos: stats.undos + 1 }));
    if (this.stats().undos >= this.UNDOS_FOR_REWIND) this.achievementService.unlock('habit_undo');
  }

  public addRestart(): void {
    this.update(stats => ({ ...stats, restarts: stats.restarts + 1 }));
  }

  /**
   * Une aide vient d'être payée (la médaille fondue est déjà en chocolat dans les résultats) : une moitié de
   * notice de plus est retenue, et les succès de la honte suivent.
   */
  public payForNotice(notice: string, results: Record<number, string>): void {
    this.update(stats => ({
      ...stats,
      melts: stats.melts + 1,
      notices: stats.notices.includes(notice) ? stats.notices : [...stats.notices, notice]
    }));
    const { melts, notices } = this.stats();
    this.achievementService.unlock('shame_first');
    if (melts >= this.MELTS_FOR_CHOCOLATIER) this.achievementService.unlock('shame_ten');
    if (notices.length >= BUTTON_NAMES.length * NOTICE_PARTS.length) this.achievementService.unlock('shame_all');
    if (isAllChocolate(results)) this.achievementService.unlock('shame_wonka');
  }

  /**
   * Les succès de platine. Vérifiés après chaque niveau, et à l'ouverture du dossier pour les joueurs qui les avaient déjà mérités.
   */
  public checkMedalAchievements(levels: Level[], worlds: World[], results: Record<number, string>): void {
    if (hasPlatinumWorld(worlds, results, this.PLATINUM_WORLD_FROM)) this.achievementService.unlock('feat_world');
    if (isAllPlatinum(levels, results)) this.achievementService.unlock('feat_campaign');
  }

  public reset(): void {
    this.stats.set(EMPTY_STATS);
    this.storageService.removeData(this.STATS_KEY);
  }

  private update(change: (stats: PlayerStats) => PlayerStats): void {
    this.stats.update(change);
    this.storageService.saveData(this.STATS_KEY, this.stats());
  }
}
