import { describe, expect, it } from 'vitest';
import { computeMarkdownEdit, offsetToPos } from '../markdown/compute-markdown-edit.js';

describe('computeMarkdownEdit', () => {
  it('returns null when text is unchanged', () => {
    expect(computeMarkdownEdit('hello', 'hello')).toBeNull();
  });

  it('computes a single-character insertion', () => {
    const edit = computeMarkdownEdit('Hello world', 'Hellox world');

    expect(edit).toEqual({
      startPos: [1, 6],
      endPos: [1, 6],
      newText: 'x',
    });
  });

  it('computes a replacement span', () => {
    const edit = computeMarkdownEdit('# Hello', '## Hello');

    expect(edit).toEqual({
      startPos: [1, 2],
      endPos: [1, 2],
      newText: '#',
    });
  });

  it('maps offsets to toastmark line positions', () => {
    expect(offsetToPos('line one\nline two', 9)).toEqual([2, 1]);
  });
});
