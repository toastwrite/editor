import { afterEach, describe, expect, it } from 'vitest';
import { Editor } from '../editor.js';

describe('link popup', () => {
  let container: HTMLDivElement;

  afterEach(() => {
    container?.remove();
  });

  it('opens the popup when clicking the link toolbar button', () => {
    container = document.createElement('div');
    document.body.appendChild(container);

    const editor = new Editor({
      el: container,
      initialValue: 'selected text',
      toolbarItems: ['link'],
    });

    editor.setSelection({ start: 0, end: 8 });

    const linkButton = container.querySelector('[data-command="link"]') as HTMLButtonElement;
    linkButton.click();

    const popup = container.querySelector('.toastwrite-editor-link-popup') as HTMLElement;
    expect(popup.hidden).toBe(false);

    const urlInput = container.querySelector('#toastwrite-editor-link-url') as HTMLInputElement;
    const textInput = container.querySelector('#toastwrite-editor-link-text') as HTMLInputElement;

    expect(urlInput.value).toBe('');
    expect(textInput.value).toBe('selected');
    expect(textInput.disabled).toBe(false);

    editor.destroy();
  });

  it('inserts a link when URL and link text are provided', () => {
    container = document.createElement('div');
    document.body.appendChild(container);

    const editor = new Editor({
      el: container,
      initialValue: 'Hello',
      toolbarItems: ['link'],
    });

    editor.setSelection({ start: 5, end: 5 });

    const linkButton = container.querySelector('[data-command="link"]') as HTMLButtonElement;
    linkButton.click();

    const urlInput = container.querySelector('#toastwrite-editor-link-url') as HTMLInputElement;
    const textInput = container.querySelector('#toastwrite-editor-link-text') as HTMLInputElement;
    const okButton = container.querySelector('.toastwrite-editor-link-popup-ok') as HTMLButtonElement;

    urlInput.value = 'https://ui.toast.com';
    textInput.value = 'toastui';
    okButton.click();

    expect(editor.getMarkdown()).toBe('Hello[toastui](https://ui.toast.com)');

    editor.destroy();
  });

  it('marks empty URL and link text as invalid on submit', () => {
    container = document.createElement('div');
    document.body.appendChild(container);

    const editor = new Editor({
      el: container,
      initialValue: 'Hello',
      toolbarItems: ['link'],
    });

    const linkButton = container.querySelector('[data-command="link"]') as HTMLButtonElement;
    linkButton.click();

    const urlInput = container.querySelector('#toastwrite-editor-link-url') as HTMLInputElement;
    const textInput = container.querySelector('#toastwrite-editor-link-text') as HTMLInputElement;
    const okButton = container.querySelector('.toastwrite-editor-link-popup-ok') as HTMLButtonElement;

    okButton.click();
    expect(urlInput.classList.contains('is-invalid')).toBe(true);

    urlInput.value = 'https://ui.toast.com';
    okButton.click();
    expect(textInput.classList.contains('is-invalid')).toBe(true);

    editor.destroy();
  });

  it('closes the popup when Cancel is clicked', () => {
    container = document.createElement('div');
    document.body.appendChild(container);

    const editor = new Editor({
      el: container,
      initialValue: 'Hello',
      toolbarItems: ['link'],
    });

    const linkButton = container.querySelector('[data-command="link"]') as HTMLButtonElement;
    linkButton.click();

    const popup = container.querySelector('.toastwrite-editor-link-popup') as HTMLElement;
    const cancelButton = container.querySelector('.toastwrite-editor-link-popup-cancel') as HTMLButtonElement;

    cancelButton.click();
    expect(popup.hidden).toBe(true);

    editor.destroy();
  });
});
