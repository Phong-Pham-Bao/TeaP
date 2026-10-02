import {
  businessDateKey,
  businessPeriodKey,
  businessTimestampRange,
  isBusinessDate,
} from './business-time';

describe('Vietnam business time', () => {
  it('separates instants around Vietnam midnight', () => {
    expect(businessDateKey(new Date('2026-09-27T16:59:00.000Z'))).toBe('2026-09-27');
    expect(businessDateKey(new Date('2026-09-27T17:01:00.000Z'))).toBe('2026-09-28');
  });

  it('builds an end-exclusive business-day range', () => {
    expect(businessTimestampRange('2026-09-28', '2026-09-28')).toEqual({
      gte: new Date('2026-09-27T17:00:00.000Z'),
      lt: new Date('2026-09-28T17:00:00.000Z'),
    });
  });

  it('rejects impossible calendar dates', () => {
    expect(isBusinessDate('2026-02-29')).toBe(false);
    expect(isBusinessDate('2028-02-29')).toBe(true);
  });

  it('uses ISO week boundaries on the Vietnam calendar date', () => {
    expect(businessPeriodKey(new Date('2027-01-03T16:00:00.000Z'), 'week')).toBe('2026-W53');
    expect(businessPeriodKey(new Date('2027-01-03T17:00:00.000Z'), 'week')).toBe('2027-W01');
  });
});
