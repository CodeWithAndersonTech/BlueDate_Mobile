import { Image } from 'react-native';

/** Background warm only — never hold first paint this long. */
const PREFETCH_MS = 2000;

function isPrefetchable(uri: string): boolean {
  return (
    /^https?:\/\//i.test(uri) ||
    uri.startsWith('file://') ||
    uri.startsWith('data:image/')
  );
}

function waitForUri(uri: string, timeoutMs: number): Promise<void> {
  if (!isPrefetchable(uri)) {
    return Promise.resolve();
  }
  return new Promise(resolve => {
    let settled = false;
    const done = () => {
      if (settled) return;
      settled = true;
      resolve();
    };
    const timer = setTimeout(done, timeoutMs);
    try {
      Image.prefetch(uri)
        .then(() => {
          try {
            Image.getSize(
              uri,
              () => {
                clearTimeout(timer);
                done();
              },
              () => {
                clearTimeout(timer);
                done();
              },
            );
          } catch {
            clearTimeout(timer);
            done();
          }
        })
        .catch(() => {
          clearTimeout(timer);
          done();
        });
    } catch {
      clearTimeout(timer);
      done();
    }
  });
}

/** Block until each URI is in the image cache (or the per-image timeout fires). */
export async function prefetchMediaUris(
  uris: Array<string | null | undefined>,
  timeoutMs = PREFETCH_MS,
): Promise<void> {
  const unique = [...new Set(uris.filter((u): u is string => !!u))];
  if (unique.length === 0) return;
  await Promise.all(unique.map(uri => waitForUri(uri, timeoutMs)));
}
