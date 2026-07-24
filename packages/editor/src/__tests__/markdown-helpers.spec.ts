import { describe, expect, it } from 'vitest';
import {
  handleListEnter,
  insertMarkdownTable,
  insertTextareaAtSelection,
  setHeadingLevelLines,
  wrapTextareaSelection,
} from '../commands/markdown-helpers.js';

describe('markdown helpers', () => {
  it('wraps the selected text with markers', () => {
    const result = wrapTextareaSelection('hello world', { start: 6, end: 11 }, '**', '**');

    expect(result.value).toBe('hello **world**');
    expect(result.selection).toEqual({ start: 8, end: 13 });
  });

  it('unwraps bold when the selection includes the markers', () => {
    const result = wrapTextareaSelection('hello **world**', { start: 6, end: 15 }, '**', '**');

    expect(result.value).toBe('hello world');
    expect(result.selection).toEqual({ start: 6, end: 11 });
  });

  it('unwraps bold when the selection is inside the markers', () => {
    const result = wrapTextareaSelection('hello **world**', { start: 8, end: 13 }, '**', '**');

    expect(result.value).toBe('hello world');
    expect(result.selection).toEqual({ start: 6, end: 11 });
  });

  it('unwraps italic, inline code, and strike markers', () => {
    expect(wrapTextareaSelection('*text*', { start: 1, end: 5 }, '*', '*').value).toBe('text');
    expect(wrapTextareaSelection('`code`', { start: 1, end: 5 }, '`', '`').value).toBe('code');
    expect(wrapTextareaSelection('~~strike~~', { start: 2, end: 8 }, '~~', '~~').value).toBe('strike');
  });

  it('does not unwrap when the selected text has edge spaces', () => {
    const result = wrapTextareaSelection('**world **', { start: 2, end: 8 }, '**', '**');

    expect(result.value).toBe('****world ****');
  });

  it('does not unwrap italic markers inside bold text', () => {
    const result = wrapTextareaSelection('**bold**', { start: 2, end: 6 }, '*', '*');

    expect(result.value).toBe('***bold***');
  });

  it('replaces an existing heading prefix instead of prepending', () => {
    const result = setHeadingLevelLines('# heading', { start: 2, end: 9 }, 2);

    expect(result.value).toBe('## heading');
    expect(result.selection).toEqual({ start: 3, end: 10 });
  });

  it('supports heading levels up to h6', () => {
    const result = setHeadingLevelLines('heading', { start: 0, end: 7 }, 6);

    expect(result.value).toBe('###### heading');
  });

  it('inserts a trailing space after heading hashes on empty lines', () => {
    const result = setHeadingLevelLines('', { start: 0, end: 0 }, 2);

    expect(result.value).toBe('## ');
    expect(result.selection).toEqual({ start: 3, end: 3 });
  });

  it('replaces an existing heading prefix without a space', () => {
    const result = setHeadingLevelLines('#Hello', { start: 0, end: 6 }, 2);

    expect(result.value).toBe('## Hello');
  });

  it('inserts a gfm table template', () => {
    const result = insertMarkdownTable('Hello', { start: 5, end: 5 });

    expect(result.value).toContain('| Header 1 | Header 2 | Header 3 |');
    expect(result.value).toContain('| --- | --- | --- |');
    expect(result.value).toContain('| Cell 1-1 | Cell 1-2 | Cell 1-3 |');
  });

  it('creates a new list item on enter inside a list', () => {
    const result = handleListEnter('- item', { start: 6, end: 6 });

    expect(result?.value).toBe('- item\n- ');
    expect(result?.selection).toEqual({ start: 9, end: 9 });
  });

  it('exits a list when enter is pressed on an empty list item', () => {
    const result = handleListEnter('- ', { start: 2, end: 2 });

    expect(result?.value).toBe('\n');
    expect(result?.selection).toEqual({ start: 1, end: 1 });
  });

  it('inserts content at the cursor', () => {
    const result = insertTextareaAtSelection('abc', { start: 1, end: 1 }, '---');

    expect(result.value).toBe('a---bc');
    expect(result.selection).toEqual({ start: 4, end: 4 });
  });
});
