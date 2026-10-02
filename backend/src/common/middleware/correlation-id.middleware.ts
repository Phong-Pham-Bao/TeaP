import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { NextFunction, Request, Response } from 'express';

export interface CorrelatedRequest extends Request {
  correlationId: string;
}

const SAFE_CORRELATION_ID = /^[A-Za-z0-9._:-]{8,128}$/;

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(request: CorrelatedRequest, response: Response, next: NextFunction): void {
    const supplied = request.headers['x-correlation-id'];
    request.correlationId =
      typeof supplied === 'string' && SAFE_CORRELATION_ID.test(supplied)
        ? supplied
        : randomUUID();
    response.setHeader('x-correlation-id', request.correlationId);
    next();
  }
}
