import type { EditResult } from '@toastwrite/parser';
import type {
  EditorEventMap,
  EditorEventName,
  EditorPluginContext,
  EventHandler,
} from '../types.js';
import { EventBus } from './event-bus.js';
import { ContentService } from '../services/content-service.js';
import { PreviewService } from '../services/preview-service.js';

export interface EditorContextOptions {
  frontMatter?: boolean;
  referenceDefinition?: boolean;
  initialValue?: string;
}

export class EditorContext implements EditorPluginContext {
  readonly events = new EventBus();
  readonly content: ContentService;
  readonly preview: PreviewService;
  private previewHooks: Array<(html: string) => string> = [];

  constructor(options: EditorContextOptions = {}) {
    this.content = new ContentService({
      initialValue: options.initialValue,
      frontMatter: options.frontMatter,
      referenceDefinition: options.referenceDefinition,
    });
    this.preview = new PreviewService();
  }

  addPreviewHook(hook: (html: string) => string): void {
    this.previewHooks.push(hook);
  }

  applyPreviewHooks(html: string): string {
    let result = html;
    for (const hook of this.previewHooks) {
      result = hook(result);
    }
    return result;
  }

  getPreviewHtml(): string {
    const html = this.applyPreviewHooks(this.preview.render(this.content.getToastMark()));
    this.events.emit('beforePreviewRender', html);
    return html;
  }

  updatePreview(
    previewEl: HTMLElement,
    editResults: EditResult[]
  ): 'partial' | 'full' {
    const mode = this.preview.updatePreview(
      previewEl,
      editResults,
      this.content.getToastMark(),
      (html) => this.applyPreviewHooks(html)
    );
    this.events.emit('beforePreviewRender', previewEl.innerHTML);
    return mode;
  }

  getMarkdown(): string {
    return this.content.getMarkdown();
  }

  setMarkdown(markdown: string): void {
    this.content.setMarkdown(markdown);
    this.events.emit('change');
  }

  on<T extends EditorEventName>(
    event: T,
    handler: EventHandler<EditorEventMap[T]>
  ): () => void {
    return this.events.on(event, handler);
  }

  off<T extends EditorEventName>(
    event: T,
    handler: EventHandler<EditorEventMap[T]>
  ): void {
    this.events.off(event, handler);
  }

  destroy(): void {
    this.events.clear();
    this.previewHooks = [];
  }
}
