import { describe, expect, it } from 'vitest';
import { ToastMark, Renderer } from '@toastwrite/parser';
import { Editor } from '../editor.js';
import { patchPreviewDom } from '../services/preview-patcher.js';
import { PreviewService } from '../services/preview-service.js';

const DEMO_SNIPPET = `# Welcome

Paragraph with **bold**

| A | B |
| --- | --- |
| 1 | 2 |

\`\`\`ts
const x = 1;
\`\`\`

[ref]: https://example.com
`;

describe('clear preview on empty editor', () => {
  it('clears preview when all markdown is deleted via editMarkdown patch', () => {
    const md = `# First

Paragraph

- item`;

    const toastMark = new ToastMark(md);
    const preview = new PreviewService();
    const previewEl = document.createElement('div');
    previewEl.innerHTML = preview.render(toastMark);

    expect(previewEl.textContent).toContain('First');

    const lines = toastMark.getLineTexts();
    const editResults = toastMark.editMarkdown(
      [1, 1],
      [lines.length, lines[lines.length - 1].length + 1],
      ''
    );

    preview.updatePreview(previewEl, editResults, toastMark, (html) => html);

    expect(previewEl.textContent?.trim()).toBe('');
    expect(previewEl.querySelector('[data-nodeid]')).toBeFalsy();
  });

  it('clears preview when patchPreviewDom removes all nodes with empty replacement', () => {
    const renderer = new Renderer({ gfm: true, nodeId: true });
    const toastMark = new ToastMark('# Title\n\nBody');
    const previewEl = document.createElement('div');
    previewEl.innerHTML = renderer.render(toastMark.getRootNode());

    const lines = toastMark.getLineTexts();
    const editResults = toastMark.editMarkdown(
      [1, 1],
      [lines.length, lines[lines.length - 1].length + 1],
      ''
    );

    const patched = patchPreviewDom(previewEl, editResults, (node) => renderer.render(node));

    expect(patched).toBe(true);
    expect(previewEl.textContent?.trim()).toBe('');
  });

  it('clears preview when user selects all and deletes demo-like content', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    const editor = new Editor({
      el: container,
      initialValue: DEMO_SNIPPET,
      previewStyle: 'vertical',
      hideToolbar: true,
      frontMatter: true,
      referenceDefinition: true,
    });

    editor.setSelection({ start: 0, end: editor.getMarkdown().length });
    const surface = container.querySelector(
      '.toastwrite-editor-md-editor.ProseMirror'
    ) as HTMLElement;
    surface.focus();

    surface.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Backspace', code: 'Backspace', bubbles: true, cancelable: true })
    );

    const previewHtml = container.querySelector('.toastwrite-editor-md-preview')?.innerHTML ?? '';
    expect(editor.getMarkdown()).toBe('');
    expect(previewHtml.trim()).toBe('');

    editor.destroy();
    container.remove();
  });

  it('clears preview when referenceDefinition omits removedNodeRange on full delete', () => {
    const toastMark = new ToastMark(DEMO_SNIPPET, {
      referenceDefinition: true,
      extendedAutolinks: true,
      disallowedHtmlBlockTags: [],
      customParser: null,
    });
    const preview = new PreviewService();
    const previewEl = document.createElement('div');
    previewEl.innerHTML = preview.render(toastMark);

    const lines = toastMark.getLineTexts();
    const editResults = toastMark.editMarkdown(
      [1, 1],
      [lines.length, lines[lines.length - 1].length + 1],
      ''
    );

    expect(editResults[0]?.nodes).toEqual([]);
    expect(editResults[0]?.removedNodeRange).toBeNull();

    const mode = preview.updatePreview(previewEl, editResults, toastMark, (html) => html);

    expect(mode).toBe('full');
    expect(previewEl.textContent?.trim()).toBe('');
  });
});
