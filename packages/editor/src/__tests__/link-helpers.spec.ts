import { describe, expect, it } from 'vitest';
import {
  escapeTextForLink,
  findMarkdownLinkAtSelection,
  getLinkPopupInitialValues,
  insertMarkdownLink,
} from '../commands/link-helpers.js';

describe('link helpers', () => {
  it('escapes brackets in link text but not image alt text', () => {
    expect(escapeTextForLink('plain [text]')).toBe('plain \\[text\\]');
    expect(escapeTextForLink('![alt [text]](img.png)')).toBe('![alt [text]](img.png)');
  });

  it('finds a markdown link overlapping the selection', () => {
    const value = '[toastui](https://ui.toast.com)';

    expect(findMarkdownLinkAtSelection(value, { start: 1, end: 8 })).toEqual({
      url: 'https://ui.toast.com',
      linkText: 'toastui',
      range: { start: 0, end: 31 },
    });
  });

  it('prefills selected text when creating a new link', () => {
    expect(getLinkPopupInitialValues('hello world', { start: 6, end: 11 })).toEqual({
      url: '',
      linkText: 'world',
      linkTextDisabled: false,
    });
  });

  it('prefills and locks link text when editing an existing link', () => {
    expect(
      getLinkPopupInitialValues('[toastui](https://ui.toast.com)', { start: 1, end: 8 })
    ).toEqual({
      url: 'https://ui.toast.com',
      linkText: 'toastui',
      linkTextDisabled: true,
    });
  });

  it('inserts a new markdown link at the selection', () => {
    const result = insertMarkdownLink('Hello', { start: 5, end: 5 }, {
      url: 'https://ui.toast.com',
      linkText: 'toastui',
    });

    expect(result.value).toBe('Hello[toastui](https://ui.toast.com)');
  });

  it('replaces an existing markdown link', () => {
    const result = insertMarkdownLink('[old](https://old.example)', { start: 1, end: 3 }, {
      url: 'https://new.example',
      linkText: 'old',
    });

    expect(result.value).toBe('[old](https://new.example)');
  });
});
