import { describe, expect, it } from 'vitest';
import { EditorState } from 'prosemirror-state';
import { ContentService } from '../services/content-service.js';
import { collectTransactionEditResults } from '../markdown/document-edit.js';
import {
  docToMarkdown,
  markdownToDoc,
  replaceDocumentFromMarkdown,
} from '../markdown/doc-bridge.js';
import { executeMarkdownCommand } from '../commands/markdown-commands.js';
import { markdownLineSchema as schema } from '../markdown/schema.js';

describe('heading space pipeline', () => {
  it('executeMarkdownCommand includes a trailing space', () => {
    const result = executeMarkdownCommand('Hello', { start: 0, end: 5 }, 'heading1');
    expect(result?.value).toBe('# Hello');
  });

  it('replaceDocumentFromMarkdown preserves trailing space in the editor doc', () => {
    const doc = markdownToDoc('Hello');
    const state = EditorState.create({ doc, schema });
    const result = executeMarkdownCommand('Hello', { start: 0, end: 5 }, 'heading1');
    const tr = replaceDocumentFromMarkdown(state.tr, result!.value, result!.selection);

    expect(docToMarkdown(tr.doc)).toBe('# Hello');
    expect(tr.doc.textContent).toBe('# Hello');
  });

  it('collectTransactionEditResults keeps trailing space in ToastMark line texts', () => {
    const content = new ContentService({ initialValue: 'Hello' });
    const doc = markdownToDoc('Hello');
    const state = EditorState.create({ doc, schema });
    const result = executeMarkdownCommand('Hello', { start: 0, end: 5 }, 'heading1');
    const tr = replaceDocumentFromMarkdown(state.tr, result!.value, result!.selection);

    collectTransactionEditResults(content, tr);

    expect(content.getMarkdown()).toBe('# Hello');
  });

  it('empty line heading keeps trailing space through the replace transaction', () => {
    const content = new ContentService({ initialValue: '' });
    const doc = markdownToDoc('');
    const state = EditorState.create({ doc, schema });
    const result = executeMarkdownCommand('', { start: 0, end: 0 }, 'heading1');
    const tr = replaceDocumentFromMarkdown(state.tr, result!.value, result!.selection);

    expect(docToMarkdown(tr.doc)).toBe('# ');
    collectTransactionEditResults(content, tr);
    expect(content.getMarkdown()).toBe('# ');
  });
});
