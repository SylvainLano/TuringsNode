import { Component, ChangeDetectionStrategy, computed, inject, input } from '@angular/core';
import { APP_BASE_HREF } from '@angular/common';

/**
 * Une icône du jeu (src/assets/icons) : un SVG d'une seule forme, utilisé comme masque et rempli avec la couleur du
 * texte (currentColor). On la teinte donc en CSS, comme du texte : or, argent, bronze, chocolat ou gris verrouillé.
 * Elle mesure 1em de côté et se règle avec font-size.
 */
@Component({
  selector: 'app-icon',
  standalone: true,
  template: '',
  changeDetection: ChangeDetectionStrategy.Eager,
  host: {
    'aria-hidden': 'true',
    '[style.--icon]': 'url()'
  },
  styles: `
    :host {
      display: inline-block;
      width: 1em;
      height: 1em;
      flex: none;
      background-color: currentColor;
      -webkit-mask: var(--icon) center / contain no-repeat;
      mask: var(--icon) center / contain no-repeat;
    }
  `
})
export class IconComponent {
  public readonly name = input.required<string>();
  private readonly baseHref = inject(APP_BASE_HREF);
  public readonly url = computed(() => `url("${this.baseHref}assets/icons/${this.name()}.svg")`);
}
