import { describe, expect, it } from 'vitest';
import {
  findMarkdownImageAtSelection,
  getImagePopupInitialValues,
  insertMarkdownImage,
} from '../commands/image-helpers.js';

describe('image helpers', () => {
  it('finds an image at the selection', () => {
    const value = 'before ![alt text](https://example.com/image.png) after';
    const match = findMarkdownImageAtSelection(value, { start: 10, end: 18 });

    expect(match).toEqual({
      url: 'https://example.com/image.png',
      altText: 'alt text',
      range: { start: 7, end: 49 },
    });
  });

  it('returns popup initial values from selected text', () => {
    expect(getImagePopupInitialValues('hello world', { start: 6, end: 11 })).toEqual({
      url: '',
      altText: 'world',
      altTextDisabled: false,
    });
  });

  it('returns popup initial values when editing an existing image', () => {
    expect(
      getImagePopupInitialValues('![photo](https://example.com/a.png)', { start: 2, end: 7 })
    ).toEqual({
      url: 'https://example.com/a.png',
      altText: 'photo',
      altTextDisabled: true,
    });
  });

  it('inserts image markdown at the cursor', () => {
    const result = insertMarkdownImage('Hello', { start: 5, end: 5 }, {
      url: 'https://example.com/a.png',
      altText: 'photo',
    });

    expect(result).toEqual({
      value: 'Hello![photo](https://example.com/a.png)',
      selection: { start: 40, end: 40 },
    });
  });

  it('escapes alt text brackets', () => {
    const result = insertMarkdownImage('', { start: 0, end: 0 }, {
      url: 'https://example.com/a.png',
      altText: 'mytext ()[]<>',
    });

    expect(result.value).toBe('![mytext ()\\[\\]<>](https://example.com/a.png)');
  });
});
