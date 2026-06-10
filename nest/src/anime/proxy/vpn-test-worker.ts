/**
 * Standalone worker process for VPN config validation.
 *
 * Spawning xray and doing timed HTTP requests inside the main API event loop
 * starves the timers/sockets (the loop is busy serving requests + other crons),
 * which made every config look dead. Running the tests in a dedicated forked
 * process gives them their own event loop, so timing is accurate.
 *
 * Protocol: parent sends { xrayPath, configs: [{id, host, port, outbound}] }
 * via IPC; worker replies { results: [{id, ok, speed}] } and exits.
 */
import { spawn } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as net from 'net';
import axios from 'axios';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { HttpsProxyAgent } = require('https-proxy-agent');

const TEST_URLS = [
  'https://www.gstatic.com/generate_204',
  'https://example.com/',
];
const READY_TIMEOUT_MS = 4000;
const REQUEST_TIMEOUT_MS = 9000;
const TCP_TIMEOUT_MS = 4000;
const CONCURRENCY = 12;

interface TestConfig {
  id: number;
  host: string;
  port: number;
  outbound: Record<string, unknown>;
}

let XRAY = '';

function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.unref();
    srv.on('error', reject);
    srv.listen(0, '127.0.0.1', () => {
      const port = (srv.address() as net.AddressInfo).port;
      srv.close(() => resolve(port));
    });
  });
}

function tcpReachable(host: string, port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let settled = false;
    const done = (ok: boolean) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve(ok);
    };
    socket.setTimeout(TCP_TIMEOUT_MS);
    socket.once('connect', () => done(true));
    socket.once('timeout', () => done(false));
    socket.once('error', () => done(false));
    try {
      socket.connect(port, host);
    } catch {
      done(false);
    }
  });
}

function waitReady(port: number, timeoutMs: number): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve) => {
    const attempt = () => {
      const sock = new net.Socket();
      sock.setTimeout(800);
      sock.once('connect', () => {
        sock.destroy();
        resolve(true);
      });
      const retry = () => {
        sock.destroy();
        if (Date.now() >= deadline) resolve(false);
        else setTimeout(attempt, 150);
      };
      sock.once('timeout', retry);
      sock.once('error', retry);
      sock.connect(port, '127.0.0.1');
    };
    attempt();
  });
}

async function testOne(
  cfg: TestConfig,
): Promise<{ id: number; ok: boolean; speed: number }> {
  // Stage 1: cheap TCP reachability.
  const reachable = await tcpReachable(cfg.host, cfg.port);
  if (!reachable) return { id: cfg.id, ok: false, speed: 0 };

  // Stage 2: real tunnel test through xray (must reach every target).
  let port: number;
  try {
    port = await freePort();
  } catch {
    return { id: cfg.id, ok: false, speed: 0 };
  }

  const xcfg = {
    log: { loglevel: 'none' },
    inbounds: [
      {
        tag: 'in',
        port,
        listen: '127.0.0.1',
        protocol: 'http',
        sniffing: { enabled: true, destOverride: ['http', 'tls'] },
        settings: {},
      },
    ],
    outbounds: [
      { ...cfg.outbound, tag: 'proxy_out' },
      { tag: 'direct', protocol: 'freedom', settings: {} },
    ],
    routing: {
      rules: [{ type: 'field', inboundTag: ['in'], outboundTag: 'proxy_out' }],
    },
  };

  const file = path.join(os.tmpdir(), `vpn-w-${port}.json`);
  fs.writeFileSync(file, JSON.stringify(xcfg));
  const proc = spawn(XRAY, ['run', '-c', file], { stdio: 'ignore' });
  const start = Date.now();
  let ok = false;

  try {
    const ready = await waitReady(port, READY_TIMEOUT_MS);
    if (!ready) throw new Error('not ready');
    const agent = new HttpsProxyAgent(`http://127.0.0.1:${port}`);
    for (const url of TEST_URLS) {
      await axios.get(url, {
        httpAgent: agent,
        httpsAgent: agent,
        timeout: REQUEST_TIMEOUT_MS,
        validateStatus: (s: number) => s >= 200 && s < 400,
        maxRedirects: 1,
      });
    }
    ok = true;
  } catch {
    ok = false;
  } finally {
    try {
      proc.kill('SIGKILL');
    } catch {
      // already gone
    }
    fs.rm(file, { force: true }, () => undefined);
  }

  return { id: cfg.id, ok, speed: ok ? Date.now() - start : 0 };
}

async function runBatch(
  configs: TestConfig[],
): Promise<{ id: number; ok: boolean; speed: number }[]> {
  const results: { id: number; ok: boolean; speed: number }[] = [];
  for (let i = 0; i < configs.length; i += CONCURRENCY) {
    const slice = configs.slice(i, i + CONCURRENCY);
    const r = await Promise.all(slice.map(testOne));
    results.push(...r);
  }
  return results;
}

process.on(
  'message',
  async (msg: { xrayPath: string; configs: TestConfig[] }) => {
    try {
      XRAY = msg.xrayPath;
      const results = await runBatch(msg.configs || []);
      process.send?.({ results });
    } catch {
      process.send?.({ results: [] });
    } finally {
      process.exit(0);
    }
  },
);
