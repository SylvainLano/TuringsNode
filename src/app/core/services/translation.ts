import { Injectable, signal, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { APP_BASE_HREF } from '@angular/common';
import { StorageService } from './storage';

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private translations = signal<any>({});
  public readonly isLoaded = signal(false);
  public readonly SUPPORTED_LANGS = ['fr', 'en'];
  public readonly currentLang = signal('en'); // Langue par défaut
  private readonly LANG_KEY = 'turings_node_language';

  constructor(
    private http: HttpClient,
    private storageService: StorageService,
    @Inject(APP_BASE_HREF) private baseHref: string
  ) {
    // La langue choisie dans les réglages l'emporte sur celle du navigateur
    const savedLang = this.storageService.getData(this.LANG_KEY);
    const browserLang = navigator.language.split('-')[0];
    const lang = [savedLang, browserLang].find(l => this.SUPPORTED_LANGS.includes(l));
    if (lang) {
      this.currentLang.set(lang);
    }

    this.loadTranslations();
  }

  /**
   * Change la langue du jeu et retient ce choix pour les prochaines visites.
   */
  public setLanguage(lang: string): void {
    if (!this.SUPPORTED_LANGS.includes(lang) || lang === this.currentLang()) return;

    this.storageService.saveData(this.LANG_KEY, lang);
    this.currentLang.set(lang);
    this.loadTranslations();
  }

  private loadTranslations(): void {
    // 3. Construire le chemin complet et sûr
    const lang = this.currentLang();
    const path = `${this.baseHref}assets/i18n/${lang}.json`;

    this.http.get(path).subscribe({
      next: data => {
        this.translations.set(data);
        this.isLoaded.set(true);
        document.documentElement.lang = lang;
      },
      error: () => {
        // Si le fichier de langue n'existe pas, on charge le français par défaut
        if (lang !== 'fr') {
          this.currentLang.set('fr');
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
