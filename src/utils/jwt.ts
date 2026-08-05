/** Lightweight JWT payload decode (no signature verify — server validates). */
export function decodeJwtPayload(
  token: string | null | undefined,
): Record<string, unknown> | null {
  if (!token || token.startsWith('demo-token-')) {
    return null;
  }

  const parts = token.split('.');
  if (parts.length < 2) {
    return null;
  }

  try {
    const normalized = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
    // atob is available in RN Hermes / JSC
    const json = globalThis.atob(padded);
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** True when exp claim is missing or already past (with small skew). */
export function isJwtExpired(
  token: string | null | undefined,
  skewSeconds = 30,
): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload) {
    return true;
  }
  const exp = payload.exp;
  if (typeof exp !== 'number') {
    return true;
  }
  return exp * 1000 <= Date.now() + skewSeconds * 1000;
}
