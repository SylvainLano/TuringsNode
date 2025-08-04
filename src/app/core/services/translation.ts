import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private translations = signal<any>({});

  constructor(private http: HttpClient) {
    // Pour l'instant, on charge le français par défaut.
    // Plus tard, on pourrait détecter la langue du navigateur.
    this.loadTranslations('en');
  }

  private loadTranslations(lang: string): void {
    this.http.get(`/assets/i18n/${lang}.json`).subscribe(data => {
      this.translations.set(data);
    });
  }

  /**
   * Récupère une chaîne de caractères traduite.
   * @param key La clé de la chaîne (ex: 'discovery_notification').
   * @param params Un objet pour remplacer les variables (ex: { name: 'Primer' }).
   */
  public translate(key: string, params: Record<string, string> = {}): string {
    const translations = this.translations();
    let translation = this.getNestedValue(translations, key);

    if (!translation) {
      return key; // Retourne la clé si la traduction n'est pas trouvée
    }

    // Remplace les variables comme {name}
    for (const param in params) {
      translation = translation.replace(`{${param}}`, params[param]);
    }
    return translation;
  }

  // Petite fonction utilitaire pour naviguer dans l'objet JSON (ex: 'constant_names.Primer')
  private getNestedValue(obj: any, key: string): string {
    return key.split('.').reduce((o, i) => (o ? o[i] : undefined), obj);
  }
}
