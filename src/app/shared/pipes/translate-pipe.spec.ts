import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { APP_BASE_HREF } from '@angular/common';

import { TranslatePipe } from './translate-pipe';
import { TranslationService } from '../../core/services/translation';

describe('TranslatePipe', () => {
  it('returns the key while translations are not loaded', () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: APP_BASE_HREF, useValue: '/' }
      ]
    });
    const pipe = new TranslatePipe(TestBed.inject(TranslationService));
    expect(pipe.transform('menu.title')).toBe('menu.title');
  });
});
