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

describe('Engine math', () => {
  it('isPrime', () => {
    expect([2, 3, 5, 13, 97, 7919].every(isPrime)).toBe(true);
    expect([-7, 0, 1, 4, 9, 25, 91, 7917].some(isPrime)).toBe(false);
  });

  it('nextPrime returns the next strictly greater prime', () => {
    expect(nextPrime(20)).toBe(23);
    expect(nextPrime(23)).toBe(29);
    expect(nextPrime(100)).toBe(101);
  });

  it('nthFibonacci', () => {
    expect([0, 1, 2, 3, 4, 5, 8].map(nthFibonacci)).toEqual([0, 1, 1, 2, 3, 5, 21]);
  });

  it('nextFibonacci returns the next strictly greater Fibonacci number', () => {
    expect(nextFibonacci(0)).toBe(1);
    expect(nextFibonacci(1)).toBe(2);
    expect(nextFibonacci(13)).toBe(21);
    expect(nextFibonacci(1000)).toBe(1597);
  });

  it('hasFibonacciBetween', () => {
    expect(hasFibonacciBetween(19, 21)).toBe(true);
    expect(hasFibonacciBetween(14, 20)).toBe(false);
  });

  it('factorial', () => {
    expect([0, 1, 3, 5, 9].map(factorial)).toEqual([1, 1, 6, 120, 362880]);
    expect(factorial(-1)).toBe(0);
  });

  it('digitalRoot', () => {
    expect(digitalRoot(987)).toBe(6);
    expect(digitalRoot(23)).toBe(5);
    expect(digitalRoot(7)).toBe(7);
  });

  it('isPalindrome', () => {
    expect(isPalindrome(12321)).toBe(true);
    expect(isPalindrome(12345)).toBe(false);
  });

  it('hasDistinctDigits', () => {
    expect(hasDistinctDigits(4567)).toBe(true);
    expect(hasDistinctDigits(4557)).toBe(false);
  });

  it('hasSquareFactor', () => {
    expect([4, 12, 50].every(hasSquareFactor)).toBe(true);
    expect([2, 30, 105].some(hasSquareFactor)).toBe(false);
  });

  it('isNearPerfectSquare', () => {
    expect(isNearPerfectSquare(16, 1)).toBe(true);
    expect(isNearPerfectSquare(20, 3)).toBe(false); // 4 au-dessus de 16, 5 en dessous de 25
    expect(isNearPerfectSquare(20, 4)).toBe(true);
    expect(isNearPerfectSquare(-1, 9)).toBe(false);
  });
});
