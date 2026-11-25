import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

/**
 * Global exception filter ensuring standardized JSON error responses across the application.
 *
 * Catches all HTTP and unhandled exceptions, formatting them into a consistent structure:
 * `{ error: true, statusCode: number, message: string, data: any }`.
 */
@Catch()
export class HttpExceptionResponseFilter implements ExceptionFilter {
  /** Logger instance for capturing error traces. */
  private readonly logger = new Logger(HttpExceptionResponseFilter.name);

  /**
   * Initializes the exception filter with the HTTP adapter host.
   *
   * @param adapterHost - Provides access to the underlying platform HTTP adapter.
   */
  constructor(private readonly adapterHost: HttpAdapterHost) {}

  /**
   * Intercepts and transforms unhandled exceptions into formatted HTTP responses.
   *
   * @param exception - The caught error or exception instance.
   * @param host - Execution context providing access to HTTP request and response objects.
   */
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
