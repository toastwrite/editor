import { describe, expect, it } from 'vitest';
import { EditorState, TextSelection } from 'prosemirror-state';
import { markdownLineSchema as schema } from '../markdown/schema.js';
import {
  markdownEnterKeymap,
  markdownListTabKeymap,
  markdownListShiftTabKeymap,
} from '../markdown/list-keymap.js';
import { docToMarkdown, markdownToDoc } from '../markdown/doc-bridge.js';

describe('markdown list enter keymap', () => {
  it('creates a new list item when pressing enter on a bullet item', () => {
    const doc = markdownToDoc('- item');
    const pos = getParagraphEndPos(doc, 0);
    const state = EditorState.create({
      doc,
      schema,
      selection: TextSelection.create(doc, pos),
    });

    let nextState = state;
    markdownEnterKeymap(state, (tr) => {
      nextState = state.apply(tr);
    });

    expect(docToMarkdown(nextState.doc)).toBe('- item\n- ');
  });

  it('breaks the list when pressing enter on an empty bullet item', () => {
    const doc = markdownToDoc('- item\n- ');
    const pos = getParagraphEndPos(doc, 1);
    const state = EditorState.create({
      doc,
      schema,
      selection: TextSelection.create(doc, pos),
    });

    let nextState = state;
    markdownEnterKeymap(state, (tr) => {
      nextState = state.apply(tr);
    });

    expect(docToMarkdown(nextState.doc)).toBe('- item\n\n');
  });

  it('preserves task list marker when pressing enter', () => {
    const doc = markdownToDoc('- [ ] task');
    const pos = getParagraphEndPos(doc, 0);
    const state = EditorState.create({
      doc,
      schema,
      selection: TextSelection.create(doc, pos),
    });

    let nextState = state;
    markdownEnterKeymap(state, (tr) => {
      nextState = state.apply(tr);
    });

    expect(docToMarkdown(nextState.doc)).toBe('- [ ] task\n- [ ] ');
  });

  it('creates a new list item when pressing enter in the middle of text', () => {
    const doc = markdownToDoc('- item text');
    const pos = getParagraphEndPos(doc, 0) - 5;
    const state = EditorState.create({
      doc,
      schema,
      selection: TextSelection.create(doc, pos),
    });

    let nextState = state;
    markdownEnterKeymap(state, (tr) => {
      nextState = state.apply(tr);
    });

    expect(docToMarkdown(nextState.doc)).toBe('- item\n- text');
  });
});

describe('markdown blockquote enter keymap', () => {
  it('creates a new blockquote line when pressing enter', () => {
    const doc = markdownToDoc('> some text');
    const pos = getParagraphEndPos(doc, 0);
    const state = EditorState.create({
      doc,
      schema,
      selection: TextSelection.create(doc, pos),
    });

    let nextState = state;
    markdownEnterKeymap(state, (tr) => {
      nextState = state.apply(tr);
    });

    expect(docToMarkdown(nextState.doc)).toBe('> some text\n> ');
  });

  it('breaks the blockquote when pressing enter on an empty blockquote line', () => {
    const doc = markdownToDoc('> some text\n> ');
    const pos = getParagraphEndPos(doc, 1);
    const state = EditorState.create({
      doc,
      schema,
      selection: TextSelection.create(doc, pos),
    });

    let nextState = state;
    markdownEnterKeymap(state, (tr) => {
      nextState = state.apply(tr);
    });

    expect(docToMarkdown(nextState.doc)).toBe('> some text\n\n');
  });

  it('splits blockquote text when pressing enter in the middle', () => {
    const doc = markdownToDoc('> some text');
    const pos = getParagraphEndPos(doc, 0) - 5;
    const state = EditorState.create({
      doc,
      schema,
      selection: TextSelection.create(doc, pos),
    });

    let nextState = state;
    markdownEnterKeymap(state, (tr) => {
      nextState = state.apply(tr);
    });

    expect(docToMarkdown(nextState.doc)).toBe('> some\n> text');
  });

  it('creates a compact blockquote line when pressing enter on compact syntax', () => {
    const doc = markdownToDoc('>hello');
    const pos = getParagraphEndPos(doc, 0);
    const state = EditorState.create({
      doc,
      schema,
      selection: TextSelection.create(doc, pos),
    });

    let nextState = state;
    markdownEnterKeymap(state, (tr) => {
      nextState = state.apply(tr);
    });

    expect(docToMarkdown(nextState.doc)).toBe('>hello\n>');
  });

  it('breaks a compact blockquote when pressing enter on an empty marker line', () => {
    const doc = markdownToDoc('>hello\n>');
    const pos = getParagraphEndPos(doc, 1);
    const state = EditorState.create({
      doc,
      schema,
      selection: TextSelection.create(doc, pos),
    });

    let nextState = state;
    markdownEnterKeymap(state, (tr) => {
      nextState = state.apply(tr);
    });

    expect(docToMarkdown(nextState.doc)).toBe('>hello\n\n');
  });
});

