import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Always call the latest rendered callback
 *
 * For instance, you added a `onClick` listener to button. When the listener is re-constructed in the next render, the new listener will called instead
 */
export function useLatestCallback<T extends (...args: never[]) => unknown>(
  latest: T,
): T {
  const ref = useRef<T>(latest);
  ref.current = latest;

  return useCallback(((...args) => ref.current(...args)) as T, []);
}

export function useObjectURL(value: Blob | MediaSource | null): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    const created = value ? URL.createObjectURL(value) : null;

    setUrl(created);
    return () => {
      if (created) URL.revokeObjectURL(created);
    };
  }, [value]);

  return url;
}
