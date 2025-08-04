import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class StorageService {

  constructor() { }

  /**
   * Sauvegarde une donnée dans le localStorage.
   * @param key La clé sous laquelle enregistrer la donnée (ex: 'unlockedLevels').
   * @param value La donnée à sauvegarder (peut être un objet, un tableau, un nombre...).
   */
  public saveData(key: string, value: any): void {
    try {
      const serializedData = JSON.stringify(value);
      localStorage.setItem(key, serializedData);
    } catch (error) {
      console.error("Erreur lors de la sauvegarde des données dans le localStorage :", error);
    }
  }

  /**
   * Récupère une donnée depuis le localStorage.
   * @param key La clé de la donnée à récupérer.
   * @returns La donnée désérialisée, ou null si la clé n'existe pas.
   */
  public getData(key: string): any {
    try {
      const serializedData = localStorage.getItem(key);
      if (serializedData === null) {
        return null;
      }
      return JSON.parse(serializedData);
    } catch (error) {
      console.error("Erreur lors de la récupération des données :", error);
      return null;
    }
  }


  /**
   * Sauvegarde l'ensemble des succès déverrouillés.
   * @param achievements Un Set ou un Array contenant les noms des succès.
   */
  public saveAchievements(achievements: Set<string> | string[]): void {
    // On convertit le Set en Array pour pouvoir le sauvegarder en JSON.
    const achievementsArray = Array.from(achievements);
    this.saveData('turings_node_achievements', achievementsArray);
  }
}
