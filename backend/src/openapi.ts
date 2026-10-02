import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';

export function createOpenApiDocument(app: INestApplication): OpenAPIObject {
  const config = new DocumentBuilder()
    .setTitle('TeaP ERP/POS API')
    .setDescription(
      'API documentation for TeaP — Bubble Tea Chain ERP/POS Management System. ' +
        'Supports multi-branch operations, POS, inventory management, HR, and finance.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT access token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Auth', 'Authentication & Authorization')
    .addTag('Users', 'User management')
    .addTag('Branches', 'Branch management')
    .addTag('Categories', 'Product category management')
    .addTag('Products', 'Product & menu management')
    .addTag('Recipes', 'Recipe / BOM management')
    .addTag('POS', 'Point of Sale operations')
    .addTag('Inventory', 'Stock & warehouse management')
    .addTag('Customers', 'Customer & loyalty management')
    .addTag('Promotions', 'Promotion & discount management')
    .addTag('HR', 'Human resources management')
    .addTag('Finance', 'Cash flow & financial management')
    .addTag('Reports', 'Analytics & reporting')
    .addTag('Platform Operations', 'Outbox monitoring, replay, and retention')
    .build();

  return SwaggerModule.createDocument(app, config, {
    operationIdFactory: (controllerKey, methodKey) =>
      `${controllerKey.replace(/Controller$/, '')}_${methodKey}`,
  });
}
