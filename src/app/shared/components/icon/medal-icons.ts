// L'icône de chaque résultat d'un niveau (src/assets/icons), teintée par la classe tint-<résultat> (styles.scss) :
// le diamant pour le platine, la même médaille en or, argent ou bronze, la tablette pour le chocolat, la coche pour
// un niveau terminé sans médaille
export const MEDAL_ICON_NAMES: Record<string, string> = {
  Platine: 'diamond',
  Or: 'medal',
  Argent: 'medal',
  Bronze: 'medal',
  Chocolat: 'chocolate',
  Terminé: 'check'
};
