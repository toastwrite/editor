import type { ResolvedEditorOptions } from '../core/options.js';

export interface EditorLayout {
  root: HTMLElement;
  toolbar: HTMLElement;
  body: HTMLElement;
}

export function createEditorLayout(options: ResolvedEditorOptions): EditorLayout {
  const root = document.createElement('div');
  root.className = `toastwrite-editor toastwrite-editor-theme-${options.theme}`;

  const toolbar = document.createElement('div');
  toolbar.className = 'toastwrite-editor-toolbar';
  toolbar.setAttribute('role', 'toolbar');
  toolbar.hidden = options.hideToolbar;

  const body = document.createElement('div');
  body.className = 'toastwrite-editor-body';

  root.style.height = options.height;
  root.style.minHeight = options.minHeight;

  root.append(toolbar, body);
  options.el.appendChild(root);

  return { root, toolbar, body };
}

export function createViewerLayout(options: {
  el: HTMLElement;
  height: string;
  minHeight: string;
  theme: 'light' | 'dark';
}): HTMLElement {
  const root = document.createElement('div');
  root.className = `toastwrite-editor-viewer toastwrite-editor-theme-${options.theme} toastwrite-editor-contents`;
  root.style.height = options.height;
  root.style.minHeight = options.minHeight;
  options.el.appendChild(root);
  return root;
}
