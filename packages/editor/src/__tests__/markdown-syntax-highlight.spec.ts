import type { EditResult } from '@toastwrite/parser';
import { describe, expect, it } from 'vitest';
import { DOMSerializer } from 'prosemirror-model';
import { EditorState } from 'prosemirror-state';
import { markdownLineSchema as schema } from '../markdown/schema.js';
import {
  applySyntaxHighlight,
  applySyntaxHighlightForEditResults,
} from '../markdown/syntax-highlight.js';
import { markdownToDoc } from '../markdown/doc-bridge.js';

describe('markdown syntax highlight', () => {
  it('applies link and list classes', () => {
    const doc = markdownToDoc('- item\n[link](https://example.com)');
    const state = EditorState.create({ doc, schema });
    const tr = applySyntaxHighlight(state);

    expect(tr).toBeTruthy();

    const nextState = state.apply(tr!);
    const html = serializeDoc(nextState);

    expect(html).toContain('toastwrite-editor-md-list-item-odd');
    expect(html).toContain('toastwrite-editor-md-link-desc');
    expect(html).toContain('toastwrite-editor-md-link-url');
  });

  it('applies inline code and code block classes', () => {
    const doc = markdownToDoc('Use `code`\n```js\nconst x = 1;\n```');
    const state = EditorState.create({ doc, schema });
    const tr = applySyntaxHighlight(state);
    const nextState = state.apply(tr!);
    const html = serializeDoc(nextState);

    expect(html).toContain('toastwrite-editor-md-code');
    expect(html).toContain('toastwrite-editor-md-code-block');
    expect(html).toContain('toastwrite-editor-md-code-block-line-background');
  });

  it('applies emphasis, table, and task list classes', () => {
    const doc = markdownToDoc(
      '**Bold**, *italic*, ~~strike~~\n| A | B |\n| --- | --- |\n- [x] Done\n- [ ] Todo'
    );
    const state = EditorState.create({ doc, schema });
    const tr = applySyntaxHighlight(state);
    const nextState = state.apply(tr!);
    const html = serializeDoc(nextState);

    expect(html).toContain('toastwrite-editor-md-strong');
    expect(html).toContain('toastwrite-editor-md-emph');
    expect(html).toContain('toastwrite-editor-md-strike');
    expect(html).toContain('toastwrite-editor-md-table');
    expect(html).toContain('toastwrite-editor-md-table-cell');
    expect(html).toContain('toastwrite-editor-md-delimiter');
    expect(html).toContain('toastwrite-editor-md-meta');
  });

  it('applies blockquote marker class', () => {
    const doc = markdownToDoc('> quoted text');
    const state = EditorState.create({ doc, schema });
    const tr = applySyntaxHighlight(state);
    const nextState = state.apply(tr!);
    const html = serializeDoc(nextState);

    expect(html).toContain('toastwrite-editor-md-blockquote-marker');
    expect(html).toContain('toastwrite-editor-md-marked-text');
  });

  it('applies blockquote marker class without a space after >', () => {
    const doc = markdownToDoc('>hello');
    const state = EditorState.create({ doc, schema });
    const tr = applySyntaxHighlight(state);
    const nextState = state.apply(tr!);
    const html = serializeDoc(nextState);

    expect(html).toContain('toastwrite-editor-md-blockquote-marker');
    expect(html).toContain('toastwrite-editor-md-marked-text');
  });

  it('applies html tag, attribute, and attribute value classes', () => {
    const doc = markdownToDoc('<p style="color: red">Hello</p>');
    const state = EditorState.create({ doc, schema });
    const tr = applySyntaxHighlight(state);
    const nextState = state.apply(tr!);
    const html = serializeDoc(nextState);

    expect(html).toContain('toastwrite-editor-md-html-tag');
    expect(html).toContain('toastwrite-editor-md-html-attr');
    expect(html).toContain('toastwrite-editor-md-html-attr-value');
  });

  it('applies code block background to interior lines during incremental highlight', () => {
    const doc = markdownToDoc('```js\nconst x = 1');
    const state = EditorState.create({ doc, schema });
    const tr = applySyntaxHighlightForEditResults(state, [
      {
        nodes: [{ sourcepos: [[2, 1], [2, 12]] } as EditResult['nodes'][number]],
        removedNodeRange: null,
      },
    ]);

    expect(tr).toBeTruthy();

    const nextState = state.apply(tr!);

    expect(nextState.doc.child(0).attrs.lineBackground).toContain('code-block-line-background');
    expect(nextState.doc.child(1).attrs.lineBackground).toBe('code-block-line-background');
  });

  it('styles link parentheses as delimiters, not as url text', () => {
    const doc = markdownToDoc('![Toastwrite Editor](https://example.com/x.png)');
    const state = EditorState.create({ doc, schema });
    const tr = applySyntaxHighlight(state);
    const nextState = state.apply(tr!);
    const html = serializeDoc(nextState);

    expect(html).toContain(
      '<span class="toastwrite-editor-md-link">](</span><span class="toastwrite-editor-md-link toastwrite-editor-md-link-url toastwrite-editor-md-marked-text">https://example.com/x.png</span><span class="toastwrite-editor-md-link">)</span>'
    );
    expect(html).not.toMatch(/toastwrite-editor-md-link-url[^"]*">\(/);
  });

  it('does not highlight html inside inline code', () => {
    const doc = markdownToDoc('Use `<div>` in markdown');
    const state = EditorState.create({ doc, schema });
    const tr = applySyntaxHighlight(state);
    const nextState = state.apply(tr!);
    const html = serializeDoc(nextState);

    expect(html).toContain('toastwrite-editor-md-code');
    expect(html).not.toContain('toastwrite-editor-md-html-tag');
  });
});

function serializeDoc(state: EditorState): string {
  const div = document.createElement('div');
  const fragment = DOMSerializer.fromSchema(schema).serializeFragment(state.doc.content);
  div.appendChild(fragment);
  return div.innerHTML;
}
