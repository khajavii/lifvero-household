import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

@Catch(HttpException)
export class HttpExceptionResponseFilter implements ExceptionFilter<HttpException> {
  constructor(private readonly adapterHost: HttpAdapterHost) {}

  catch(exception: HttpException, host: ArgumentsHost): void {
    const status = exception.getStatus();
    const response = exception.getResponse();
    const payload = typeof response === 'string'
      ? { message: response }
      : (response as { message?: string | string[]; error?: unknown; data?: unknown; status?: unknown });
    const errors = Array.isArray(payload.message) ? payload.message : undefined;

    this.adapterHost.httpAdapter.reply(host.switchToHttp().getResponse(), {
      error: true,
      message: errors ? 'Validation failed' : (payload.message ?? exception.message),
      data: errors ? { errors } : (payload.data ?? null),
      status: payload.error === true && typeof payload.status === 'number' ? payload.status : status,
    }, status);
  }
}
