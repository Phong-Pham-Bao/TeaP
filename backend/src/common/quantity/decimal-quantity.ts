import { Prisma } from '@prisma/client';

export type DecimalQuantityInput = Prisma.Decimal | string | number;

/**
 * Decimal quantities are serialized as strings so JSON consumers never lose
 * precision. Trailing zeroes are removed while the database scale remains the
 * authority for accepted input precision.
 */
export function decimalQuantityToString(value: DecimalQuantityInput): string {
  const quantity = new Prisma.Decimal(value);
  if (!quantity.isFinite()) {
    throw new RangeError('Decimal quantity must be finite');
  }
  return quantity.toString();
}
