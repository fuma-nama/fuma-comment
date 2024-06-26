import { useEffect } from "react";

export function createListener<Args extends unknown[]>(): {
  trigger: (id: string | number, ...arg: Args) => void;
  useListener: (id: string | number, listener: (...args: Args) => void) => void;
} {
  const listeners = new Map<string | number, ((...args: Args) => void)[]>();

  return {
    trigger(id, ...args): void {
      listeners.get(id)?.forEach((listener) => {
        listener(...args);
      });
    },
    useListener(id, listener) {
      useEffect(() => {
        const list = listeners.get(id) ?? [];
        list.push(listener);
        listeners.set(id, list);

        return () => {
          listeners.set(
            id,
            listeners.get(id)?.filter((item) => item !== listener) ?? [],
          );
        };
      }, [id, listener]);
    },
  };
}
