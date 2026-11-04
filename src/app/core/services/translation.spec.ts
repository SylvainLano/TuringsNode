import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { APP_BASE_HREF } from '@angular/common';

import { TranslationService } from './translation';

const LANG_KEY = 'turings_node_language';

const setup = () => {
  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(withXhr()),
      provideHttpClientTesting(),
      { provide: APP_BASE_HREF, useValue: '/' }
    ]
  });
  return { service: TestBed.inject(TranslationService), http: TestBed.inject(HttpTestingController) };
};

describe('TranslationService', () => {
  let service: TranslationService;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.removeItem(LANG_KEY);
    ({ service, http } = setup());
    http.expectOne(req => req.url.startsWith('/assets/i18n/')).flush({ menu: { greeting: 'Hello {name}' } });
  });

  afterEach(() => localStorage.removeItem(LANG_KEY));

  it('translates nested keys and replaces parameters', () => {
    expect(service.isLoaded()).toBe(true);
    expect(service.translate('menu.greeting', { name: 'Ada' })).toBe('Hello Ada');
  });

  it('returns the key when no translation exists', () => {
    expect(service.translate('menu.unknown')).toBe('menu.unknown');
  });

  it('switches language, loads its file and remembers the choice', () => {
    const otherLang = service.currentLang() === 'fr' ? 'en' : 'fr';

    service.setLanguage(otherLang);
    http.expectOne(`/assets/i18n/${otherLang}.json`).flush({ menu: { greeting: 'Bonjour {name}' } });

    expect(service.currentLang()).toBe(otherLang);
    expect(service.translate('menu.greeting', { name: 'Ada' })).toBe('Bonjour Ada');
    expect(JSON.parse(localStorage.getItem(LANG_KEY)!)).toBe(otherLang);
  });

  it('ignores unsupported languages', () => {
    const lang = service.currentLang();
    service.setLanguage('de');
    http.expectNone(req => req.url.startsWith('/assets/i18n/'));
    expect(service.currentLang()).toBe(lang);
  });
});

describe('TranslationService with a saved language', () => {
  afterEach(() => localStorage.removeItem(LANG_KEY));

  it('prefers the saved language over the browser language', () => {
    localStorage.setItem(LANG_KEY, JSON.stringify('fr'));
    const { service, http } = setup();
    http.expectOne('/assets/i18n/fr.json').flush({});
    expect(service.currentLang()).toBe('fr');
  });
});
