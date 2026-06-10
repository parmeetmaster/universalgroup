import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { execSync, fork } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as net from 'net';

export interface BatchTestConfig {
  id: number;
  host: string;
  port: number;
  outbound: Record<string, unknown>;
}
export interface BatchTestResult {
  id: number;
  ok: boolean;
  speed: number;
}

const XRAY_URL =
  'https://github.com/XTLS/Xray-core/releases/latest/download/Xray-linux-64.zip';

/**
 * Validates a VPN config the only way that actually matters: it runs the config
 * as an Xray outbound and fetches a URL through it. A config whose port is open
 * but whose protocol handshake / credentials are dead (very common with free
 * Cloudflare-fronted configs) is correctly rejected. Self-installs the xray
 * binary on first use so it survives deploys (dist/ is rsynced, bin/ is not).
 */
@Injectable()
export class XrayTesterService implements OnModuleInit {
  private readonly logger = new Logger(XrayTesterService.name);
  private xrayPath = '';
  private ready = false;

  async onModuleInit() {
    try {
      this.xrayPath = this.ensureXray();
      this.ready = true;
      this.logger.log(`Xray tester ready: ${this.xrayPath}`);
    } catch (e) {
      this.logger.error(`Xray tester init failed: ${(e as Error).message}`);
    }
  }

  isReady(): boolean {
    return this.ready;
  }

  private ensureXray(): string {
    const binDir = path.join(process.cwd(), 'bin');
    const bin = path.join(binDir, 'xray');
    if (fs.existsSync(bin)) return bin;

    fs.mkdirSync(binDir, { recursive: true });
    const zip = path.join(binDir, 'xray.zip');
    execSync(`curl -sL -o "${zip}" "${XRAY_URL}"`, { timeout: 120000 });
    execSync(`unzip -o -q "${zip}" xray -d "${binDir}"`, { timeout: 60000 });
    fs.chmodSync(bin, 0o755);
    fs.rmSync(zip, { force: true });
    return bin;
  }

  /**
   * Tests a batch of configs in a dedicated forked process. Running xray spawns
   * and timed requests off the main API event loop is essential — in-process
   * tests were starved by the busy loop and every config looked dead.
   */
  testBatch(configs: BatchTestConfig[]): Promise<BatchTestResult[]> {
    if (!this.ready || configs.length === 0) return Promise.resolve([]);

    return new Promise((resolve) => {
      const workerPath = path.join(__dirname, 'vpn-test-worker.js');
      const worker = fork(workerPath, [], {
        stdio: ['ignore', 'ignore', 'ignore', 'ipc'],
      });
      let done = false;

      const finish = (results: BatchTestResult[]) => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        try {
          worker.kill('SIGKILL');
        } catch {
          // already gone
        }
        resolve(results);
      };

      // Hard ceiling so a stuck worker never hangs a validation run.
      const timer = setTimeout(
        () => finish([]),
        configs.length * 1500 + 60000,
      );

      worker.on('message', (m: { results?: BatchTestResult[] }) =>
        finish(m?.results ?? []),
      );
      worker.on('error', () => finish([]));
      worker.on('exit', () => finish([]));

      worker.send({ xrayPath: this.xrayPath, configs });
    });
  }
}
