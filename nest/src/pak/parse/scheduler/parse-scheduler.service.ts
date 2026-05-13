import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PakParseOrchestratorService } from './parse-orchestrator.service';

@Injectable()
export class PakParseSchedulerService {
  private readonly logger = new Logger(PakParseSchedulerService.name);

  constructor(private readonly orchestrator: PakParseOrchestratorService) {}

  @Cron('0 * * * *', { name: 'pak-dramaxima-hot' })
  hot(): Promise<unknown> {
    return this.orchestrator.runTier('hot').catch((err) => {
      this.logger.error(`hot tier failed: ${err.message}`, err.stack);
    });
  }

  @Cron('15 3 * * *', { name: 'pak-dramaxima-warm' })
  warm(): Promise<unknown> {
    return this.orchestrator.runTier('warm').catch((err) => {
      this.logger.error(`warm tier failed: ${err.message}`, err.stack);
    });
  }

  @Cron('45 3 * * 0', { name: 'pak-dramaxima-cold' })
  cold(): Promise<unknown> {
    return this.orchestrator.runTier('cold').catch((err) => {
      this.logger.error(`cold tier failed: ${err.message}`, err.stack);
    });
  }

  @Cron('30 */6 * * *', { name: 'pak-dramaxima-discovery' })
  discover(): Promise<unknown> {
    return this.orchestrator.runDiscovery().catch((err) => {
      this.logger.error(`discovery failed: ${err.message}`, err.stack);
    });
  }
}
