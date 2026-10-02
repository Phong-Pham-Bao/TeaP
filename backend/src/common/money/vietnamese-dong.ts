import { Prisma } from '@prisma/client';

export const VND_MAX_AMOUNT = 9_999_999_999;

export type MoneyInput =
  | Prisma.Decimal
  | string
  | number;

export function vnd(value: MoneyInput): Prisma.Decimal {
  const amount = new Prisma.Decimal(value);
  if (!amount.isFinite()) throw new RangeError('Money amount must be finite');
  return amount.toDecimalPlaces(0, Prisma.Decimal.ROUND_HALF_UP);
}

export function addVnd(...values: MoneyInput[]): Prisma.Decimal {
  return vnd(
    values.reduce<Prisma.Decimal>(
      (total, value) => total.add(new Prisma.Decimal(value)),
      new Prisma.Decimal(0),
    ),
  );
}

export function subtractVnd(
  minuend: MoneyInput,
  subtrahend: MoneyInput,
): Prisma.Decimal {
  return vnd(new Prisma.Decimal(minuend).sub(new Prisma.Decimal(subtrahend)));
}

export function multiplyVnd(
  amount: MoneyInput,
  multiplier: Prisma.Decimal | string | number,
): Prisma.Decimal {
  return vnd(new Prisma.Decimal(amount).mul(new Prisma.Decimal(multiplier)));
}

export function percentageOfVnd(
  amount: MoneyInput,
  percentage: Prisma.Decimal | string | number,
): Prisma.Decimal {
  return vnd(
    new Prisma.Decimal(amount).mul(new Prisma.Decimal(percentage)).div(100),
  );
}

export function minVnd(left: MoneyInput, right: MoneyInput): Prisma.Decimal {
  const normalizedLeft = vnd(left);
  const normalizedRight = vnd(right);
  return normalizedLeft.lte(normalizedRight)
    ? normalizedLeft
    : normalizedRight;
}

export function vndToNumber(value: MoneyInput): number {
  const amount = vnd(value);
  if (amount.abs().gt(Number.MAX_SAFE_INTEGER)) {
    throw new RangeError('Money amount exceeds the safe JSON integer range');
  }
  return amount.toNumber();
}

export function vndToString(value: MoneyInput): string {
  return vnd(value).toFixed(0);
}
