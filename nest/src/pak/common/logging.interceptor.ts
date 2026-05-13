import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';

@Injectable()
export class PakLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('PAK-HTTP');

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = ctx.switchToHttp().getRequest<{ method: string; url: string }>();
    const start = Date.now();
    return next.handle().pipe(
      tap({
        next: () => {
          const ms = Date.now() - start;
          this.logger.log(`${req.method} ${req.url} — ${ms}ms`);
        },
      }),
    );
  }
}
