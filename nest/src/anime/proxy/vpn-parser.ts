import { VpnProtocol } from './entities/vpn-config.entity';

export interface ParsedVpnConfig {
  uri: string;
  protocol: VpnProtocol;
  host: string;
  port: number;
  remark: string | null;
  outbound: Record<string, unknown>;
}

function safeDecodeBase64(input: string): string {
  try {
    // Restore URL-safe base64 and padding before decoding.
    let b64 = input.replace(/-/g, '+').replace(/_/g, '/').trim();
    const pad = b64.length % 4;
    if (pad) b64 += '='.repeat(4 - pad);
    return Buffer.from(b64, 'base64').toString('utf8');
  } catch {
    return '';
  }
}

function safeDecodeUri(value: string | null | undefined): string {
  if (!value) return '';
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function isInvalidHost(host: string): boolean {
  if (!host) return true;
  const h = host.toLowerCase();
  return h.startsWith('http') || h.includes('github.com');
}

function isValidPort(port: number): boolean {
  return Number.isInteger(port) && port > 0 && port <= 65535;
}

/**
 * Builds a partial Xray streamSettings object from network/security params.
 */
function buildStream(
  network: string | undefined,
  security: string | undefined,
  host: string | undefined,
  path: string | undefined,
  sni: string | undefined,
  alpn: string | undefined,
  serviceName: string | undefined,
): Record<string, unknown> {
  const net = network || 'tcp';
  const sec = security || 'none';

  const stream: Record<string, unknown> = {
    network: net,
    security: sec,
  };

  if (sec === 'tls' || sec === 'reality') {
    stream.tlsSettings = {
      serverName: sni || host || '',
      allowInsecure: true,
      alpn: alpn ? alpn.split(',') : undefined,
    };
  }

  if (net === 'ws') {
    stream.wsSettings = {
      path: path || '/',
      headers: { Host: host || sni || '' },
    };
  } else if (net === 'grpc') {
    stream.grpcSettings = {
      serviceName: path || serviceName || '',
    };
  } else if (net === 'h2' || net === 'http') {
    stream.httpSettings = {
      path: path || '/',
      host: host ? [host] : [],
    };
  }

  return stream;
}

function parseVmess(uri: string): ParsedVpnConfig | null {
  const decoded = safeDecodeBase64(uri.slice('vmess://'.length));
  if (!decoded) return null;

  let cfg: Record<string, unknown>;
  try {
    cfg = JSON.parse(decoded);
  } catch {
    return null;
  }

  const host = String(cfg.add ?? '');
  const port = parseInt(String(cfg.port ?? ''), 10);
  if (isInvalidHost(host) || !isValidPort(port)) return null;

  const id = String(cfg.id ?? '');
  if (!id) return null;

  const net = cfg.net ? String(cfg.net) : 'tcp';
  const tls = cfg.tls ? String(cfg.tls) : '';
  const wsHost = cfg.host ? String(cfg.host) : '';
  const path = cfg.path ? String(cfg.path) : '';
  const sni = cfg.sni ? String(cfg.sni) : '';
  const alpn = cfg.alpn ? String(cfg.alpn) : '';
  const type = cfg.type ? String(cfg.type) : '';

  const outbound: Record<string, unknown> = {
    protocol: 'vmess',
    settings: {
      vnext: [
        {
          address: host,
          port,
          users: [
            {
              id,
              alterId: parseInt(String(cfg.aid ?? '0'), 10) || 0,
              security: cfg.scy ? String(cfg.scy) : 'auto',
            },
          ],
        },
      ],
    },
    streamSettings: buildStream(net, tls, wsHost, path, sni, alpn, type),
  };

  return {
    uri,
    protocol: VpnProtocol.VMESS,
    host,
    port,
    remark: cfg.ps ? String(cfg.ps) : null,
    outbound,
  };
}

function parseVless(uri: string): ParsedVpnConfig | null {
  let url: URL;
  try {
    url = new URL(uri);
  } catch {
    return null;
  }

  const id = decodeURIComponent(url.username);
  const host = url.hostname;
  const port = parseInt(url.port, 10);
  if (!id || isInvalidHost(host) || !isValidPort(port)) return null;

  const q = url.searchParams;
  const type = q.get('type') || 'tcp';
  const security = q.get('security') || 'none';
  const wsHost = safeDecodeUri(q.get('host'));
  const path = safeDecodeUri(q.get('path'));
  const sni = safeDecodeUri(q.get('sni'));
  const alpn = safeDecodeUri(q.get('alpn'));
  const serviceName = safeDecodeUri(q.get('serviceName'));
  const flow = q.get('flow') || '';
  const encryption = q.get('encryption') || 'none';

  const outbound: Record<string, unknown> = {
    protocol: 'vless',
    settings: {
      vnext: [
        {
          address: host,
          port,
          users: [
            {
              id,
              encryption,
              flow,
            },
          ],
        },
      ],
    },
    streamSettings: buildStream(type, security, wsHost, path, sni, alpn, serviceName),
  };

  return {
    uri,
    protocol: VpnProtocol.VLESS,
    host,
    port,
    remark: url.hash ? safeDecodeUri(url.hash.slice(1)) : null,
    outbound,
  };
}

function parseTrojan(uri: string): ParsedVpnConfig | null {
  let url: URL;
  try {
    url = new URL(uri);
  } catch {
    return null;
  }

  const password = decodeURIComponent(url.username);
  const host = url.hostname;
  const port = parseInt(url.port, 10);
  if (!password || isInvalidHost(host) || !isValidPort(port)) return null;

  const q = url.searchParams;
  const type = q.get('type') || 'tcp';
  const security = q.get('security') || 'tls';
  const wsHost = safeDecodeUri(q.get('host'));
  const path = safeDecodeUri(q.get('path'));
  const sni = safeDecodeUri(q.get('sni'));
  const alpn = safeDecodeUri(q.get('alpn'));
  const serviceName = safeDecodeUri(q.get('serviceName'));

  const outbound: Record<string, unknown> = {
    protocol: 'trojan',
    settings: {
      servers: [
        {
          address: host,
          port,
          password,
        },
      ],
    },
    streamSettings: buildStream(type, security, wsHost, path, sni, alpn, serviceName),
  };

  return {
    uri,
    protocol: VpnProtocol.TROJAN,
    host,
    port,
    remark: url.hash ? safeDecodeUri(url.hash.slice(1)) : null,
    outbound,
  };
}

function parseShadowsocks(uri: string): ParsedVpnConfig | null {
  // Strip the ss:// scheme and the #remark fragment.
  const hashIdx = uri.indexOf('#');
  const remark = hashIdx >= 0 ? safeDecodeUri(uri.slice(hashIdx + 1)) : null;
  const body = (hashIdx >= 0 ? uri.slice(0, hashIdx) : uri).slice('ss://'.length);

  let method = '';
  let password = '';
  let host = '';
  let port = NaN;

  const atIdx = body.lastIndexOf('@');
  if (atIdx >= 0) {
    // Format: ss://BASE64(method:password)@host:port
    const userPart = body.slice(0, atIdx);
    const hostPart = body.slice(atIdx + 1);

    const decodedUser = safeDecodeBase64(userPart);
    const userStr = decodedUser.includes(':') ? decodedUser : safeDecodeUri(userPart);
    const colonIdx = userStr.indexOf(':');
    if (colonIdx < 0) return null;
    method = userStr.slice(0, colonIdx);
    password = userStr.slice(colonIdx + 1);

    const hostColon = hostPart.lastIndexOf(':');
    if (hostColon < 0) return null;
    host = hostPart.slice(0, hostColon);
    port = parseInt(hostPart.slice(hostColon + 1), 10);
  } else {
    // Format: ss://BASE64(method:password@host:port)
    const decoded = safeDecodeBase64(body);
    const at = decoded.lastIndexOf('@');
    if (at < 0) return null;
    const userStr = decoded.slice(0, at);
    const hostPart = decoded.slice(at + 1);

    const colonIdx = userStr.indexOf(':');
    if (colonIdx < 0) return null;
    method = userStr.slice(0, colonIdx);
    password = userStr.slice(colonIdx + 1);

    const hostColon = hostPart.lastIndexOf(':');
    if (hostColon < 0) return null;
    host = hostPart.slice(0, hostColon);
    port = parseInt(hostPart.slice(hostColon + 1), 10);
  }

  if (!method || !password || isInvalidHost(host) || !isValidPort(port)) return null;

  const outbound: Record<string, unknown> = {
    protocol: 'shadowsocks',
    settings: {
      servers: [
        {
          address: host,
          port,
          method,
          password,
        },
      ],
    },
  };

  return {
    uri,
    protocol: VpnProtocol.SHADOWSOCKS,
    host,
    port,
    remark,
    outbound,
  };
}

/**
 * Parses any supported config URI and builds a complete Xray outbound object.
 * Returns null for unsupported or invalid configs.
 */
export function parseConfigUri(rawUri: string): ParsedVpnConfig | null {
  const uri = rawUri.trim();
  try {
    if (uri.startsWith('vmess://')) return parseVmess(uri);
    if (uri.startsWith('vless://')) return parseVless(uri);
    if (uri.startsWith('trojan://')) return parseTrojan(uri);
    if (uri.startsWith('ss://')) return parseShadowsocks(uri);
  } catch {
    return null;
  }
  return null;
}
