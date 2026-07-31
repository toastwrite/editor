import { afterEach, describe, expect, it, vi } from 'vitest';
import { TextSelection } from 'prosemirror-state';
import type { EditResult } from '@toastwrite/parser';
import { EditorContext } from '../core/editor-context.js';
import { createMarkdownView } from '../markdown/create-markdown-view.js';
import { markdownToDoc } from '../markdown/doc-bridge.js';
import { MarkdownMode } from '../modes/markdown-mode.js';
import { PreviewService } from '../services/preview-service.js';

function createLargeMarkdown(lineCount: number): string {
  return Array.from({ length: lineCount }, (_, index) => `Line ${index + 1}`).join('\n\n');
}

describe('preview incremental updates for large documents', () => {
  let mount: HTMLDivElement;

  afterEach(() => {
    mount?.remove();
  });

  it('uses partial preview updates when typing in a large document', () => {
    const initialMarkdown = createLargeMarkdown(200);
    const context = new EditorContext({ initialValue: initialMarkdown });
    const previewEl = document.createElement('div');
    previewEl.className = 'toastwrite-editor-md-preview';
    previewEl.innerHTML = context.getPreviewHtml();

    mount = document.createElement('div');
    document.body.appendChild(mount);

    const mode = new MarkdownMode(context, 'vertical');
    (mode as unknown as { previewEl: HTMLElement }).previewEl = previewEl;

    const updatePreviewSpy = vi.spyOn(context, 'updatePreview');
    const renderSpy = vi.spyOn(PreviewService.prototype, 'render');

    const view = createMarkdownView({
      mount,
      doc: markdownToDoc(initialMarkdown),
      onDocumentEdit: (change) =>
        (mode as unknown as { handleDocumentEdit: (value: typeof change) => ReturnType<MarkdownMode['handleDocumentEdit']> }).handleDocumentEdit(
          change
        ),
      onChange: () => undefined,
    });

    const tr = view.state.tr.setSelection(TextSelection.create(view.state.doc, 2)).insertText('X');
    view.dispatch(tr);

    expect(updatePreviewSpy).toHaveBeenCalled();
    expect(updatePreviewSpy.mock.results.at(-1)?.value).toBe('partial');
    expect(renderSpy).not.toHaveBeenCalled();

    updatePreviewSpy.mockRestore();
    renderSpy.mockRestore();
  });

  it('passes edit results into the syntax highlighter transaction meta', () => {
    const initialMarkdown = createLargeMarkdown(200);
    const context = new EditorContext({ initialValue: initialMarkdown });
    const previewEl = document.createElement('div');
    previewEl.innerHTML = context.getPreviewHtml();

    mount = document.createElement('div');
    document.body.appendChild(mount);

    const mode = new MarkdownMode(context, 'vertical');
    (mode as unknown as { previewEl: HTMLElement }).previewEl = previewEl;

    let capturedEditResults: EditResult[] | undefined;
    const view = createMarkdownView({
      mount,
      doc: markdownToDoc(initialMarkdown),
      onDocumentEdit: (change) => {
        const editResults = (
          mode as unknown as { handleDocumentEdit: (value: typeof change) => EditResult[] }
        ).handleDocumentEdit(change);
        capturedEditResults = editResults;
        return editResults;
      },
      onChange: () => undefined,
    });

    const tr = view.state.tr.setSelection(TextSelection.create(view.state.doc, 2)).insertText('X');
    view.dispatch(tr);

    expect(Array.isArray(capturedEditResults)).toBe(true);
    expect((capturedEditResults as unknown[]).length).toBeGreaterThan(0);
    expect(tr.getMeta('editResult')).toEqual(capturedEditResults);
  });
});
