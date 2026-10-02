import {
  CanActivate,
  ExecutionContext,
  INestApplication,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';

class HeaderActorGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const role = request.headers['x-test-role'] as Role | undefined;
    if (!role) return false;

    const allowedBranchIds = String(request.headers['x-test-branches'] ?? '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);

    request.user = {
      userId: 'integration-user',
      email: 'integration@teap.test',
      role,
      branchId: allowedBranchIds[0] ?? null,
      allowedBranchIds,
      sessionId: 'integration-session',
    };
    return true;
  }
}

describe('Inventory API authorization integration', () => {
  let app: INestApplication;
  let baseUrl: string;
  const inventoryService = {
    findAll: jest.fn(async (query) => query),
    importStock: jest.fn(async (dto) => dto),
    adjustStock: jest.fn(async (dto) => dto),
    transferStock: jest.fn(async (dto) => dto),
    getAlerts: jest.fn(async (branchId) => ({ branchId })),
    getLedger: jest.fn(async (query) => query),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [InventoryController],
      providers: [
        RolesGuard,
        { provide: InventoryService, useValue: inventoryService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useClass(HeaderActorGuard)
      .compile();

    app = moduleRef.createNestApplication();
    await app.listen(0, '127.0.0.1');
    baseUrl = await app.getUrl();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  async function callApi(
    path: string,
    role: Role,
    branches: string,
    options: { method?: string; body?: unknown } = {},
  ) {
    const response = await fetch(`${baseUrl}${path}`, {
      method: options.method ?? 'GET',
      headers: {
        connection: 'close',
        'x-test-role': role,
        'x-test-branches': branches,
        ...(options.body ? { 'content-type': 'application/json' } : {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
    const payload = (await response.json()) as Record<string, unknown>;
    return { response, payload };
  }

  it('allows list access only inside one of the selected account branches', async () => {
    const allowed = await callApi(
      '/inventory?branchId=branch-b',
      Role.MANAGER,
      'branch-a,branch-b',
    );
    expect(allowed.response.status).toBe(200);
    expect(allowed.payload.branchId).toBe('branch-b');

    const denied = await callApi(
      '/inventory?branchId=branch-c',
      Role.MANAGER,
      'branch-a,branch-b',
    );
    expect(denied.response.status).toBe(403);
  });

  it('requires a branch selection for a multi-branch list request', async () => {
    const result = await callApi(
      '/inventory',
      Role.MANAGER,
      'branch-a,branch-b',
    );
    expect(result.response.status).toBe(403);
    expect(inventoryService.findAll).not.toHaveBeenCalled();
  });

  it('rejects a create-style import targeting an unassigned branch', async () => {
    const result = await callApi(
      '/inventory/import',
      Role.WAREHOUSE_STAFF,
      'branch-a,branch-b',
      { method: 'POST', body: { branchId: 'branch-c', items: [] } },
    );
    expect(result.response.status).toBe(403);
    expect(inventoryService.importStock).not.toHaveBeenCalled();
  });

  it('checks both ends of a transfer and its elevated permission', async () => {
    const allowed = await callApi(
      '/inventory/transfer',
      Role.MANAGER,
      'branch-a,branch-b',
      {
        method: 'POST',
        body: {
          fromBranchId: 'branch-a',
          toBranchId: 'branch-b',
          materialId: 'material-1',
          quantity: 1,
        },
      },
    );
    expect(allowed.response.status).toBe(201);
    expect(inventoryService.transferStock).toHaveBeenCalledTimes(1);

    const outsideScope = await callApi(
      '/inventory/transfer',
      Role.MANAGER,
      'branch-a,branch-b',
      {
        method: 'POST',
        body: {
          fromBranchId: 'branch-a',
          toBranchId: 'branch-c',
          materialId: 'material-1',
          quantity: 1,
        },
      },
    );
    expect(outsideScope.response.status).toBe(403);

    const insufficientPermission = await callApi(
      '/inventory/transfer',
      Role.WAREHOUSE_STAFF,
      'branch-a,branch-b',
      {
        method: 'POST',
        body: {
          fromBranchId: 'branch-a',
          toBranchId: 'branch-b',
          materialId: 'material-1',
          quantity: 1,
        },
      },
    );
    expect(insufficientPermission.response.status).toBe(403);
  });

  it('keeps kitchen staff outside inventory APIs', async () => {
    const result = await callApi(
      '/inventory?branchId=branch-a',
      Role.KITCHEN_STAFF,
      'branch-a',
    );
    expect(result.response.status).toBe(403);
  });
});
