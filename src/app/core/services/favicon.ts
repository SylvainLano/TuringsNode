import { DOCUMENT, Injectable, inject } from '@angular/core';
import { digitFont, drawDigitIcon } from './favicon-icon';

@Injectable({
  providedIn: 'root'
})
export class FaviconService {
  private readonly document = inject(DOCUMENT);

  /**
   * Remplace le favicon par un chiffre tiré au hasard (le 3 des fichiers statiques reste le repli).
   */
  public async showRandomDigit(): Promise<void> {
    const fonts = this.document.fonts;
    const link = this.document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    const ctx = fonts && link ? this.document.createElement('canvas').getContext('2d') : null;
    if (!ctx || !link) return;

    const digit = Math.floor(Math.random() * 10);
    try {
      // La police Rubik est chargée par les styles globaux : on attend qu'elle soit prête
      await fonts.load(digitFont(64), String(digit));
    } catch {
      // Police indisponible : le chiffre est dessiné avec la police de repli
    }

    const size = 64;
    ctx.canvas.width = ctx.canvas.height = size;
    drawDigitIcon(ctx, digit, size);
    link.removeAttribute('sizes');
    link.type = 'image/png';
    link.href = ctx.canvas.toDataURL('image/png');
  }
}
