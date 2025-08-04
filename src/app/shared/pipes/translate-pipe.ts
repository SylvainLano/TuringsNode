import { Pipe, PipeTransform } from '@angular/core';
import { TranslationService } from '../../core/services/translation';

@Pipe({
  name: 'translate',
  standalone: true
})
export class TranslatePipe implements PipeTransform {

  constructor(private translationService: TranslationService) {}

  transform(key: string, params: Record<string, any> = {}): string {
    return this.translationService.translate(key, params);
  }
}
