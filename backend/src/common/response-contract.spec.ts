import { Prisma } from '@prisma/client';
import { toProductResponse } from '../modules/products/dto/product-response.dto';
import {
  toBalanceResponse,
  toInventoryResponse,
  toStockLedgerResponse,
} from '../modules/inventory/dto/inventory-response.dto';
import { toCashFlowResponse } from '../modules/finance/dto/cash-flow-response.dto';
import {
  toAttendanceResponse,
  toSalarySlipResponse,
} from '../modules/hr/dto/hr-response.dto';
import { toOrderResponse } from '../modules/pos/dto/order-response.dto';

describe('response scalar contracts', () => {
  it('serializes product and POS money as whole-VND JSON numbers', () => {
    expect(
      toProductResponse({
        basePrice: new Prisma.Decimal('45000.40'),
        sizes: [{ priceAdj: new Prisma.Decimal('5000.50') }],
      }),
    ).toEqual({ basePrice: 45000, sizes: [{ priceAdj: 5001 }] });

    const order = toOrderResponse({
      subtotal: new Prisma.Decimal('50000'),
      discount: new Prisma.Decimal('5000'),
      totalAmount: new Prisma.Decimal('45000'),
      items: [
        {
          unitPrice: new Prisma.Decimal('45000'),
          subtotal: new Prisma.Decimal('45000'),
          product: { basePrice: new Prisma.Decimal('45000') },
          size: { priceAdj: new Prisma.Decimal('5000') },
        },
      ],
      payments: [{ amount: new Prisma.Decimal('45000') }],
    });

    expect(order.totalAmount).toBe(45000);
    expect(order.items[0].product?.basePrice).toBe(45000);
    expect(order.items[0].size?.priceAdj).toBe(5000);
    expect(order.payments?.[0].amount).toBe(45000);
  });

  it('serializes stock quantities as exact decimal strings', () => {
    expect(
      toInventoryResponse({ currentStock: '100.125', minStock: '10.000' }),
    ).toEqual({ currentStock: '100.125', minStock: '10' });
    expect(toBalanceResponse({ balanceAfter: '99.875' }).balanceAfter).toBe(
      '99.875',
    );
    expect(
      toStockLedgerResponse({ changeQty: '-0.125', balanceAfter: '99.875' }),
    ).toEqual({ changeQty: '-0.125', balanceAfter: '99.875' });
  });

  it('serializes finance and HR values according to their domain units', () => {
    expect(toCashFlowResponse({ amount: '150000.00' }).amount).toBe(150000);
    expect(toAttendanceResponse({ hoursWorked: '7.50' }).hoursWorked).toBe('7.5');
    expect(
      toSalarySlipResponse({
        baseSalary: '10000000',
        bonus: '500000',
        deduction: '100000',
        netSalary: '10400000',
      }),
    ).toEqual({
      baseSalary: 10000000,
      bonus: 500000,
      deduction: 100000,
      netSalary: 10400000,
    });
  });
});
