import { describe, expect, it } from 'vitest';
import { EditorState, TextSelection } from 'prosemirror-state';
import { markdownLineSchema as schema } from '../markdown/schema.js';
import { markdownToDoc } from '../markdown/doc-bridge.js';

describe('paragraph index resolution', () => {
  it('resolves the paragraph index from text positions on each line', () => {
    const doc = markdownToDoc('- parent\n- child\n- third');
    const cases = [
      { pos: 3, expectedIndex: 0 },
      { pos: 9, expectedIndex: 0 },
      { pos: 13, expectedIndex: 1 },
      { pos: 18, expectedIndex: 1 },
      { pos: 22, expectedIndex: 2 },
    ];

    for (const { pos, expectedIndex } of cases) {
      const state = EditorState.create({
        doc,
        schema,
        selection: TextSelection.create(doc, pos),
      });
      const { $from } = state.selection;
      const depthIndex = $from.index(Math.max(0, $from.depth - 1));

      expect($from.index(0)).toBe(expectedIndex);
      expect(depthIndex).toBe(expectedIndex);
    }
  });
});
