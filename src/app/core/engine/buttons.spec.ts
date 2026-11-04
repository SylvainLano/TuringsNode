import { applyButtonAction, isButtonConditionMet, isGoldenScore, nextButtonValue } from './buttons';

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
      expect(isButtonConditionMet('Primer', 14, 1)).toBeTrue();
      expect(isButtonConditionMet('Primer', 26, 2)).toBeFalse();
    });

    it('Split: divisible by the value', () => {
      expect(isButtonConditionMet('Split', 30, 2)).toBeTrue();
      expect(isButtonConditionMet('Split', 31, 2)).toBeFalse();
    });

    it('Boost: within value of a perfect square', () => {
      expect(isButtonConditionMet('Boost', 20, 4)).toBeTrue();
      expect(isButtonConditionMet('Boost', 20, 3)).toBeFalse();
    });

    it('Digit: digital root equals the value', () => {
      expect(isButtonConditionMet('Digit', 987, 6)).toBeTrue();
      expect(isButtonConditionMet('Digit', 987, 5)).toBeFalse();
    });

    it('Reduce: multiple of a perfect square', () => {
      expect(isButtonConditionMet('Reduce', 12, 1)).toBeTrue();
      expect(isButtonConditionMet('Reduce', 30, 1)).toBeFalse();
    });

    it('Align: palindrome', () => {
      expect(isButtonConditionMet('Align', 12321, 9)).toBeTrue();
      expect(isButtonConditionMet('Align', 12345, 9)).toBeFalse();
    });

    it('Fiber: a Fibonacci number within ±F(value)', () => {
      expect(isButtonConditionMet('Fiber', 30, 5)).toBeTrue();  // F(5) = 5, 34 est à 4
      expect(isButtonConditionMet('Fiber', 30, 3)).toBeFalse(); // F(3) = 2
    });

    it('Factor: multiple of value! (ignoring 0! and 1!)', () => {
      expect(isButtonConditionMet('Factor', 120, 5)).toBeTrue();
      expect(isButtonConditionMet('Factor', 120, 1)).toBeFalse();
    });

    it('Cipher: all digits are distinct', () => {
      expect(isButtonConditionMet('Cipher', 4567, 5)).toBeTrue();
      expect(isButtonConditionMet('Cipher', 4557, 5)).toBeFalse();
    });
  });

  it('nextButtonValue cycles from 1 to 9', () => {
    expect(nextButtonValue(1)).toBe(2);
    expect(nextButtonValue(9)).toBe(1);
  });

  it('isGoldenScore matches the start of the famous constant of the value', () => {
    expect(isGoldenScore(3141, 3)).toBeTrue();
    expect(isGoldenScore(314, 3)).toBeFalse();  // Moins de 4 chiffres
    expect(isGoldenScore(3142, 3)).toBeFalse();
    expect(isGoldenScore(3141, 4)).toBeFalse();
  });
});
