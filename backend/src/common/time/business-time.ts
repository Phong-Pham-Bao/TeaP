const BUSINESS_UTC_OFFSET = '+07:00';
const DAY_MS = 86_400_000;

export interface TimestampRange {
  gte?: Date;
  lt?: Date;
}

export function isBusinessDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const candidate = new Date(Date.UTC(year, month - 1, day));
  return (
    candidate.getUTCFullYear() === year &&
    candidate.getUTCMonth() === month - 1 &&
    candidate.getUTCDate() === day
  );
}

export function businessDateKey(instant: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(instant);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}

export function businessDateStart(date: string): Date {
  if (!isBusinessDate(date)) throw new Error(`Invalid business date: ${date}`);
  return new Date(`${date}T00:00:00.000${BUSINESS_UTC_OFFSET}`);
}

export function nextBusinessDateStart(date: string): Date {
  return new Date(businessDateStart(date).getTime() + DAY_MS);
}

export function businessTimestampRange(
  startDate?: string,
  endDate?: string,
): TimestampRange {
  return {
    ...(startDate ? { gte: businessDateStart(startDate) } : {}),
    ...(endDate ? { lt: nextBusinessDateStart(endDate) } : {}),
  };
}

export function currentBusinessMonthRange(now = new Date()): Required<TimestampRange> {
  const today = businessDateKey(now);
  return {
    gte: businessDateStart(`${today.slice(0, 7)}-01`),
    lt: nextBusinessDateStart(today),
  };
}

export function businessDateValue(now = new Date()): Date {
  return new Date(`${businessDateKey(now)}T00:00:00.000Z`);
}

export function businessDateColumn(date: string): Date {
  if (!isBusinessDate(date)) throw new Error(`Invalid business date: ${date}`);
  return new Date(`${date}T00:00:00.000Z`);
}

export function businessDateColumnRange(startDate?: string, endDate?: string): TimestampRange {
  return {
    ...(startDate ? { gte: businessDateColumn(startDate) } : {}),
    ...(endDate
      ? { lt: new Date(businessDateColumn(endDate).getTime() + DAY_MS) }
      : {}),
  };
}

export function businessMonthDateRange(month: number, year: number) {
  const start = new Date(Date.UTC(year, month - 1, 1));
  const endExclusive = new Date(Date.UTC(year, month, 1));
  return { gte: start, lt: endExclusive };
}

export function businessPeriodKey(date: Date, groupBy: 'day' | 'week' | 'month'): string {
  const dayKey = businessDateKey(date);
  if (groupBy === 'day') return dayKey;
  if (groupBy === 'month') return dayKey.slice(0, 7);

  const [year, month, day] = dayKey.split('-').map(Number);
  const target = new Date(Date.UTC(year, month - 1, day));
  const isoDay = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - isoDay);
  const isoYear = target.getUTCFullYear();
  const yearStart = new Date(Date.UTC(isoYear, 0, 1));
  const week = Math.ceil(((target.getTime() - yearStart.getTime()) / DAY_MS + 1) / 7);
  return `${isoYear}-W${String(week).padStart(2, '0')}`;
}
