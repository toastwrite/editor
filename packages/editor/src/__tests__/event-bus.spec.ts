import { describe, expect, it, vi } from 'vitest';
import { EventBus } from '../core/event-bus.js';

describe('EventBus', () => {
  it('subscribes and emits typed events', () => {
    const bus = new EventBus();
    const handler = vi.fn();

    bus.on('change', handler);
    bus.emit('change');

    expect(handler).toHaveBeenCalledWith(undefined);
  });

  it('unsubscribes with returned disposer', () => {
    const bus = new EventBus();
    const handler = vi.fn();

    const unsubscribe = bus.on('load', handler);
    unsubscribe();
    bus.emit('load');

    expect(handler).not.toHaveBeenCalled();
  });
});
