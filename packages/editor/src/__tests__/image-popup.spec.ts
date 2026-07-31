import { afterEach, describe, expect, it } from 'vitest';
import { Editor } from '../editor.js';

describe('image popup', () => {
  let container: HTMLDivElement;

  afterEach(() => {
    container?.remove();
  });

  it('opens the popup when clicking the image toolbar button', () => {
    container = document.createElement('div');
    document.body.appendChild(container);

    const editor = new Editor({
      el: container,
      initialValue: 'selected text',
      toolbarItems: ['image'],
    });

    editor.setSelection({ start: 0, end: 8 });

    const imageButton = container.querySelector('[data-command="image"]') as HTMLButtonElement;
    imageButton.click();

    const popup = container.querySelector('.toastwrite-editor-image-popup') as HTMLElement;
    expect(popup.hidden).toBe(false);

    const altInput = container.querySelector('#toastwrite-editor-image-alt') as HTMLInputElement;
    expect(altInput.value).toBe('selected');
    expect(altInput.disabled).toBe(false);

    editor.destroy();
  });

  it('inserts an image from URL', () => {
    container = document.createElement('div');
    document.body.appendChild(container);

    const editor = new Editor({
      el: container,
      initialValue: 'Hello',
      toolbarItems: ['image'],
    });

    editor.setSelection({ start: 5, end: 5 });

    const imageButton = container.querySelector('[data-command="image"]') as HTMLButtonElement;
    imageButton.click();

    const urlTab = container.querySelector(
      '.toastwrite-editor-image-popup-tab[data-tab="url"]'
    ) as HTMLButtonElement;
    urlTab.click();

    const urlInput = container.querySelector('#toastwrite-editor-image-url') as HTMLInputElement;
    const altInput = container.querySelector('#toastwrite-editor-image-alt') as HTMLInputElement;
    const okButton = container.querySelector('.toastwrite-editor-image-popup-ok') as HTMLButtonElement;

    urlInput.value = 'https://example.com/image.png';
    altInput.value = 'example';
    okButton.click();

    expect(editor.getMarkdown()).toBe('Hello![example](https://example.com/image.png)');

    editor.destroy();
  });

  it('marks empty URL as invalid on submit', () => {
    container = document.createElement('div');
    document.body.appendChild(container);

    const editor = new Editor({
      el: container,
      initialValue: 'Hello',
      toolbarItems: ['image'],
    });

    const imageButton = container.querySelector('[data-command="image"]') as HTMLButtonElement;
    imageButton.click();

    const urlTab = container.querySelector(
      '.toastwrite-editor-image-popup-tab[data-tab="url"]'
    ) as HTMLButtonElement;
    urlTab.click();

    const urlInput = container.querySelector('#toastwrite-editor-image-url') as HTMLInputElement;
    const okButton = container.querySelector('.toastwrite-editor-image-popup-ok') as HTMLButtonElement;

    okButton.click();
    expect(urlInput.classList.contains('is-invalid')).toBe(true);

    editor.destroy();
  });

  it('marks missing file as invalid on submit', () => {
    container = document.createElement('div');
    document.body.appendChild(container);

    const editor = new Editor({
      el: container,
      initialValue: 'Hello',
      toolbarItems: ['image'],
    });

    const imageButton = container.querySelector('[data-command="image"]') as HTMLButtonElement;
    imageButton.click();

    const fileName = container.querySelector(
      '.toastwrite-editor-image-popup-file-name'
    ) as HTMLSpanElement;
    const okButton = container.querySelector('.toastwrite-editor-image-popup-ok') as HTMLButtonElement;

    okButton.click();
    expect(fileName.classList.contains('is-invalid')).toBe(true);

    editor.destroy();
  });

  it('closes the popup when Cancel is clicked', () => {
    container = document.createElement('div');
    document.body.appendChild(container);

    const editor = new Editor({
      el: container,
      initialValue: 'Hello',
      toolbarItems: ['image'],
    });

    const imageButton = container.querySelector('[data-command="image"]') as HTMLButtonElement;
    imageButton.click();

    const popup = container.querySelector('.toastwrite-editor-image-popup') as HTMLElement;
    const cancelButton = container.querySelector(
      '.toastwrite-editor-image-popup-cancel'
    ) as HTMLButtonElement;

    cancelButton.click();
    expect(popup.hidden).toBe(true);

    editor.destroy();
  });
});
