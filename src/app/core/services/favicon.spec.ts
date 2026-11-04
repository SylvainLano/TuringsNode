import { TestBed } from '@angular/core/testing';

import { FaviconService } from './favicon';

describe('FaviconService', () => {
  afterEach(() => document.head.querySelector('link[rel="icon"]')?.remove());

  it('keeps the static favicon when the browser cannot draw a new one', async () => {
    const link = document.createElement('link');
    link.rel = 'icon';
    link.href = 'favicon.ico';
    document.head.appendChild(link);

    // L'environnement de test ne sait ni charger de police ni dessiner dans un canvas
    await TestBed.inject(FaviconService).showRandomDigit();

    expect(link.getAttribute('href')).toBe('favicon.ico');
  });
});
