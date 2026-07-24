import { afterEach, describe, expect, it } from 'vitest';
import { Editor } from '../editor.js';

describe('markdown enter in editor', () => {
  let container: HTMLDivElement;

  afterEach(() => {
    container?.remove();
  });

  it('creates a new line when pressing enter', () => {
    container = document.createElement('div');
    document.body.appendChild(container);

    const editor = new Editor({
      el: container,
      initialValue: 'hello',
      hideToolbar: true,
    });

    editor.setSelection({ start: 5, end: 5 });
    const surface = container.querySelector('.toastwrite-editor-md-editor.ProseMirror') as HTMLElement;
    surface.focus();

    surface.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', bubbles: true, cancelable: true })
    );

    expect(editor.getMarkdown()).toBe('hello\n');
    editor.destroy();
  });

  it('creates a new list item when pressing enter in a list', () => {
    container = document.createElement('div');
    document.body.appendChild(container);

    const editor = new Editor({
      el: container,
      initialValue: '- item',
      hideToolbar: true,
    });

    editor.setSelection({ start: 6, end: 6 });
    const surface = container.querySelector('.toastwrite-editor-md-editor.ProseMirror') as HTMLElement;
    surface.focus();

    surface.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', bubbles: true, cancelable: true })
    );

    expect(editor.getMarkdown()).toBe('- item\n- ');
    editor.destroy();
  });

  it('breaks the list when pressing enter twice', () => {
    container = document.createElement('div');
    document.body.appendChild(container);

    const editor = new Editor({
      el: container,
      initialValue: '- item',
      hideToolbar: true,
    });

    editor.setSelection({ start: 6, end: 6 });
    const surface = container.querySelector('.toastwrite-editor-md-editor.ProseMirror') as HTMLElement;
    surface.focus();

    surface.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', bubbles: true, cancelable: true })
    );
    surface.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', bubbles: true, cancelable: true })
    );

    expect(editor.getMarkdown()).toBe('- item\n\n');
    editor.destroy();
  });

  it('creates a new blockquote line when pressing enter in a blockquote', () => {
    container = document.createElement('div');
    document.body.appendChild(container);

    const editor = new Editor({
      el: container,
      initialValue: '> some text',
      hideToolbar: true,
    });

    editor.setSelection({ start: 11, end: 11 });
    const surface = container.querySelector('.toastwrite-editor-md-editor.ProseMirror') as HTMLElement;
    surface.focus();

    surface.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', bubbles: true, cancelable: true })
    );

    expect(editor.getMarkdown()).toBe('> some text\n> ');
    editor.destroy();
  });

  it('breaks the blockquote when pressing enter twice', () => {
    container = document.createElement('div');
    document.body.appendChild(container);

    const editor = new Editor({
      el: container,
      initialValue: '> some text',
      hideToolbar: true,
    });

    editor.setSelection({ start: 11, end: 11 });
    const surface = container.querySelector('.toastwrite-editor-md-editor.ProseMirror') as HTMLElement;
    surface.focus();

    surface.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', bubbles: true, cancelable: true })
    );
    surface.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', bubbles: true, cancelable: true })
    );

    expect(editor.getMarkdown()).toBe('> some text\n\n');
    editor.destroy();
  });

  it('creates a compact blockquote line when pressing enter in compact syntax', () => {
    container = document.createElement('div');
    document.body.appendChild(container);

    const editor = new Editor({
      el: container,
      initialValue: '>hello',
      hideToolbar: true,
    });

    editor.setSelection({ start: 6, end: 6 });
    const surface = container.querySelector('.toastwrite-editor-md-editor.ProseMirror') as HTMLElement;
    surface.focus();

    surface.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', bubbles: true, cancelable: true })
    );

    expect(editor.getMarkdown()).toBe('>hello\n>');
    editor.destroy();
  });

  it('indents a list item when pressing tab', () => {
    container = document.createElement('div');
    document.body.appendChild(container);

    const editor = new Editor({
      el: container,
      initialValue: '- parent\n- child',
      hideToolbar: true,
    });

    editor.setSelection({ start: 0, end: 0 });
    const surface = container.querySelector('.toastwrite-editor-md-editor.ProseMirror') as HTMLElement;
    surface.focus();

    surface.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Tab', code: 'Tab', bubbles: true, cancelable: true })
    );

    expect(editor.getMarkdown()).toBe('    - parent\n- child');
    editor.destroy();
  });

  it('indents a new list item after pressing enter then tab', () => {
    container = document.createElement('div');
    document.body.appendChild(container);

    const editor = new Editor({
      el: container,
      initialValue: '- item',
      hideToolbar: true,
    });

    editor.setSelection({ start: 6, end: 6 });
    const surface = container.querySelector('.toastwrite-editor-md-editor.ProseMirror') as HTMLElement;
    surface.focus();

    surface.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', bubbles: true, cancelable: true })
    );
    surface.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Tab', code: 'Tab', bubbles: true, cancelable: true })
    );

    expect(editor.getMarkdown()).toBe('- item\n    - ');
    editor.destroy();
  });
});
