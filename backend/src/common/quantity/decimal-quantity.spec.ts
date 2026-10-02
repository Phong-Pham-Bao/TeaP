import { decimalQuantityToString } from './decimal-quantity';

describe('decimalQuantityToString', () => {
  it('preserves fractional quantities without binary floating point drift', () => {
    expect(decimalQuantityToString('10.125')).toBe('10.125');
    expect(decimalQuantityToString('0.010')).toBe('0.01');
  });

  it('rejects non-finite values', () => {
    expect(() => decimalQuantityToString(Number.NaN)).toThrow(
      'Decimal quantity must be finite',
    );
  });
});
