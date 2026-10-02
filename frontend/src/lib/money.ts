export type VndAmount = number;

const VND_FORMATTER = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

export function parseVnd(value: number | string): VndAmount {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isSafeInteger(parsed)) {
    throw new RangeError(`Invalid whole-VND amount: ${value}`);
  }
  return parsed;
}

export function roundVnd(value: number): VndAmount {
  if (!Number.isFinite(value)) {
    throw new RangeError(`Invalid VND amount: ${value}`);
  }
  const rounded = value < 0 ? -Math.round(Math.abs(value)) : Math.round(value);
  if (!Number.isSafeInteger(rounded)) {
    throw new RangeError(`VND amount exceeds the safe integer range: ${value}`);
  }
  return rounded;
}

export function addVnd(...values: Array<number | string>): VndAmount {
  return roundVnd(values.reduce<number>((total, value) => total + parseVnd(value), 0));
}

export function multiplyVnd(
  amount: number | string,
  multiplier: number,
): VndAmount {
  return roundVnd(parseVnd(amount) * multiplier);
}

export function percentageOfVnd(
  amount: number | string,
  percentage: number | string,
): VndAmount {
  const parsedPercentage =
    typeof percentage === 'number' ? percentage : Number(percentage);
  if (!Number.isFinite(parsedPercentage)) {
    throw new RangeError(`Invalid percentage: ${percentage}`);
  }
  return roundVnd((parseVnd(amount) * parsedPercentage) / 100);
}

export function formatVnd(value: number | string): string {
  return VND_FORMATTER.format(parseVnd(value));
}
