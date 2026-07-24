import type { EditorPlugin, EditorPluginContext } from '../types.js';

export class PluginManager {
  private teardowns: Array<() => void> = [];

  register(plugins: EditorPlugin[], context: EditorPluginContext): void {
    plugins.forEach((plugin) => {
      const teardown = plugin.setup?.(context);
      if (typeof teardown === 'function') {
        this.teardowns.push(teardown);
      }
    });
  }

  destroy(): void {
    this.teardowns.forEach((teardown) => teardown());
    this.teardowns = [];
  }
}
