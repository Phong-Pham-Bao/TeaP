import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { CorrelatedRequest } from '../middleware/correlation-id.middleware';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<CorrelatedRequest>();
    const correlationId = request.correlationId;

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let code = 'INTERNAL_SERVER_ERROR';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      code = `HTTP_${status}`;
      const errorResponse = exception.getResponse();

      if (typeof errorResponse === 'string') {
        message = errorResponse;
      } else if (errorResponse && typeof errorResponse === 'object') {
        const body = errorResponse as { message?: string | string[]; error?: string };
        message = body.message || exception.message;
        if (body.error) code = body.error.toUpperCase().replace(/[^A-Z0-9]+/g, '_');
      }
    } else if (exception instanceof Error) {
      this.logger.error(
        `${request.method} ${request.url} correlationId=${correlationId}: ${exception.message}`,
        exception.stack,
      );
    }

    response.status(status).json({
      statusCode: status,
      code,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
      correlationId,
    });
  }
}
