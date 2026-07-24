export type PreviewStyle = 'tab' | 'vertical';

export type { CommandId } from './commands/types.js';

export interface EditorEventMap {
  load: void;
  change: void;
  focus: void;
  blur: void;
  caretChange: void;
  beforePreviewRender: string;
}

export type EditorEventName = keyof EditorEventMap;

export type EventHandler<T> = T extends void ? () => void : (payload: T) => void;

export interface EditorPluginContext {
  getMarkdown(): string;
  setMarkdown(markdown: string): void;
  on<T extends EditorEventName>(event: T, handler: EventHandler<EditorEventMap[T]>): () => void;
  off<T extends EditorEventName>(event: T, handler: EventHandler<EditorEventMap[T]>): void;
}

export interface EditorPlugin {
  name: string;
  setup?(context: EditorPluginContext): void | (() => void);
}

export interface BaseEditorOptions {
  el: HTMLElement;
  initialValue?: string;
  height?: string;
  minHeight?: string;
  placeholder?: string;
  plugins?: EditorPlugin[];
  events?: Partial<{ [K in EditorEventName]: EventHandler<EditorEventMap[K]> }>;
  theme?: 'light' | 'dark';
  frontMatter?: boolean;
  referenceDefinition?: boolean;
}

import type { CommandId } from './commands/types.js';

export interface EditorOptions extends BaseEditorOptions {
  previewStyle?: PreviewStyle;
  hideToolbar?: boolean;
  toolbarItems?: CommandId[];
  previewSplitter?: boolean;
  scrollSync?: boolean;
  beforePreviewRender?: (html: string) => string;
}

export interface ViewerOptions extends BaseEditorOptions {}

export interface SelectionPos {
  start: number;
  end: number;
}
