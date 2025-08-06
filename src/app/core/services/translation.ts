import { Injectable, signal, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { APP_BASE_HREF } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private translations = signal<any>({});
  public readonly isLoaded = signal(false);
  private lang = 'en'; // Langue par défaut

  constructor(
    private http: HttpClient,
    @Inject(APP_BASE_HREF) private baseHref: string
  ) {
    // Détecter la langue du navigateur
    const browserLang = navigator.language.split('-')[0];
    if (browserLang === 'en') {
        this.lang = 'en';
    }

    this.loadTranslations();
  }

  private loadTranslations(): void {
    // 3. Construire le chemin complet et sûr
    const path = `${this.baseHref}assets/i18n/${this.lang}.json`;

    this.http.get(path).subscribe({
      next: data => {
        this.translations.set(data);
        this.isLoaded.set(true);
      },
      error: () => {
        // Si le fichier de langue n'existe pas, on charge le français par défaut
        if (this.lang !== 'fr') {
          this.lang = 'fr';
          this.loadTranslations();
        }
      }
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
