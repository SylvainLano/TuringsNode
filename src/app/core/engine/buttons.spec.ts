import { applyButtonAction, isButtonConditionMet, isButtonLegendary, isGoldenScore, nextButtonValue } from './buttons';

describe('Engine buttons', () => {
  describe('actions', () => {
    it('Primer jumps to the next prime', () => {
      expect(applyButtonAction('Primer', 20, 1)).toBe(23);
    });

    it('Split divides and rounds up', () => {
      expect(applyButtonAction('Split', 100, 7)).toBe(15);
      expect(applyButtonAction('Split', 30, 2)).toBe(15);
    });

    it('Boost adds the value', () => {
      expect(applyButtonAction('Boost', 20, 5)).toBe(25);
    });

    it('Digit multiplies by the value', () => {
      expect(applyButtonAction('Digit', 123, 4)).toBe(492);
    });

    it('Reduce divides by the square of the value and rounds up', () => {
      expect(applyButtonAction('Reduce', 1000, 3)).toBe(112);
      expect(applyButtonAction('Reduce', 500, 1)).toBe(500);
    });

    it('Align jumps to the next strictly greater multiple', () => {
      expect(applyButtonAction('Align', 100, 7)).toBe(105);
      expect(applyButtonAction('Align', 105, 7)).toBe(112);
    });

    it('Fiber jumps to the next Fibonacci number', () => {
      expect(applyButtonAction('Fiber', 1000, 3)).toBe(1597);
    });

    it('Factor adds the factorial of the value', () => {
      expect(applyButtonAction('Factor', 100, 4)).toBe(124);
    });

    it('Cipher shifts every digit and drops a leading zero', () => {
      expect(applyButtonAction('Cipher', 2345, 3)).toBe(5678);
      expect(applyButtonAction('Cipher', 91, 1)).toBe(2);
    });
  });

  describe('conditions', () => {
    it('Primer: a prime within ±value', () => {
      expect(isButtonConditionMet('Primer', 14, 1)).toBe(true);
      expect(isButtonConditionMet('Primer', 26, 2)).toBe(false);
    });

    it('Split: divisible by the value', () => {
      expect(isButtonConditionMet('Split', 30, 2)).toBe(true);
      expect(isButtonConditionMet('Split', 31, 2)).toBe(false);
    });

    it('Boost: within value of a perfect square', () => {
      expect(isButtonConditionMet('Boost', 20, 4)).toBe(true);
      expect(isButtonConditionMet('Boost', 20, 3)).toBe(false);
    });

    it('Digit: digital root equals the value', () => {
      expect(isButtonConditionMet('Digit', 987, 6)).toBe(true);
      expect(isButtonConditionMet('Digit', 987, 5)).toBe(false);
    });

    it('Reduce: multiple of a perfect square', () => {
      expect(isButtonConditionMet('Reduce', 12, 1)).toBe(true);
      expect(isButtonConditionMet('Reduce', 30, 1)).toBe(false);
    });

    it('Align: palindrome', () => {
      expect(isButtonConditionMet('Align', 12321, 9)).toBe(true);
      expect(isButtonConditionMet('Align', 12345, 9)).toBe(false);
    });

    it('Fiber: a Fibonacci number within ±F(value)', () => {
      expect(isButtonConditionMet('Fiber', 30, 5)).toBe(true); // F(5) = 5, 34 est à 4
      expect(isButtonConditionMet('Fiber', 30, 3)).toBe(false); // F(3) = 2
    });

    it('Factor: multiple of value! (ignoring 0! and 1!)', () => {
      // 240 et pas 120 : 120 = 5! rendrait le bouton légendaire, donc vert quelle que soit sa valeur
      expect(isButtonConditionMet('Factor', 240, 5)).toBe(true);
      expect(isButtonConditionMet('Factor', 240, 1)).toBe(false);
    });

    it('Cipher: all digits are distinct', () => {
      expect(isButtonConditionMet('Cipher', 4567, 5)).toBe(true);
      expect(isButtonConditionMet('Cipher', 4557, 5)).toBe(false);
    });
  });

  describe('legendary conditions', () => {
    it('Primer: twin primes of at least 4 digits', () => {
      expect(isButtonLegendary('Primer', 1019, 1)).toBe(true); // 1019 et 1021
      expect(isButtonLegendary('Primer', 1021, 1)).toBe(false); // 1023 n'est pas premier
      expect(isButtonLegendary('Primer', 101, 1)).toBe(false); // Moins de 4 chiffres
    });

    it('Split: multiple of 2520', () => {
      expect(isButtonLegendary('Split', 5040, 1)).toBe(true);
      expect(isButtonLegendary('Split', 5000, 1)).toBe(false);
      expect(isButtonLegendary('Split', 0, 1)).toBe(false);
    });

    it('Boost: sixth power from 64', () => {
      expect(isButtonLegendary('Boost', 729, 1)).toBe(true);
      expect(isButtonLegendary('Boost', 1, 1)).toBe(false);
      expect(isButtonLegendary('Boost', 512, 1)).toBe(false); // Un cube, pas un carré
    });

    it('Digit: narcissistic number of at least 3 digits', () => {
      expect(isButtonLegendary('Digit', 371, 1)).toBe(true);
      expect(isButtonLegendary('Digit', 7, 1)).toBe(false);
    });

    it('Reduce: power of 2 from 1024', () => {
      expect(isButtonLegendary('Reduce', 4096, 1)).toBe(true);
      expect(isButtonLegendary('Reduce', 512, 1)).toBe(false);
    });

    it('Align: palindrome with as many digits as the value', () => {
      expect(isButtonLegendary('Align', 12321, 5)).toBe(true);
      expect(isButtonLegendary('Align', 12321, 4)).toBe(false);
    });

    it('Fiber: Fibonacci prime from 13', () => {
      expect(isButtonLegendary('Fiber', 233, 1)).toBe(true);
      expect(isButtonLegendary('Fiber', 144, 1)).toBe(false);
      expect(isButtonLegendary('Fiber', 5, 1)).toBe(false);
    });

    it('Factor: exactly a factorial from 24', () => {
      expect(isButtonLegendary('Factor', 720, 1)).toBe(true);
      expect(isButtonLegendary('Factor', 6, 1)).toBe(false);
    });

    it('Cipher: at least 4 ascending consecutive digits', () => {
      expect(isButtonLegendary('Cipher', 3456, 1)).toBe(true);
      expect(isButtonLegendary('Cipher', 456, 1)).toBe(false);
    });

    it('a legendary button also counts as green', () => {
      // Factor 9 demande un multiple de 9! = 362880 : 5040 ne l'est pas, mais c'est 7!, une factorielle
      expect(isButtonConditionMet('Factor', 5040, 9)).toBe(true);
      expect(isButtonConditionMet('Factor', 5041, 9)).toBe(false);
    });
  });

  it('nextButtonValue cycles from 1 to 9', () => {
    expect(nextButtonValue(1)).toBe(2);
    expect(nextButtonValue(9)).toBe(1);
  });

  it('isGoldenScore matches the start of the famous constant of the value', () => {
    expect(isGoldenScore(3141, 3)).toBe(true);
    expect(isGoldenScore(314, 3)).toBe(false); // Moins de 4 chiffres
    expect(isGoldenScore(3142, 3)).toBe(false);
    expect(isGoldenScore(3141, 4)).toBe(false);
  });
});
