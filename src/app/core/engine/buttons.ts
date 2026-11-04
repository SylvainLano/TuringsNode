import {
  digitalRoot,
  factorial,
  hasDistinctDigits,
  hasFibonacciBetween,
  hasSquareFactor,
  isNearPerfectSquare,
  isPalindrome,
  isPrime,
  nextFibonacci,
  nextPrime,
  nthFibonacci
} from './math';

export const BUTTON_NAMES = ['Primer', 'Split', 'Boost', 'Digit', 'Reduce', 'Align', 'Fiber', 'Factor', 'Cipher'] as const;
export type ButtonName = typeof BUTTON_NAMES[number];

export const MIN_BUTTON_VALUE = 1;
export const MAX_BUTTON_VALUE = 9;

interface ButtonRule {
  // Nouveau score après un clic, avant application des bornes du niveau
  action: (score: number, value: number) => number;
  // Condition pour que le bouton passe au vert
  condition: (score: number, value: number) => boolean;
}

const BUTTON_RULES: Record<ButtonName, ButtonRule> = {
  Primer: {
    action: score => nextPrime(score),
    condition: (score, value) => {
      for (let i = score - value; i <= score + value; i++) {
        if (isPrime(i)) return true;
      }
      return false;
    }
  },
  Split: {
    // On arrondit au supérieur pour ne pas avoir de nombres à virgule
    action: (score, value) => Math.ceil(score / value),
    condition: (score, value) => score % value === 0
  },
  Boost: {
    action: (score, value) => score + value,
    condition: (score, value) => isNearPerfectSquare(score, value)
  },
  Digit: {
    action: (score, value) => score * value,
    condition: (score, value) => digitalRoot(score) === value
  },
  Reduce: {
    action: (score, value) => Math.ceil(score / (value * value)),
    condition: score => hasSquareFactor(score)
  },
  Align: {
    // Saute au multiple de `value` strictement supérieur
    action: (score, value) => score + (value - (score % value)),
    condition: score => isPalindrome(score)
  },
  Fiber: {
    action: score => nextFibonacci(score),
    condition: (score, value) => {
      if (score < 0) return false;
      const range = nthFibonacci(value);
      return hasFibonacciBetween(score - range, score + range);
    }
  },
  Factor: {
    action: (score, value) => score + factorial(value),
    condition: (score, value) => {
      if (score <= 0) return false;
      const fact = factorial(value);
      // Une factorielle de 0 ou 1 rendrait la condition triviale
      return fact > 1 && score % fact === 0;
    }
  },
  Cipher: {
    // Chaque chiffre est décalé de `value` (modulo 10) ; un zéro en tête disparaît
    action: (score, value) => Number(
      String(score)
        .split('')
        .map(digit => (Number(digit) + value) % 10)
        .join('')
    ),
    condition: score => hasDistinctDigits(score)
  }
};

export function applyButtonAction(name: ButtonName, score: number, value: number): number {
  return BUTTON_RULES[name].action(score, value);
}

export function isButtonConditionMet(name: ButtonName, score: number, value: number): boolean {
  return BUTTON_RULES[name].condition(score, value);
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
