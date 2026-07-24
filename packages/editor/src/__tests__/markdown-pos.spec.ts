import { describe, expect, it } from 'vitest';
import { markdownToDoc } from '../markdown/doc-bridge.js';
import { getChangedFromSlice, getEditorToMdPos } from '../markdown/pos.js';
import { Slice, Fragment } from 'prosemirror-model';
import { markdownLineSchema as schema } from '../markdown/schema.js';

describe('markdown pos helpers', () => {
  it('maps prosemirror positions to markdown positions', () => {
    const doc = markdownToDoc('abc\ndef');
    const [startPos, endPos] = getEditorToMdPos(doc, 2, 2);

    expect(startPos).toEqual([1, 2]);
    expect(endPos).toEqual([1, 2]);
  });

  it('extracts inserted text from a prosemirror slice', () => {
    const slice = new Slice(Fragment.from(schema.text('hi')), 0, 0);

    expect(getChangedFromSlice(slice)).toBe('hi');
  });
});
