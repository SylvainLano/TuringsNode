import {
  digitalRoot,
  factorial,
  hasConsecutiveAscendingDigits,
  hasDistinctDigits,
  hasFibonacciBetween,
  hasSquareFactor,
  isFactorial,
  isFibonacci,
  isNarcissistic,
  isNearPerfectSquare,
  isPalindrome,
  isPerfectPower,
  isPowerOfTwo,
  isPrime,
  nextFibonacci,
  nextPrime,
  nthFibonacci,
  reverseDigits
} from './math';

// Les boutons simples des premiers mondes, puis les boutons de la campagne d'origine
export const BUTTON_NAMES = [
  'Plus', 'Minus', 'Double', 'Half', 'Mirror',
  'Primer', 'Split', 'Boost', 'Digit', 'Reduce', 'Align', 'Fiber', 'Factor', 'Cipher'
] as const;
export type ButtonName = typeof BUTTON_NAMES[number];

export const MIN_BUTTON_VALUE = 1;
export const MAX_BUTTON_VALUE = 9;

interface ButtonRule {
  // Nouveau score après un clic, avant application des bornes du niveau
  action: (score: number, value: number) => number;
  // Condition pour que le bouton passe au vert
  condition: (score: number, value: number) => boolean;
  // Condition rare, dans le thème du bouton : le bouton devient légendaire (et compte aussi comme vert)
  legendary: (score: number, value: number) => boolean;
}

const BUTTON_RULES: Record<ButtonName, ButtonRule> = {
  // --- Boutons simples : une action évidente d'après le nom, une condition facile à deviner ---
  Plus: {
    action: (score, value) => score + value,
    condition: score => score % 2 === 0,
    // Une puissance de 10, à partir de 100
    legendary: score => score >= 100 && /^10+$/.test(String(score))
  },
  Minus: {
    action: (score, value) => score - value,
    condition: (score, value) => score % 10 === value,
    // Uniquement le chiffre de la valeur, sur au moins 3 chiffres (777 pour Minus 7)
    legendary: (score, value) => new RegExp(`^${value}{3,}$`).test(String(score))
  },
  Double: {
    action: score => score * 2,
    condition: (score, value) => String(score).startsWith(String(value)),
    // La valeur suivie de zéros, sur au moins 3 chiffres (500 pour Double 5)
    legendary: (score, value) => new RegExp(`^${value}0{2,}$`).test(String(score))
  },
  Half: {
    action: score => Math.ceil(score / 2),
    condition: score => score % 10 === 0,
    // Un multiple de 1000
    legendary: score => score > 0 && score % 1000 === 0
  },
  Mirror: {
    // Chiffres dans l'ordre inverse ; un zéro qui se retrouve en tête disparaît
    action: score => reverseDigits(score),
    condition: score => score > reverseDigits(score),
    // Un multiple de son miroir sans être un palindrome (8712 = 4 × 2178) ; un zéro final ne compte pas
    legendary: score => score % 10 !== 0 && !isPalindrome(score) && score % reverseDigits(score) === 0
  },

  // --- Boutons de la campagne d'origine ---
  Primer: {
    action: score => nextPrime(score),
    condition: (score, value) => {
      for (let i = score - value; i <= score + value; i++) {
        if (isPrime(i)) return true;
      }
      return false;
    },
    // Nombres premiers jumeaux (le score et le score + 2), à partir de 4 chiffres
    legendary: score => score >= 1000 && isPrime(score) && isPrime(score + 2)
  },
  Split: {
    // On arrondit au supérieur pour ne pas avoir de nombres à virgule
    action: (score, value) => Math.ceil(score / value),
    condition: (score, value) => score % value === 0,
    // Multiple de 2520 : divisible par tous les chiffres de 1 à 9
    legendary: score => score > 0 && score % 2520 === 0
  },
  Boost: {
    action: (score, value) => score + value,
    condition: (score, value) => isNearPerfectSquare(score, value),
    // À la fois un carré et un cube : une puissance sixième (64, 729, 4096...)
    legendary: score => score >= 64 && isPerfectPower(score, 6)
  },
  Digit: {
    action: (score, value) => score * value,
    condition: (score, value) => digitalRoot(score) === value,
    // Nombre narcissique d'au moins 3 chiffres (153 = 1³ + 5³ + 3³)
    legendary: score => score >= 100 && isNarcissistic(score)
  },
  Reduce: {
    action: (score, value) => Math.ceil(score / (value * value)),
    condition: score => hasSquareFactor(score),
    // Puissance de 2, à partir de 1024
    legendary: score => score >= 1024 && isPowerOfTwo(score)
  },
  Align: {
    // Saute au multiple de `value` strictement supérieur
    action: (score, value) => score + (value - (score % value)),
    condition: score => isPalindrome(score),
    // Palindrome qui a autant de chiffres que la valeur du bouton
    legendary: (score, value) => isPalindrome(score) && String(score).length === value
  },
  Fiber: {
    action: score => nextFibonacci(score),
    condition: (score, value) => {
      if (score < 0) return false;
      const range = nthFibonacci(value);
      return hasFibonacciBetween(score - range, score + range);
    },
    // Nombre de Fibonacci premier, à partir de 13 (13, 89, 233, 1597...)
    legendary: score => score >= 13 && isFibonacci(score) && isPrime(score)
  },
  Factor: {
    action: (score, value) => score + factorial(value),
    condition: (score, value) => {
      if (score <= 0) return false;
      const fact = factorial(value);
      // Une factorielle de 0 ou 1 rendrait la condition triviale
      return fact > 1 && score % fact === 0;
    },
    // Exactement une factorielle, à partir de 4! = 24
    legendary: score => score >= 24 && isFactorial(score)
  },
  Cipher: {
    // Chaque chiffre est décalé de `value` (modulo 10) ; un zéro en tête disparaît
    action: (score, value) => Number(
      String(score)
        .split('')
        .map(digit => (Number(digit) + value) % 10)
        .join('')
    ),
    condition: score => hasDistinctDigits(score),
    // Au moins 4 chiffres, qui se suivent tous dans l'ordre croissant (1234, 45678...)
    legendary: score => String(score).length >= 4 && hasConsecutiveAscendingDigits(score)
  }
};

