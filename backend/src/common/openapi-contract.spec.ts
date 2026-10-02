import { readFileSync } from 'fs';
import * as path from 'path';

type OpenApiSchema = {
  type?: string;
  required?: string[];
  properties?: Record<
    string,
    {
      type?: string;
      minimum?: number;
      maximum?: number;
      pattern?: string;
      $ref?: string;
    }
  >;
};

type OpenApiDocument = {
  openapi: string;
  paths: Record<
    string,
    Record<
      string,
      {
        operationId?: string;
        responses?: Record<
          string,
          { content?: Record<string, { schema?: { $ref?: string } }> }
        >;
      }
    >
  >;
  components: { schemas: Record<string, OpenApiSchema> };
};

const contractPath = path.resolve(__dirname, '../../openapi/openapi.json');
const contract = JSON.parse(
  readFileSync(contractPath, 'utf8'),
) as OpenApiDocument;

describe('generated OpenAPI contract', () => {
  it('contains the critical ERP routes and unique operation IDs', () => {
    const criticalRoutes = [
      '/api/v1/auth/login',
      '/api/v1/pos/orders',
      '/api/v1/pos/orders/{id}/checkout',
      '/api/v1/inventory/import',
      '/api/v1/finance/cash-flows',
      '/api/v1/hr/schedules',
      '/api/v1/platform/outbox/{id}/replay',
      '/api/v1/platform/retention/cleanup',
    ];
    for (const route of criticalRoutes)
      expect(contract.paths[route]).toBeDefined();

    const operationIds = Object.values(contract.paths).flatMap((pathItem) =>
      Object.values(pathItem)
        .map((operation) => operation.operationId)
        .filter((value): value is string => Boolean(value)),
    );
    expect(new Set(operationIds).size).toBe(operationIds.length);
  });

  it('publishes the whole-VND constraints in request schemas', () => {
    const amount =
      contract.components.schemas.CheckoutDto.properties?.amountPaid;
    expect(amount).toMatchObject({
      type: 'integer',
      minimum: 0,
      maximum: 9_999_999_999,
    });
  });

  it('publishes typed POS success responses', () => {
    const createResponse =
      contract.paths['/api/v1/pos/orders'].post.responses?.['201']?.content?.[
        'application/json'
      ]?.schema;
    const checkoutResponse =
      contract.paths['/api/v1/pos/orders/{id}/checkout'].post.responses?.['200']
        ?.content?.['application/json']?.schema;

    expect(createResponse?.$ref).toBe('#/components/schemas/OrderResponseDto');
    expect(checkoutResponse?.$ref).toBe(
      '#/components/schemas/OrderResponseDto',
    );
    expect(contract.components.schemas.OrderResponseDto.required).toEqual(
      expect.arrayContaining([
        'id',
        'subtotal',
        'discount',
        'totalAmount',
        'items',
      ]),
    );
  });

  it('publishes consistent money and decimal quantity response scalars', () => {
    expect(
      contract.components.schemas.ProductResponseDto.properties?.basePrice,
    ).toMatchObject({ type: 'integer' });
    expect(
      contract.components.schemas.CashFlowResponseDto.properties?.amount,
    ).toMatchObject({ type: 'integer' });
    expect(
      contract.components.schemas.SalarySlipResponseDto.properties?.netSalary,
    ).toMatchObject({ type: 'integer' });

    const decimalString = {
      type: 'string',
      pattern: '^-?\\d+(?:\\.\\d+)?$',
    };
    expect(
      contract.components.schemas.InventoryResponseDto.properties?.currentStock,
    ).toMatchObject(decimalString);
    expect(
      contract.components.schemas.StockLedgerResponseDto.properties?.changeQty,
    ).toMatchObject(decimalString);
    expect(
      contract.components.schemas.RecipeItemResponseDto.properties?.quantity,
    ).toMatchObject(decimalString);
    expect(
      contract.components.schemas.AttendanceResponseDto.properties?.hoursWorked,
    ).toMatchObject(decimalString);
  });

  it('publishes typed success responses for core ERP domains', () => {
    const responseRef = (route: string, method: string, status: string) =>
      contract.paths[route][method].responses?.[status]?.content?.[
        'application/json'
      ]?.schema?.$ref;

    expect(responseRef('/api/v1/products/menu', 'get', '200')).toBe(
      '#/components/schemas/MenuResponseDto',
    );
    expect(responseRef('/api/v1/finance/summary', 'get', '200')).toBe(
      '#/components/schemas/CashFlowSummaryResponseDto',
    );
    expect(responseRef('/api/v1/hr/attendance/check-in', 'post', '201')).toBe(
      '#/components/schemas/AttendanceResponseDto',
    );
  });
});
