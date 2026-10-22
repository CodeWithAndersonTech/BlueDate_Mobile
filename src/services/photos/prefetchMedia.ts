import { Image } from 'react-native';

const PREFETCH_MS = 2500;

/** Warm image cache so the profile screen can paint without empty holes. */
export async function prefetchMediaUris(
  uris: Array<string | null | undefined>,
  timeoutMs = PREFETCH_MS,
): Promise<void> {
  const unique = [...new Set(uris.filter((u): u is string => !!u))];
  if (unique.length === 0) return;

  await Promise.race([
    Promise.all(unique.map(uri => Image.prefetch(uri).catch(() => false))),
    new Promise<void>(resolve => {
      setTimeout(resolve, timeoutMs);
    }),
  ]);
}
