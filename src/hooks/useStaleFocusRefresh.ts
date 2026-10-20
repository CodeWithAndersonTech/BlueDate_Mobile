import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useRef } from 'react';

/**
 * Re-run `load` on focus, but skip a blocking refresh when data is still fresh.
 * Callers should treat `{ silent: true }` as “update in place, no spinner”.
 */
export function useStaleFocusRefresh(
  load: (opts: { silent: boolean }) => void | Promise<void>,
  staleMs = 25_000,
) {
  const lastAt = useRef(0);

  useFocusEffect(
    useCallback(() => {
      const silent = lastAt.current > 0 && Date.now() - lastAt.current < staleMs;
      void Promise.resolve(load({ silent })).finally(() => {
        lastAt.current = Date.now();
      });
    }, [load, staleMs]),
  );
}
