import { Injectable, signal } from '@angular/core';
import { StorageService } from './storage';
import { NotificationService } from './notification';
import { TranslationService } from './translation';

@Injectable({
  providedIn: 'root'
})
export class AchievementService {
  // Un signal qui contient un Set des IDs des succès déverrouillés.
  // Un Set est parfait ici car il gère automatiquement les doublons.
  public readonly unlockedAchievements = signal<Set<string>>(new Set());

  constructor(
    private storageService: StorageService,
    private notificationService: NotificationService,
    private translationService: TranslationService
  ) {
    // Au démarrage, on charge les succès depuis le localStorage.
    const savedAchievements = this.storageService.getData('turings_node_achievements');
    if (Array.isArray(savedAchievements)) {
      this.unlockedAchievements.set(new Set(savedAchievements));
    }
  }

  /**
   * Tente de déverrouiller un succès.
   * Si le succès est nouveau, il l'ajoute, le sauvegarde et affiche une notification.
   * @param achievementId L'identifiant du succès (ex: 'golden_1' pour le nombre d'or).
   */
  public unlock(achievementId: string): void {
    const achievements = this.unlockedAchievements();

    // Si le succès est déjà dans le Set, on ne fait rien.
    if (achievements.has(achievementId)) {
      return;
    }

    // --- C'est un nouveau succès ! ---

    // 1. On l'ajoute au Set.
    achievements.add(achievementId);
    this.unlockedAchievements.set(new Set(achievements)); // On met à jour le signal

    // 2. On sauvegarde la nouvelle liste.
    this.storageService.saveAchievements(achievements);

    // 3. On affiche la notification.
    // On suppose que la clé de traduction est "achievement_unlock_" + l'ID du succès.
    const message = this.translationService.translate(`achievements.${achievementId}`);
    this.notificationService.show(message);
  }
}
