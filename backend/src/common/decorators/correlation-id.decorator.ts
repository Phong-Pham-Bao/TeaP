import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { CorrelatedRequest } from '../middleware/correlation-id.middleware';

export const CorrelationId = createParamDecorator(
  (_data: unknown, context: ExecutionContext): string =>
    context.switchToHttp().getRequest<CorrelatedRequest>().correlationId,
);
