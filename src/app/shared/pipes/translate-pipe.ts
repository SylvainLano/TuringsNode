import { Pipe, PipeTransform } from '@angular/core';
import { TranslationService } from '../../core/services/translation';

@Pipe({
  name: 'translate',
  standalone: true,
  // Non pur : le texte doit suivre un changement de langue même si la clé ne change pas
  pure: false
})
export class TranslatePipe implements PipeTransform {

  constructor(private translationService: TranslationService) {}

  transform(key: string, params: Record<string, any> = {}): string {
    return this.translationService.translate(key, params);
  }
}
