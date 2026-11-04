import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { APP_BASE_HREF } from '@angular/common';

import { TranslationService } from './translation';

describe('TranslationService', () => {
  let service: TranslationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: APP_BASE_HREF, useValue: '/' }
      ]
    });
    service = TestBed.inject(TranslationService);
    TestBed.inject(HttpTestingController)
      .expectOne(req => req.url.startsWith('/assets/i18n/'))
      .flush({ menu: { greeting: 'Hello {name}' } });
  });

  it('translates nested keys and replaces parameters', () => {
    expect(service.isLoaded()).toBeTrue();
    expect(service.translate('menu.greeting', { name: 'Ada' })).toBe('Hello Ada');
  });

  it('returns the key when no translation exists', () => {
    expect(service.translate('menu.unknown')).toBe('menu.unknown');
  });
});
