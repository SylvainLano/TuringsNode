import fr from '../../../assets/i18n/fr.json';
import en from '../../../assets/i18n/en.json';
import { BUTTON_NAMES } from '../engine';

// Toutes les clés d'un fichier de traduction, à plat : « beg.notices.Plus.green »…
function keysOf(value: unknown, prefix = ''): string[] {
  if (value === null || typeof value !== 'object') return [prefix];
  return Object.entries(value).flatMap(([key, child]) => keysOf(child, prefix ? `${prefix}.${key}` : key));
}

describe('Translation files', () => {
  it('have exactly the same keys in French and in English', () => {
    expect(keysOf(en).sort()).toEqual(keysOf(fr).sort());
  });

  it('have both halves of the notice of every button, and as many remarks and shame jabs as the game draws from', () => {
    for (const lang of [fr, en]) {
      expect(Object.keys(lang.beg.notices).sort()).toEqual([...BUTTON_NAMES].sort());
      expect(lang.beg.remarks.length).toBe(8);
      expect(lang.beg.shameJabs.length).toBe(8);
    }
  });

  it('put a non-breaking space before the double punctuation in French', () => {
    const texts = keysOf(fr).map(key => key.split('.').reduce((node: any, part) => node[part], fr)).filter(text => typeof text === 'string');
    const badSpacing = texts.filter(text => / [:;?!»]/.test(text));
    expect(badSpacing).toEqual([]);
  });
});
