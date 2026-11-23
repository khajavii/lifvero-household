import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

@Catch()
export class HttpExceptionResponseFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionResponseFilter.name);

  constructor(private readonly adapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const isHttp = exception instanceof HttpException;
    const status = isHttp ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    if (!isHttp) {
      this.logger.error('Unhandled Exception occurred:', exception);
      if (exception instanceof Error) {
        this.logger.error(exception.stack);
      }
    }

    let message: string | string[] = 'Internal server error';
    let data: unknown = null;

    if (isHttp) {
      const response = exception.getResponse();
      const payload = typeof response === 'string'
        ? { message: response }
        : (response as { message?: string | string[]; error?: unknown; data?: unknown; status?: unknown });
      const errors = Array.isArray(payload.message) ? payload.message : undefined;

      message = errors ? 'Validation failed' : (payload.message ?? exception.message);
      data = errors ? { errors } : (payload.data ?? null);
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    this.adapterHost.httpAdapter.reply(
      host.switchToHttp().getResponse(),
      {
        error: true,
        statusCode: status,
        message,
        data,
      },
      status,
    );
  }
}