describe('markdown list tab keymap', () => {
  it('indents the first list item in place', () => {
    const doc = markdownToDoc('- item');
    const pos = getParagraphEndPos(doc, 0);
    const state = EditorState.create({
      doc,
      schema,
      selection: TextSelection.create(doc, pos),
    });

    let nextState = state;
    markdownListTabKeymap(state, (tr) => {
      nextState = state.apply(tr);
    });

    expect(docToMarkdown(nextState.doc)).toBe('    - item');
  });

  it('indents a bullet list item to create a sub-item', () => {
    const doc = markdownToDoc('- parent\n- child');
    const pos = getParagraphEndPos(doc, 1);
    const state = EditorState.create({
      doc,
      schema,
      selection: TextSelection.create(doc, pos),
    });

    let nextState = state;
    markdownListTabKeymap(state, (tr) => {
      nextState = state.apply(tr);
    });

    expect(docToMarkdown(nextState.doc)).toBe('- parent\n    - child');
  });

  it('indents the first bullet item when the cursor is on the first line', () => {
    const doc = markdownToDoc('- parent\n- child');
    const pos = getParagraphEndPos(doc, 0);
    const state = EditorState.create({
      doc,
      schema,
      selection: TextSelection.create(doc, pos),
    });

    let nextState = state;
    markdownListTabKeymap(state, (tr) => {
      nextState = state.apply(tr);
    });

    expect(docToMarkdown(nextState.doc)).toBe('    - parent\n- child');
  });

  it('indents an ordered list item to create a sub-item', () => {
    const doc = markdownToDoc('1. first\n2. second\n3. third');
    const pos = getParagraphEndPos(doc, 1);
    const state = EditorState.create({
      doc,
      schema,
      selection: TextSelection.create(doc, pos),
    });

    let nextState = state;
    markdownListTabKeymap(state, (tr) => {
      nextState = state.apply(tr);
    });

    expect(docToMarkdown(nextState.doc)).toBe('1. first\n    1. second\n2. third');
  });

  it('outdents a nested ordered list item with correct numbering', () => {
    const doc = markdownToDoc('1. first\n    1. second\n2. third');
    const pos = getParagraphEndPos(doc, 1);
    const state = EditorState.create({
      doc,
      schema,
      selection: TextSelection.create(doc, pos),
    });

    let nextState = state;
    markdownListShiftTabKeymap(state, (tr) => {
      nextState = state.apply(tr);
    });

    expect(docToMarkdown(nextState.doc)).toBe('1. first\n2. second\n3. third');
  });

  it('indents a task list item to create a sub-item', () => {
    const doc = markdownToDoc('- [ ] parent\n- [x] child');
    const pos = getParagraphEndPos(doc, 1);
    const state = EditorState.create({
      doc,
      schema,
      selection: TextSelection.create(doc, pos),
    });

    let nextState = state;
    markdownListTabKeymap(state, (tr) => {
      nextState = state.apply(tr);
    });

    expect(docToMarkdown(nextState.doc)).toBe('- [ ] parent\n    - [x] child');
  });

  it('outdents an indented list item', () => {
    const doc = markdownToDoc('- parent\n    - child');
    const pos = getParagraphEndPos(doc, 1);
    const state = EditorState.create({
      doc,
      schema,
      selection: TextSelection.create(doc, pos),
    });

    let nextState = state;
    markdownListShiftTabKeymap(state, (tr) => {
      nextState = state.apply(tr);
    });

    expect(docToMarkdown(nextState.doc)).toBe('- parent\n- child');
  });
});

function getParagraphEndPos(doc: ReturnType<typeof markdownToDoc>, paragraphIndex: number): number {
  let pos = 1;

  for (let i = 0; i < paragraphIndex; i += 1) {
    pos += doc.child(i).nodeSize;
  }

  return pos + doc.child(paragraphIndex).textContent.length;
}
