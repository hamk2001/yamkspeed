import type { EngineEventMap } from './types';

type Listener = (...args: unknown[]) => void;

export class TypedEventEmitter {
  private listeners = new Map<keyof EngineEventMap, Set<Listener>>();

  on<E extends keyof EngineEventMap>(event: E, cb: EngineEventMap[E]): () => void {
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set<Listener>();
      this.listeners.set(event, set);
    }
    set.add(cb as unknown as Listener);

    return () => {
      this.off(event, cb);
    };
  }

  off<E extends keyof EngineEventMap>(event: E, cb: EngineEventMap[E]): void {
    const set = this.listeners.get(event);
    if (set) {
      set.delete(cb as unknown as Listener);
      if (set.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  emit<E extends keyof EngineEventMap>(
    event: E,
    ...args: Parameters<EngineEventMap[E]>
  ): void {
    const set = this.listeners.get(event);
    if (set) {
      set.forEach((cb) => {
        try {
          cb(...(args as unknown[]));
        } catch (err) {
          console.error(`[EngineEventEmitter] Error in listener for "${String(event)}":`, err);
        }
      });
    }
  }

  removeAllListeners(): void {
    this.listeners.clear();
  }
}
