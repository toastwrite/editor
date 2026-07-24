import { afterEach, describe, expect, it } from 'vitest';
import { Editor } from '../editor.js';

describe('Editor', () => {
  let container: HTMLDivElement;

  afterEach(() => {
    container?.remove();
  });

  it('renders markdown editor with live preview', () => {
    container = document.createElement('div');
    document.body.appendChild(container);

    const editor = new Editor({
      el: container,
      initialValue: '# Hello **world**',
      height: '400px',
      previewStyle: 'vertical',
    });

    expect(container.querySelector('.toastwrite-editor')).toBeTruthy();
    expect(container.querySelector('.toastwrite-editor-md-editor')).toBeTruthy();
    expect(container.querySelector('.toastwrite-editor-md-preview')?.innerHTML).toContain('world');
    expect(container.querySelector('.toastwrite-editor-md-preview')?.innerHTML).toContain('data-nodeid');

    editor.destroy();
  });

  it('renders toolbar by default', () => {
    container = document.createElement('div');
    document.body.appendChild(container);

    const editor = new Editor({
      el: container,
      initialValue: 'line one\nline two',
    });

    expect(container.querySelector('.toastwrite-editor-toolbar-inner')).toBeTruthy();

    editor.destroy();
  });

  it('renders auto scroll toggle as the last toolbar item by default', () => {
    container = document.createElement('div');
    document.body.appendChild(container);

    const editor = new Editor({
      el: container,
      initialValue: '# Hello',
      previewStyle: 'vertical',
    });

    const toolbarInner = container.querySelector('.toastwrite-editor-toolbar-inner')!;
    const scrollSync = toolbarInner.querySelector('.toastwrite-editor-toolbar-scroll-sync-item');
    const switchButton = toolbarInner.querySelector('.toastwrite-editor-toolbar-switch');
    const actions = toolbarInner.querySelector('.toastwrite-editor-toolbar-actions');

    expect(scrollSync).toBeTruthy();
    expect(switchButton?.getAttribute('aria-checked')).toBe('true');
    expect(actions?.lastElementChild).toBe(scrollSync);

    editor.destroy();
  });

  it('omits auto scroll toggle when scrollSync is removed from toolbar items', () => {
    container = document.createElement('div');
    document.body.appendChild(container);

    const editor = new Editor({
      el: container,
      initialValue: '# Hello',
      previewStyle: 'vertical',
      toolbarItems: ['bold', 'italic'],
    });

    expect(container.querySelector('.toastwrite-editor-toolbar-scroll-sync')).toBeFalsy();

    editor.destroy();
  });

  it('renders preview splitter when enabled in vertical mode', () => {
    container = document.createElement('div');
    document.body.appendChild(container);

    const editor = new Editor({
      el: container,
      initialValue: '# Hello',
      previewStyle: 'vertical',
      previewSplitter: true,
    });

    expect(container.querySelector('.toastwrite-editor-md-splitter')).toBeTruthy();
    expect(container.querySelector('.toastwrite-editor-md-split-enabled')).toBeTruthy();

    editor.destroy();
  });

  it('does not render preview splitter when disabled', () => {
    container = document.createElement('div');
    document.body.appendChild(container);

    const editor = new Editor({
      el: container,
      initialValue: '# Hello',
      previewStyle: 'vertical',
      previewSplitter: false,
    });

    expect(container.querySelector('.toastwrite-editor-md-splitter')).toBeFalsy();

    editor.destroy();
  });

  it('preserves table and task list syntax after markdown init', () => {
    container = document.createElement('div');
    document.body.appendChild(container);

    const initialMarkdown = [
      '| Feature | Value |',
      '| --- | --- |',
      '| Tables | Yes |',
      '- [x] Task done',
      '- [ ] Task todo',
    ].join('\n');

    const editor = new Editor({
      el: container,
      initialValue: initialMarkdown,
    });

    const markdown = editor.getMarkdown();
    expect(markdown).toContain('| Feature | Value |');
    expect(markdown).toContain('| --- | --- |');
    expect(markdown).toContain('- [x] Task done');
    expect(markdown).toContain('- [ ] Task todo');

    const editorHtml = container.querySelector('.toastwrite-editor-md-editor')?.innerHTML ?? '';
    expect(editorHtml).toContain('toastwrite-editor-md-table');
    expect(editorHtml).toContain('toastwrite-editor-md-table-cell');

    editor.destroy();
  });

  it('normalizes embedded html blocks in initial content for preview node ids', () => {
    container = document.createElement('div');
    document.body.appendChild(container);

    const editor = new Editor({
      el: container,
      initialValue: `<i>Note :This is mock output.</i></br> tests<p>Please review investigation summary</p><hr>Do you want to block indicators?`,
      previewStyle: 'vertical',
    });

    const previewEl = container.querySelector('.toastwrite-editor-md-preview') as HTMLElement;
    const topLevelNodes = Array.from(previewEl.children);

    expect(topLevelNodes.length).toBeGreaterThan(1);
    expect(topLevelNodes.every((node) => node.hasAttribute('data-nodeid'))).toBe(true);
    expect(previewEl.textContent).toContain('Please review investigation summary');

    editor.destroy();
  });

  it('updates preview when markdown changes programmatically', () => {
    container = document.createElement('div');
    document.body.appendChild(container);

    const editor = new Editor({
      el: container,
      initialValue: 'initial',
    });

    editor.setMarkdown('# Title');
    expect(editor.getMarkdown()).toBe('# Title');
    expect(editor.getHTML()).toContain('<h1');

    editor.destroy();
  });
});
