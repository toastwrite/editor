import { afterEach, describe, expect, it, vi } from 'vitest';
import { EditorContext } from '../core/editor-context.js';
import { PASTE_META, createMarkdownView } from '../markdown/create-markdown-view.js';
import {
  docToMarkdown,
  markdownToDoc,
  replaceDocumentFromMarkdown,
} from '../markdown/doc-bridge.js';
import { MarkdownMode } from '../modes/markdown-mode.js';

describe('paste preview sync', () => {
  let mount: HTMLDivElement;

  afterEach(() => {
    mount?.remove();
  });

  it('updates content and preview when pasted markdown replaces the document', () => {
    const initialMarkdown = '# Initial title';
    const pastedMarkdown = '# Replaced title\n\nNew body content';
    const context = new EditorContext({ initialValue: initialMarkdown });
    const previewEl = document.createElement('div');
    previewEl.innerHTML = context.getPreviewHtml();

    mount = document.createElement('div');
    document.body.appendChild(mount);

    const mode = new MarkdownMode(context, 'vertical');
    (mode as unknown as { previewEl: HTMLElement }).previewEl = previewEl;

    const onChange = vi.fn();
    const view = createMarkdownView({
      mount,
      doc: markdownToDoc(initialMarkdown),
      onDocumentEdit: (change) =>
        (
          mode as unknown as {
            handleDocumentEdit: (value: typeof change) => ReturnType<MarkdownMode['handleDocumentEdit']>;
          }
        ).handleDocumentEdit(change),
      onChange,
    });

    expect(context.getMarkdown()).toBe(initialMarkdown);
    expect(previewEl.textContent).toContain('Initial title');

    const pasteTr = replaceDocumentFromMarkdown(
      view.state.tr,
      pastedMarkdown,
      { start: pastedMarkdown.length, end: pastedMarkdown.length }
    ).setMeta(PASTE_META, true);

    view.dispatch(pasteTr);

    expect(context.getMarkdown()).toBe(pastedMarkdown);
    expect(previewEl.textContent).toContain('Replaced title');
    expect(previewEl.textContent).toContain('New body content');
    expect(onChange).toHaveBeenCalled();
    expect(docToMarkdown(view.state.doc)).toBe(pastedMarkdown);
  });
});
