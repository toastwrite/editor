import type { EditorEventMap, EditorEventName, EventHandler, ViewerOptions } from './types.js';
import { EditorContext } from './core/editor-context.js';
import { PluginManager } from './core/plugin-manager.js';
import { resolveViewerOptions } from './core/options.js';
import { createViewerLayout } from './ui/layout.js';

export class Viewer {
  static isViewer = true;

  private options: ReturnType<typeof resolveViewerOptions>;
  private context: EditorContext;
  private plugins = new PluginManager();
  private root: HTMLElement;
  private eventUnsubscribers: Array<() => void> = [];

  constructor(options: ViewerOptions) {
    this.options = resolveViewerOptions(options);
    this.context = new EditorContext({
      initialValue: this.options.initialValue,
      frontMatter: this.options.frontMatter,
      referenceDefinition: this.options.referenceDefinition,
    });

    this.registerEventHandlers(this.options.events);
    this.root = createViewerLayout(this.options);
    this.render();

    this.plugins.register(this.options.plugins, this.context);
    this.context.events.emit('load');
  }

  setMarkdown(markdown: string): void {
    this.context.setMarkdown(markdown);
    this.render();
  }

  getMarkdown(): string {
    return this.context.getMarkdown();
  }

  on<T extends EditorEventName>(event: T, handler: EventHandler<import('./types.js').EditorEventMap[T]>): void {
    this.context.on(event, handler);
  }

  off<T extends EditorEventName>(event: T, handler: EventHandler<import('./types.js').EditorEventMap[T]>): void {
    this.context.off(event, handler);
  }

  destroy(): void {
    this.eventUnsubscribers.forEach((unsub) => unsub());
    this.plugins.destroy();
    this.context.destroy();
    this.root.remove();
  }

  private render(): void {
    this.root.innerHTML = this.context.getPreviewHtml();
  }

  private registerEventHandlers(events: ViewerOptions['events']): void {
    if (!events) {
      return;
    }

    (Object.keys(events) as EditorEventName[]).forEach((eventName) => {
      const handler = events[eventName];
      if (handler && eventName !== 'beforePreviewRender') {
        this.eventUnsubscribers.push(
          this.context.on(
            eventName,
            handler as EventHandler<Exclude<EditorEventMap[typeof eventName], string>>
          )
        );
      }
    });
  }
}
