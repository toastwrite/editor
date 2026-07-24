import { afterEach, describe, expect, it } from 'vitest';
import { PreviewSplitter } from '../markdown/preview-splitter.js';

describe('PreviewSplitter', () => {
  let container: HTMLDivElement;
  let editorWrap: HTMLDivElement;
  let previewWrap: HTMLDivElement;
  let splitter: PreviewSplitter | null = null;

  afterEach(() => {
    splitter?.destroy();
    splitter = null;
    container?.remove();
  });

  function mountSplitter(containerWidth = 800): void {
    container = document.createElement('div');
    container.className = 'toastwrite-editor-md-container toastwrite-editor-md-vertical';
    container.style.width = `${containerWidth}px`;
    container.style.height = '400px';
    container.style.display = 'flex';

    editorWrap = document.createElement('div');
    editorWrap.className = 'toastwrite-editor-md-editor-wrap';

    previewWrap = document.createElement('div');
    previewWrap.className = 'toastwrite-editor-md-preview-wrap';

    container.append(editorWrap, previewWrap);
    document.body.appendChild(container);

    Object.defineProperty(container, 'clientWidth', {
      configurable: true,
      get: () => containerWidth,
    });

    splitter = new PreviewSplitter({
      container,
      editorWrap,
      previewWrap,
    });
  }

  it('inserts splitter between editor and preview panes', () => {
    mountSplitter();

    expect(container.querySelector('.toastwrite-editor-md-splitter')).toBeTruthy();
    expect(container.children[0]).toBe(editorWrap);
    expect(container.children[1]?.className).toContain('toastwrite-editor-md-splitter');
    expect(container.children[2]).toBe(previewWrap);
    expect(container.classList.contains('toastwrite-editor-md-split-enabled')).toBe(true);
  });

  it('hides the editor pane when the left arrow is clicked', () => {
    mountSplitter();

    const hideEditorButton = container.querySelector(
      '.toastwrite-editor-md-splitter-hide-editor'
    ) as HTMLButtonElement;

    hideEditorButton.click();

    expect(container.classList.contains('toastwrite-editor-md-split-editor-hidden')).toBe(true);
    expect(hideEditorButton.hidden).toBe(true);
  });

  it('hides the preview pane when the right arrow is clicked', () => {
    mountSplitter();

    const hidePreviewButton = container.querySelector(
      '.toastwrite-editor-md-splitter-hide-preview'
    ) as HTMLButtonElement;

    hidePreviewButton.click();

    expect(container.classList.contains('toastwrite-editor-md-split-preview-hidden')).toBe(true);
    expect(hidePreviewButton.hidden).toBe(true);
  });

  it('restores both panes from collapsed states using the remaining arrow', () => {
    mountSplitter();

    const hideEditorButton = container.querySelector(
      '.toastwrite-editor-md-splitter-hide-editor'
    ) as HTMLButtonElement;
    const hidePreviewButton = container.querySelector(
      '.toastwrite-editor-md-splitter-hide-preview'
    ) as HTMLButtonElement;

    hideEditorButton.click();
    hidePreviewButton.click();

    expect(container.classList.contains('toastwrite-editor-md-split-editor-hidden')).toBe(false);
    expect(container.classList.contains('toastwrite-editor-md-split-preview-hidden')).toBe(false);

    hidePreviewButton.click();
    hideEditorButton.click();

    expect(container.classList.contains('toastwrite-editor-md-split-editor-hidden')).toBe(false);
    expect(container.classList.contains('toastwrite-editor-md-split-preview-hidden')).toBe(false);
  });
});
