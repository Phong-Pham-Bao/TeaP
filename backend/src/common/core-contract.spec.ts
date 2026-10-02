import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { QueryInventoryDto } from '../modules/inventory/dto/query-inventory.dto';
import { CreateOrderDto } from '../modules/pos/dto/create-order.dto';
import { CheckoutDto } from '../modules/pos/dto/checkout.dto';
import { CreateCashFlowDto } from '../modules/finance/dto/create-cash-flow.dto';
import { CreateProductDto } from '../modules/products/dto/create-product.dto';
import { CashFlowType, PaymentMethod, ProductType } from '@prisma/client';
import { normalizeVietnamesePhone } from './transforms/normalize-phone';

describe('core API contracts', () => {
  it.each([
    ['090 123 4567', '0901234567'],
    ['+84 90-123-4567', '0901234567'],
    ['84901234567', '0901234567'],
  ])('normalizes equivalent phone forms', (input, expected) => {
    expect(normalizeVietnamesePhone(input)).toBe(expected);
  });

  it('rejects unknown boolean query values instead of converting them to false', async () => {
    const query = plainToInstance(QueryInventoryDto, { belowMin: 'anything' });
    expect(await validate(query)).not.toHaveLength(0);
  });

  it('preserves an explicit false boolean query value', async () => {
    const query = plainToInstance(QueryInventoryDto, { belowMin: 'false' });
    expect(query.belowMin).toBe(false);
    expect(await validate(query)).toHaveLength(0);
  });

  it('accepts item preparation notes in an order contract', async () => {
    const dto = plainToInstance(CreateOrderDto, {
      branchId: '8cb76483-f142-42fb-a2ae-c1aa82a5d920',
      items: [
        {
          productId: '1db04ed0-0b2f-4cca-867e-82251641475e',
          qty: 1,
          attributes: { ice: 50, sugar: 30, toppings: [], note: 'Đá riêng' },
        },
      ],
    });
    expect(await validate(dto)).toHaveLength(0);
  });

  it('rejects orders without any items', async () => {
    const dto = plainToInstance(CreateOrderDto, {
      branchId: '8cb76483-f142-42fb-a2ae-c1aa82a5d920',
      items: [],
    });
    expect(await validate(dto)).not.toHaveLength(0);
  });

  it.each([
    [CheckoutDto, { paymentMethod: PaymentMethod.CASH, amountPaid: 1000.5 }],
    [
      CreateCashFlowDto,
      {
        branchId: '8cb76483-f142-42fb-a2ae-c1aa82a5d920',
        type: CashFlowType.INCOME,
        amount: 1000.5,
        description: 'Test cash flow',
      },
    ],
    [
      CreateProductDto,
      {
        sku: 'TEST-001',
        name: 'Test product',
        type: ProductType.DRINK,
        basePrice: 1000.5,
      },
    ],
  ])('rejects fractional VND in %s', async (Dto, input) => {
    const dto = plainToInstance(
      Dto as unknown as new () => object,
      input,
    );
    expect(await validate(dto)).not.toHaveLength(0);
  });
});
