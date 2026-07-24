import type { CommandId } from '../commands/types.js';
import type { EditorOptions, ViewerOptions } from '../types.js';

const DEFAULT_HEIGHT = '300px';
const DEFAULT_MIN_HEIGHT = '200px';

export type ResolvedEditorOptions = Required<
  Omit<
    EditorOptions,
    'events' | 'plugins' | 'el' | 'beforePreviewRender' | 'toolbarItems'
  >
> & {
  el: HTMLElement;
  events: EditorOptions['events'];
  plugins: NonNullable<EditorOptions['plugins']>;
  beforePreviewRender?: EditorOptions['beforePreviewRender'];
  toolbarItems?: CommandId[];
};

export type ResolvedViewerOptions = Required<
  Omit<ViewerOptions, 'events' | 'plugins' | 'el'>
> & {
  el: HTMLElement;
  events: ViewerOptions['events'];
  plugins: NonNullable<ViewerOptions['plugins']>;
};

export function resolveEditorOptions(options: EditorOptions): ResolvedEditorOptions {
  return {
    el: options.el,
    initialValue: options.initialValue ?? '',
    height: options.height ?? DEFAULT_HEIGHT,
    minHeight: options.minHeight ?? DEFAULT_MIN_HEIGHT,
    placeholder: options.placeholder ?? '',
    previewStyle: options.previewStyle ?? 'vertical',
    hideToolbar: options.hideToolbar ?? false,
    toolbarItems: options.toolbarItems,
    previewSplitter: options.previewSplitter ?? false,
    scrollSync: options.scrollSync ?? true,
    theme: options.theme ?? 'light',
    frontMatter: options.frontMatter ?? false,
    referenceDefinition: options.referenceDefinition ?? false,
    beforePreviewRender: options.beforePreviewRender,
    events: options.events,
    plugins: options.plugins ?? [],
  };
}

export function resolveViewerOptions(options: ViewerOptions): ResolvedViewerOptions {
  return {
    el: options.el,
    initialValue: options.initialValue ?? '',
    height: options.height ?? DEFAULT_HEIGHT,
    minHeight: options.minHeight ?? DEFAULT_MIN_HEIGHT,
    placeholder: options.placeholder ?? '',
    theme: options.theme ?? 'light',
    frontMatter: options.frontMatter ?? false,
    referenceDefinition: options.referenceDefinition ?? false,
    events: options.events,
    plugins: options.plugins ?? [],
  };
}
