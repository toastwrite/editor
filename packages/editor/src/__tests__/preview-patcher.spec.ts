import { describe, expect, it } from 'vitest';
import { ToastMark } from '@toastwrite/parser';
import { patchPreviewDom } from '../services/preview-patcher.js';
import { PreviewService } from '../services/preview-service.js';

describe('preview patcher', () => {
  it('patches only the changed preview nodes using data-nodeid', () => {
    const toastMark = new ToastMark('# Hello\n\nParagraph');
    const preview = new PreviewService();
    const previewEl = document.createElement('div');
    previewEl.innerHTML = preview.render(toastMark);

    expect(previewEl.querySelector('[data-nodeid]')).toBeTruthy();

    const editResults = toastMark.editMarkdown([1, 8], [1, 8], ' world');
    const patched = patchPreviewDom(previewEl, editResults, (node) => preview.renderNodes([node]));

    expect(patched).toBe(true);
    expect(previewEl.innerHTML).toContain('Hello world');
    expect(previewEl.querySelectorAll('[data-nodeid]').length).toBeGreaterThan(0);
  });

  it('updates preview incrementally through editMarkdown', () => {
    const toastMark = new ToastMark('# Hello');
    const preview = new PreviewService();
    const previewEl = document.createElement('div');
    previewEl.innerHTML = preview.render(toastMark);

    const editResults = toastMark.editMarkdown([1, 8], [1, 8], ' world');
    const mode = preview.updatePreview(previewEl, editResults, toastMark, (html) => html);

    expect(mode).toBe('partial');
    expect(previewEl.textContent).toContain('Hello world');
  });

  it('falls back when preview markers are missing', () => {
    const toastMark = new ToastMark('Hello');
    const previewEl = document.createElement('div');
    previewEl.innerHTML = '<p>Hello</p>';

    const editResults = toastMark.editMarkdown([1, 6], [1, 6], ' world');
    const patched = patchPreviewDom(previewEl, editResults, () => '<p>Hello world</p>');

    expect(patched).toBe(false);
  });

  it('prepends rendered nodes when removedNodeRange is null', () => {
    const toastMark = new ToastMark('');
    const preview = new PreviewService();
    const previewEl = document.createElement('div');
    previewEl.innerHTML = preview.render(toastMark);

    const editResults = toastMark.editMarkdown([1, 1], [1, 1], '# Title');
    expect(editResults[0]?.removedNodeRange).toBeNull();

    const mode = preview.updatePreview(previewEl, editResults, toastMark, (html) => html);

    expect(mode).toBe('partial');
    expect(previewEl.textContent).toContain('Title');
  });
});
