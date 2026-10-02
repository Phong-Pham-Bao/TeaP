import {
  addVnd,
  minVnd,
  multiplyVnd,
  percentageOfVnd,
  subtractVnd,
  vnd,
  vndToNumber,
  vndToString,
} from './vietnamese-dong';

describe('Vietnamese dong money contract', () => {
  it.each([
    ['100.49', '100'],
    ['100.50', '101'],
    ['-100.50', '-101'],
  ])('rounds %s to %s with ROUND_HALF_UP', (input, expected) => {
    expect(vnd(input).toFixed(0)).toBe(expected);
  });

  it('calculates and rounds a percentage exactly once', () => {
    expect(percentageOfVnd('10005', '15').toFixed(0)).toBe('1501');
  });

  it('keeps arithmetic in Decimal and returns integer API values', () => {
    const subtotal = multiplyVnd(addVnd('40000', '5000'), 3);
    const discount = minVnd(percentageOfVnd(subtotal, 10), '20000');
    const total = subtractVnd(subtotal, discount);

    expect(vndToString(total)).toBe('121500');
    expect(vndToNumber(total)).toBe(121500);
  });

  it('rejects unsafe JSON integer values', () => {
    expect(() => vndToNumber('9007199254740992')).toThrow(RangeError);
  });
});
