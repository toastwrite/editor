import { afterEach, describe, expect, it } from 'vitest';
import { Editor } from '../editor.js';

describe('heading dropdown', () => {
  let container: HTMLDivElement;

  afterEach(() => {
    container?.remove();
  });

  it('renders a single heading dropdown instead of six heading buttons by default', () => {
    container = document.createElement('div');
    document.body.appendChild(container);

    const editor = new Editor({
      el: container,
      initialValue: '# Hello',
    });

    expect(container.querySelector('.toastwrite-editor-toolbar-heading-trigger')).toBeTruthy();
    expect(container.querySelector('.toastwrite-editor-toolbar-heading-menu')).toBeTruthy();
    expect(container.querySelector('.toastwrite-editor-toolbar-button-heading1')).toBeFalsy();
    expect(container.querySelectorAll('.toastwrite-editor-toolbar-heading-menu .toastwrite-editor-toolbar-heading-item')).toHaveLength(6);

    editor.destroy();
  });

  it('executes heading commands from the dropdown menu', () => {
    container = document.createElement('div');
    document.body.appendChild(container);

    const editor = new Editor({
      el: container,
      initialValue: 'Hello',
    });

    const trigger = container.querySelector(
      '.toastwrite-editor-toolbar-heading-trigger'
    ) as HTMLButtonElement;
    trigger.click();

    const heading2Item = container.querySelector(
      '.toastwrite-editor-toolbar-heading-menu [data-command="heading2"]'
    ) as HTMLButtonElement;
    heading2Item.click();

    expect(editor.getMarkdown()).toBe('## Hello');

    editor.destroy();
  });
});
