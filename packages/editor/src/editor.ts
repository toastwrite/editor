import type {
  CommandId,
  EditorEventMap,
  EditorEventName,
  EditorOptions,
  EventHandler,
  SelectionPos,
} from './types.js';
import { EditorContext } from './core/editor-context.js';
import { PluginManager } from './core/plugin-manager.js';
import { resolveEditorOptions } from './core/options.js';
import { MarkdownMode } from './modes/markdown-mode.js';
import { createEditorLayout } from './ui/layout.js';
import { createCommandController } from './ui/command-controller.js';
import type { CommandController } from './ui/command-controller.js';
import { Viewer } from './viewer.js';

export class Editor {
  private options: ReturnType<typeof resolveEditorOptions>;
  private context: EditorContext;
  private plugins = new PluginManager();
  private layout: ReturnType<typeof createEditorLayout>;
  private markdownMode: MarkdownMode;
  private eventUnsubscribers: Array<() => void> = [];
  private commandController: CommandController | null = null;

  constructor(options: EditorOptions) {
    this.options = resolveEditorOptions(options);
    this.context = new EditorContext({
      initialValue: this.options.initialValue,
      frontMatter: this.options.frontMatter,
      referenceDefinition: this.options.referenceDefinition,
    });

    this.registerEventHandlers(this.options.events);
    if (options.beforePreviewRender) {
      this.context.addPreviewHook(options.beforePreviewRender);
    }

    this.layout = createEditorLayout(this.options);
    this.markdownMode = new MarkdownMode(
      this.context,
      this.options.previewStyle,
      this.options.previewSplitter,
      this.options.scrollSync
    );
    this.markdownMode.mount(this.layout.body);
    this.markdownMode.activate();

    if (!this.options.hideToolbar) {
      this.commandController = createCommandController({
        toolbarEl: this.layout.toolbar,
        rootEl: this.layout.root,
        toolbarItems: this.options.toolbarItems,
        previewStyle: this.options.previewStyle,
        scrollSync: this.options.scrollSync,
        onExecute: (commandId) => this.executeCommand(commandId),
        canExecute: (commandId) => this.markdownMode.canExecuteCommand(commandId),
        getScrollSyncEnabled: () => this.markdownMode.getScrollSyncEnabled(),
        setScrollSyncEnabled: (enabled) => this.markdownMode.setScrollSyncEnabled(enabled),
        getLinkPopupInitialValues: () => this.markdownMode.getLinkPopupInitialValues(),
        onInsertLink: (url, linkText) => this.markdownMode.insertLink(url, linkText),
      });
    }

    this.plugins.register(this.options.plugins, this.context);
    this.context.events.emit('load');
  }

  static factory(options: EditorOptions & { viewer?: boolean }): Editor | Viewer {
    if (options.viewer) {
      const { viewer: _viewer, ...viewerOptions } = options;
      return new Viewer(viewerOptions);
    }
    const { viewer: _viewer, ...editorOptions } = options;
    return new Editor(editorOptions);
  }

  getMarkdown(): string {
    return this.context.getMarkdown();
  }

  setMarkdown(markdown: string, cursorToEnd = false): void {
    this.context.setMarkdown(markdown);
    this.markdownMode.syncFromContext();
    if (cursorToEnd) {
      const length = markdown.length;
      this.markdownMode.setSelection({ start: length, end: length });
    }
  }

  getHTML(): string {
    return this.context.getPreviewHtml();
  }

  getSelection(): SelectionPos {
    return this.markdownMode.getSelection();
  }

  setSelection(selection: SelectionPos): void {
    this.markdownMode.setSelection(selection);
  }

  executeCommand(commandId: CommandId): boolean {
    return this.markdownMode.executeCommand(commandId);
  }

  on<T extends EditorEventName>(event: T, handler: EventHandler<EditorEventMap[T]>): void {
    this.context.on(event, handler);
  }

  off<T extends EditorEventName>(event: T, handler: EventHandler<EditorEventMap[T]>): void {
    this.context.off(event, handler);
  }

  destroy(): void {
    this.eventUnsubscribers.forEach((unsub) => unsub());
    this.commandController?.destroy();
    this.markdownMode.destroy();
    this.plugins.destroy();
    this.context.destroy();
    this.layout.root.remove();
  }

  private registerEventHandlers(events: EditorOptions['events']): void {
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
