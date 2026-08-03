import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { SKIP_INTERCEPTOR_KEY } from './skip.decorator.js';

export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const skip = Reflect.getMetadata(
      SKIP_INTERCEPTOR_KEY,
      context.getHandler(),
    );

    if (skip) return next.handle();

    return next.handle().pipe(
      map((data) => {
        const response: Record<string, unknown> = { success: true };
        if (data) response.data = data;
        return response;
      }),
    );
  }
}
