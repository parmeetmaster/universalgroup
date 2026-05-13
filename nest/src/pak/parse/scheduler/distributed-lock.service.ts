import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class PakDistributedLockService {
  private readonly logger = new Logger(PakDistributedLockService.name);

  constructor(
    @InjectDataSource('pak') private readonly ds: DataSource,
  ) {}

  async withLock<T>(
    name: string,
    timeoutSec: number,
    work: () => Promise<T>,
  ): Promise<T | undefined> {
    const runner = this.ds.createQueryRunner();
    await runner.connect();
    try {
      const acq = await runner.query(
        `SELECT GET_LOCK(?, ?) AS got`,
        [name, timeoutSec],
      );
      const got = Number(acq?.[0]?.got);
      if (got !== 1) {
        this.logger.debug(`Lock '${name}' not acquired (another runner holds it)`);
        return undefined;
      }
      try {
        return await work();
      } finally {
        await runner
          .query(`SELECT RELEASE_LOCK(?)`, [name])
          .catch((err) =>
            this.logger.warn(`RELEASE_LOCK('${name}') failed: ${err.message}`),
          );
      }
    } finally {
      await runner.release();
    }
  }
}
