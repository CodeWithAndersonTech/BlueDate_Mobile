import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@bluedate/crash_log_v1';
const MAX_ENTRIES = 20;
const MAX_BREADCRUMBS = 40;

export type CrashEntry = {
  id: string;
  at: string;
  kind: 'js_fatal' | 'js_error' | 'render' | 'promise' | 'manual' | 'breadcrumb';
  message: string;
  stack?: string;
  componentStack?: string;
  extras?: Record<string, string>;
};

type CrashListener = (entry: CrashEntry) => void;

const breadcrumbs: CrashEntry[] = [];
let installed = false;
let listeners: CrashListener[] = [];

function nowIso() {
  return new Date().toISOString();
}

function makeId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function serializeUnknown(value: unknown): string {
  if (value instanceof Error) {
    return value.message || value.name || 'Error';
  }
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function stackOf(value: unknown): string | undefined {
  if (value instanceof Error && value.stack) return value.stack;
  return undefined;
}

async function persist(entry: CrashEntry) {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const prev: CrashEntry[] = raw ? (JSON.parse(raw) as CrashEntry[]) : [];
    const next = [entry, ...prev].slice(0, MAX_ENTRIES);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch (err) {
    console.warn('[CrashLog] persist failed', err);
  }
}

function emit(entry: CrashEntry) {
  const tag =
    entry.kind === 'breadcrumb' ? '[Breadcrumb]' : `[CrashLog:${entry.kind}]`;
  // console.error opens RN RedBox — reserve it for real fatals/render errors.
  const printer =
    entry.kind === 'js_fatal' || entry.kind === 'render'
      ? console.error
      : console.warn;
  printer(tag, entry.message, entry.stack ?? '', entry.extras ?? '');
  for (const listener of listeners) {
    try {
      listener(entry);
    } catch {
      // ignore listener failures
    }
  }
}

/** Lightweight trail of last actions — kept in memory for the next crash dump. */
export function breadcrumb(
  message: string,
  extras?: Record<string, string>,
) {
  const entry: CrashEntry = {
    id: makeId(),
    at: nowIso(),
    kind: 'breadcrumb',
    message,
    extras,
  };
  breadcrumbs.unshift(entry);
  if (breadcrumbs.length > MAX_BREADCRUMBS) {
    breadcrumbs.length = MAX_BREADCRUMBS;
  }
  if (__DEV__) {
    console.log('[Breadcrumb]', message, extras ?? '');
  }
}

export async function logCrash(
  kind: Exclude<CrashEntry['kind'], 'breadcrumb'>,
  error: unknown,
  extras?: Record<string, string>,
) {
  const entry: CrashEntry = {
    id: makeId(),
    at: nowIso(),
    kind,
    message: serializeUnknown(error),
    stack: stackOf(error),
    componentStack: extras?.componentStack,
    extras: {
      ...extras,
      recentBreadcrumbs: breadcrumbs
        .slice(0, 12)
        .map(b => `${b.at} ${b.message}`)
        .join(' | '),
    },
  };
  emit(entry);
  await persist(entry);
  return entry;
}

export async function getCrashLogs(): Promise<CrashEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as CrashEntry[];
  } catch {
    return [];
  }
}

export async function getLastCrash(): Promise<CrashEntry | null> {
  const logs = await getCrashLogs();
  return logs[0] ?? null;
}

export async function clearCrashLogs() {
  breadcrumbs.length = 0;
  await AsyncStorage.removeItem(STORAGE_KEY);
}

export function formatCrashEntry(entry: CrashEntry): string {
  const lines = [
    `id: ${entry.id}`,
    `at: ${entry.at}`,
    `kind: ${entry.kind}`,
    `message: ${entry.message}`,
  ];
  if (entry.stack) lines.push(`stack:\n${entry.stack}`);
  if (entry.componentStack) {
    lines.push(`componentStack:\n${entry.componentStack}`);
  }
  if (entry.extras) {
    for (const [key, value] of Object.entries(entry.extras)) {
      if (key === 'componentStack') continue;
      lines.push(`${key}: ${value}`);
    }
  }
  return lines.join('\n');
}

export function onCrashLog(listener: CrashListener) {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter(l => l !== listener);
  };
}

/**
 * Install once at app bootstrap (index.js). Captures fatal/non-fatal JS errors
 * and unhandled promise rejections.
 */
export function installCrashLogging() {
  if (installed) return;
  installed = true;

  const g = globalThis as typeof globalThis & {
    ErrorUtils?: {
      getGlobalHandler: () => (error: Error, isFatal?: boolean) => void;
      setGlobalHandler: (
        handler: (error: Error, isFatal?: boolean) => void,
      ) => void;
    };
    onunhandledrejection?: ((event: {
      reason?: unknown;
      preventDefault?: () => void;
    }) => void) | null;
  };

  const errorUtils = g.ErrorUtils;
  if (errorUtils?.getGlobalHandler && errorUtils?.setGlobalHandler) {
    const previous = errorUtils.getGlobalHandler();
    errorUtils.setGlobalHandler((error, isFatal) => {
      // Persist in background — don't block RN's fatal handler / redbox.
      void logCrash(isFatal ? 'js_fatal' : 'js_error', error, {
        isFatal: String(Boolean(isFatal)),
      });
      previous?.(error, isFatal);
    });
  }

  const previousRejection = g.onunhandledrejection;
  g.onunhandledrejection = event => {
    void logCrash('promise', event?.reason ?? 'unhandledrejection');
    if (typeof previousRejection === 'function') {
      previousRejection(event);
    }
  };

  breadcrumb('crash_logging_installed');
}
