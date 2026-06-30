import { Injectable, Logger } from '@nestjs/common';
import { ISourceDriver } from './source-driver.interface';

@Injectable()
export class DriverRegistryService {
  private readonly logger = new Logger(DriverRegistryService.name);
  private readonly drivers = new Map<string, ISourceDriver>();

  register(driver: ISourceDriver): void {
    this.drivers.set(driver.driverSlug, driver);
    this.logger.log(`Registered driver: ${driver.driverSlug}`);
  }

  get(driverSlug: string): ISourceDriver | undefined {
    return this.drivers.get(driverSlug);
  }

  getOrThrow(driverSlug: string): ISourceDriver {
    const d = this.drivers.get(driverSlug);
    if (!d) throw new Error(`No driver registered for '${driverSlug}'`);
    return d;
  }

  all(): ISourceDriver[] {
    return [...this.drivers.values()];
  }

  slugs(): string[] {
    return [...this.drivers.keys()];
  }
}
