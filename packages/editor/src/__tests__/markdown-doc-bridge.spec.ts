import { describe, expect, it } from 'vitest';
import {
  docToMarkdown,
  markdownOffsetToPos,
  markdownToDoc,
  posToMarkdownOffset,
} from '../markdown/doc-bridge.js';

describe('markdown doc bridge', () => {
  it('round-trips markdown through a line-per-paragraph document', () => {
    const markdown = '# Title\n\nBody';
    const doc = markdownToDoc(markdown);

    expect(docToMarkdown(doc)).toBe(markdown);
  });

  it('maps markdown offsets to prosemirror positions', () => {
    const doc = markdownToDoc('abc\ndef');
    const pos = markdownOffsetToPos(doc, 5);

    expect(posToMarkdownOffset(doc, pos)).toBe(5);
  });
});
