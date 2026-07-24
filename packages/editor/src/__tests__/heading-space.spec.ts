import { afterEach, describe, expect, it } from 'vitest';
import { Editor } from '../editor.js';

describe('heading space insertion', () => {
  let container: HTMLDivElement;

  afterEach(() => {
    container?.remove();
  });

  function applyHeading(level: 1 | 2 | 3 | 4 | 5 | 6): void {
    const trigger = container.querySelector(
      '.toastwrite-editor-toolbar-heading-trigger'
    ) as HTMLButtonElement;
    trigger.click();

    const item = container.querySelector(
      `.toastwrite-editor-toolbar-heading-menu [data-command="heading${level}"]`
    ) as HTMLButtonElement;
    item.click();
  }

  function editorLineText(): string {
    return container.querySelector('.ProseMirror p')?.textContent ?? '';
  }

  it('inserts a space after hashes on a line with text', () => {
    container = document.createElement('div');
    document.body.appendChild(container);

    const editor = new Editor({ el: container, initialValue: 'Hello' });
    applyHeading(1);

    expect(editorLineText()).toBe('# Hello');
    expect(editor.getMarkdown()).toBe('# Hello');

    editor.destroy();
  });

  it('inserts a space after hashes on an empty line', () => {
    container = document.createElement('div');
    document.body.appendChild(container);

    const editor = new Editor({ el: container, initialValue: '' });
    applyHeading(1);

    expect(editorLineText()).toBe('# ');
    expect(editor.getMarkdown()).toBe('# ');

    editor.destroy();
  });

  it('inserts a space for each heading level', () => {
    container = document.createElement('div');
    document.body.appendChild(container);

    const editor = new Editor({ el: container, initialValue: 'Title' });

    for (const level of [1, 2, 3, 4, 5, 6] as const) {
      applyHeading(level);
      const prefix = `${'#'.repeat(level)} `;
      expect(editorLineText()).toBe(`${prefix}Title`);
      expect(editor.getMarkdown()).toBe(`${prefix}Title`);
    }

    editor.destroy();
  });
});
