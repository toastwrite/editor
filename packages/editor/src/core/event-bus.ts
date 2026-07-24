import type { EditorEventMap, EditorEventName, EventHandler } from '../types.js';

export class EventBus {
  private handlers = new Map<EditorEventName, Set<EventHandler<EditorEventMap[EditorEventName]>>>();

  on<T extends EditorEventName>(event: T, handler: EventHandler<EditorEventMap[T]>): () => void {
    const set = this.handlers.get(event) ?? new Set();
    set.add(handler as EventHandler<EditorEventMap[EditorEventName]>);
    this.handlers.set(event, set);
    return () => this.off(event, handler);
  }

  off<T extends EditorEventName>(event: T, handler: EventHandler<EditorEventMap[T]>): void {
    this.handlers.get(event)?.delete(handler as EventHandler<EditorEventMap[EditorEventName]>);
  }

  emit<T extends EditorEventName>(
    event: T,
    ...args: EditorEventMap[T] extends void ? [] : [EditorEventMap[T]]
  ): void {
    const payload = args[0] as EditorEventMap[T];
    this.handlers.get(event)?.forEach((handler) => {
      (handler as (value: EditorEventMap[T]) => void)(payload);
    });
  }

  clear(): void {
    this.handlers.clear();
  }
}
