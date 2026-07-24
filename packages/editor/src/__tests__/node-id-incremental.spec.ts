import { describe, expect, it } from 'vitest';
import { ToastMark } from '@toastwrite/parser';
import { PreviewService } from '../services/preview-service.js';

function createLargeMarkdown(lineCount: number): string {
  return Array.from({ length: lineCount }, (_, index) => `Line ${index + 1}`).join('\n\n');
}

describe('toastmark node id stability', () => {
  it('preserves existing preview node ids outside the edited block', () => {
    const markdown = createLargeMarkdown(500);
    const toastMark = new ToastMark(markdown);
    const preview = new PreviewService();
    const previewEl = document.createElement('div');
    previewEl.innerHTML = preview.render(toastMark);

    const untouchedNode = previewEl.querySelector('[data-nodeid]');
    const untouchedNodeId = untouchedNode?.getAttribute('data-nodeid');
    expect(untouchedNodeId).toBeTruthy();

    const editResults = toastMark.editMarkdown([999, 9], [999, 9], '!');
    const mode = preview.updatePreview(previewEl, editResults, toastMark, (html) => html);

    expect(mode).toBe('partial');
    expect(previewEl.querySelector(`[data-nodeid="${untouchedNodeId}"]`)).toBe(untouchedNode);
    expect(previewEl.textContent).toContain('Line 500!');
  });

  it('does not recreate the entire ast when editing a single character', () => {
    const markdown = createLargeMarkdown(500);
    const toastMark = new ToastMark(markdown);
    const untouchedNodeId = toastMark.findFirstNodeAtLine(1)?.id;

    toastMark.editMarkdown([999, 9], [999, 9], '!');

    expect(toastMark.findFirstNodeAtLine(1)?.id).toBe(untouchedNodeId);
  });
});