export function applyButtonAction(name: ButtonName, score: number, value: number): number {
  return BUTTON_RULES[name].action(score, value);
}

/** Vert si la condition du bouton est remplie, ou si le bouton est légendaire */
export function isButtonConditionMet(name: ButtonName, score: number, value: number): boolean {
  const rule = BUTTON_RULES[name];
  return rule.condition(score, value) || rule.legendary(score, value);
}

export function isButtonLegendary(name: ButtonName, score: number, value: number): boolean {
  return BUTTON_RULES[name].legendary(score, value);
}

/** Valeur d'un bouton après un clic (de 1 à 9, puis retour à 1) */
export function nextButtonValue(value: number): number {
  return (value % MAX_BUTTON_VALUE) + 1;
}

// Constantes célèbres associées à chaque valeur de bouton.
// On les stocke sous forme de chaînes de caractères pour éviter les limites de précision.
export const FAMOUS_NUMBERS: Record<number, string> = {
  1: '16180339887', // Nombre d'or (Phi)
  2: '27182818284', // Nombre d'Euler (e)
  3: '31415926535', // Pi (π)
  4: '4815162342',  // Série de nombres dans Lost
  5: '5670374419',  // Constante de Stefan-Boltzmann
  6: '662607015',   // Constante de Planck
  7: '76009024595', // ln(2000)
  8: '88541878128', // Permitivité du vide
  9: '299792458'    // Vitesse de la lumière
};

export const MIN_GOLDEN_SCORE_LENGTH = 4;

/** Vrai si le score (d'au moins 4 chiffres) est le début de la constante associée à la valeur du bouton */
export function isGoldenScore(score: number, value: number): boolean {
  const famousNumber = FAMOUS_NUMBERS[value];
  const scoreStr = String(score);
  return !!famousNumber && scoreStr.length >= MIN_GOLDEN_SCORE_LENGTH && famousNumber.startsWith(scoreStr);
}
