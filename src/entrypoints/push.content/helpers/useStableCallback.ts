import { useCallback, useLayoutEffect, useRef } from 'react';

/**
 * Returns a function whose identity never changes but always calls the latest `fn`.
 * Lets memoized children (e.g. table rows) skip re-renders even when the parent
 * recreates its handlers on every render.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useStableCallback<T extends (...args: any[]) => any>(fn: T): T {
  const ref = useRef(fn);

  useLayoutEffect(() => {
    ref.current = fn;
  });

  return useCallback(((...args: Parameters<T>) => ref.current(...args)) as T, []);
}
