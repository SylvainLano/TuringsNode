// Fonctions arithmétiques pures utilisées par les actions et les conditions des boutons

export function isPrime(num: number): boolean {
  if (num <= 3) return num > 1;
  if (num % 2 === 0 || num % 3 === 0) return false;
  // Au-delà de 3, tout nombre premier s'écrit 6k ± 1
  for (let i = 5; i * i <= num; i += 6) {
    if (num % i === 0 || num % (i + 2) === 0) return false;
  }
  return true;
}

/** Plus petit nombre premier strictement supérieur à `num` */
export function nextPrime(num: number): number {
  let candidate = num + 1;
  while (!isPrime(candidate)) {
    candidate++;
  }
  return candidate;
}

/** N-ième nombre de Fibonacci (F0 = 0, F1 = 1, F2 = 1, F3 = 2...) */
export function nthFibonacci(n: number): number {
  if (n <= 1) return n;
  let a = 0, b = 1;
  for (let i = 2; i <= n; i++) {
    [a, b] = [b, a + b];
  }
  return b;
}

/** Plus petit nombre de Fibonacci strictement supérieur à `num` */
export function nextFibonacci(num: number): number {
  let a = 0, b = 1;
  while (b <= num) {
    [a, b] = [b, a + b];
  }
  return b;
}

/** Vrai si un nombre de Fibonacci se trouve dans l'intervalle [min, max] */
export function hasFibonacciBetween(min: number, max: number): boolean {
  let a = 0, b = 1;
  while (a <= max) {
    if (a >= min) return true;
    [a, b] = [b, a + b];
  }
  return false;
}

export function factorial(n: number): number {
  if (n < 0) return 0;
  let result = 1;
  for (let i = 2; i <= n; i++) {
    result *= i;
  }
  return result;
}

/** Somme des chiffres répétée jusqu'à obtenir un seul chiffre (ex : 144 → 9) */
export function digitalRoot(num: number): number {
  while (num > 9) {
    num = String(num).split('').reduce((sum, digit) => sum + Number(digit), 0);
  }
  return num;
}

export function isPalindrome(num: number): boolean {
  const digits = String(num);
  return digits === digits.split('').reverse().join('');
}

export function hasDistinctDigits(num: number): boolean {
  const digits = String(num);
  return new Set(digits).size === digits.length;
}

/** Vrai si `num` est un multiple d'un carré parfait supérieur à 1 (4, 9, 16...) */
export function hasSquareFactor(num: number): boolean {
  for (let i = 2; i * i <= num; i++) {
    if (num % (i * i) === 0) return true;
  }
  return false;
}

/** Vrai si `num` est à `tolerance` ou moins d'un carré parfait */
export function isNearPerfectSquare(num: number, tolerance: number): boolean {
  if (num < 0) return false;
  const sqrt = Math.sqrt(num);
  const distToLower = num - Math.floor(sqrt) ** 2;
  const distToUpper = Math.ceil(sqrt) ** 2 - num;
  return distToLower <= tolerance || distToUpper <= tolerance;
}

/** Vrai si `num` est la puissance `exponent` d'un entier (ex : 64 = 2⁶) */
export function isPerfectPower(num: number, exponent: number): boolean {
  if (num < 1) return false;
  const root = Math.round(num ** (1 / exponent));
  return [root - 1, root, root + 1].some(candidate => candidate >= 1 && candidate ** exponent === num);
}

/** Nombre égal à la somme de ses chiffres élevés à la puissance de leur nombre (ex : 153 = 1³ + 5³ + 3³) */
export function isNarcissistic(num: number): boolean {
  if (num < 0) return false;
  const digits = String(num);
  return digits.split('').reduce((sum, digit) => sum + Number(digit) ** digits.length, 0) === num;
}

export function isPowerOfTwo(num: number): boolean {
  if (num < 1) return false;
  const exponent = Math.log2(num);
  return Number.isInteger(exponent) && 2 ** exponent === num;
}

export function isFibonacci(num: number): boolean {
  let a = 0, b = 1;
  while (a < num) {
    [a, b] = [b, a + b];
  }
  return a === num;
}

/** Vrai si `num` est exactement une factorielle (1, 2, 6, 24, 120...) */
export function isFactorial(num: number): boolean {
  let factorialValue = 1, n = 1;
  while (factorialValue < num) {
    n++;
    factorialValue *= n;
  }
  return factorialValue === num;
}

/** Chiffres qui se suivent dans l'ordre croissant (ex : 1234, 45678) */
export function hasConsecutiveAscendingDigits(num: number): boolean {
  const digits = String(num);
  return digits.split('').every((digit, i) => i === 0 || Number(digit) === Number(digits[i - 1]) + 1);
}

/** Chiffres dans l'ordre inverse ; un zéro qui se retrouve en tête disparaît (ex : 120 → 21) */
export function reverseDigits(num: number): number {
  return Number(String(num).split('').reverse().join(''));
}
