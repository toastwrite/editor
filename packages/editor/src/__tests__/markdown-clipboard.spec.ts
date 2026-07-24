import { describe, expect, it } from 'vitest';
import { Slice, Fragment } from 'prosemirror-model';
import {
  docToMarkdown,
  markdownToDoc,
} from '../markdown/doc-bridge.js';
import {
  clipboardHtmlToPlainText,
  getClipboardText,
  mergeMarkdownPaste,
  normalizePastedPlainText,
  sliceToPlainMarkdownText,
} from '../markdown/clipboard.js';
import { markdownLineSchema as schema } from '../markdown/schema.js';

describe('markdown clipboard', () => {
  it('serializes copied lines with single newlines', () => {
    const doc = markdownToDoc('line1\nline2\nline3');
    const slice = new Slice(doc.content, 0, 0);

    expect(sliceToPlainMarkdownText(slice)).toBe('line1\nline2\nline3');
  });

  it('does not double-space lines like the default prosemirror serializer', () => {
    const doc = markdownToDoc('line1\nline2\nline3');
    const slice = new Slice(doc.content, 0, 0);

    expect(slice.content.textBetween(0, slice.content.size, '\n\n')).toBe(
      'line1\n\nline2\n\nline3'
    );
    expect(sliceToPlainMarkdownText(slice)).not.toContain('\n\n');
  });

  it('preserves blank lines when serializing', () => {
    const markdown = 'line1\n\nline3';
    const slice = new Slice(markdownToDoc(markdown).content, 0, 0);

    expect(sliceToPlainMarkdownText(slice)).toBe(markdown);
  });

  it('pastes copied markdown without inserting blank lines between every row', () => {
    const source = 'line1\nline2\nline3';
    const copiedText = sliceToPlainMarkdownText(new Slice(markdownToDoc(source).content, 0, 0));
    const { markdown } = mergeMarkdownPaste('', 0, 0, copiedText);

    expect(markdown).toBe(source);
    expect(docToMarkdown(markdownToDoc(markdown))).toBe(source);
  });

  it('merges pasted text into an existing document at the selection', () => {
    const current = 'before\nafter';
    const { markdown, selection } = mergeMarkdownPaste(current, 7, 7, 'middle\nline');

    expect(markdown).toBe('before\nmiddle\nlineafter');
    expect(selection).toEqual({ start: 18, end: 18 });
  });

  it('round-trips a multi-line copy and paste', () => {
    const source = 'alpha\nbeta\n\ngamma';
    const copiedText = sliceToPlainMarkdownText(new Slice(markdownToDoc(source).content, 0, 0));
    const { markdown } = mergeMarkdownPaste('', 0, 0, copiedText);

    expect(markdown).toBe(source);
  });

  it('serializes partial line selections', () => {
    const paragraph = schema.nodes.paragraph.create(null, schema.text('hello world'));
    const slice = new Slice(Fragment.from(paragraph.content.cut(6, 11)), 1, 1);

    expect(sliceToPlainMarkdownText(slice)).toBe('world');
  });

  it('collapses block-style plain text separated only by blank lines', () => {
    expect(normalizePastedPlainText('line1\n\nline2\n\nline3')).toBe('line1\nline2\nline3');
  });

  it('preserves single newlines from external plain text', () => {
    expect(normalizePastedPlainText('line1\nline2\nline3')).toBe('line1\nline2\nline3');
  });

  it('preserves intentional blank lines when mixed with single newlines', () => {
    expect(normalizePastedPlainText('alpha\nbeta\n\ngamma')).toBe('alpha\nbeta\n\ngamma');
  });

  it('normalizes Windows line endings', () => {
    expect(normalizePastedPlainText('line1\r\nline2\r\nline3')).toBe('line1\nline2\nline3');
  });

  it('extracts plain text from clipboard html with single newlines', () => {
    const html = '<meta charset="utf-8"><p>line1</p><p>line2</p><p>line3</p>';
    expect(clipboardHtmlToPlainText(html)).toBe('line1\nline2\nline3');
  });

  it('does not insert blank lines for nested block wrappers from external sites', () => {
    const html = `
      <div class="wrapper">
        <div class="content">
          <p>First paragraph</p>
          <p>Second paragraph</p>
        </div>
      </div>
    `;
    expect(clipboardHtmlToPlainText(html)).toBe('First paragraph\nSecond paragraph');
  });

  it('prefers html over double-spaced plain text from the browser', () => {
    const data = {
      getData(type: string) {
        if (type === 'text/plain') {
          return 'First paragraph\n\nSecond paragraph';
        }
        if (type === 'text/html') {
          return '<p>First paragraph</p><p>Second paragraph</p>';
        }
        return '';
      },
    } as DataTransfer;

    expect(getClipboardText(data)).toBe('First paragraph\nSecond paragraph');
  });

  it('falls back to plain text when html is empty', () => {
    const data = {
      getData(type: string) {
        if (type === 'text/plain') {
          return 'one\ntwo';
        }
        if (type === 'text/html') {
          return '';
        }
        return '';
      },
    } as DataTransfer;

    expect(getClipboardText(data)).toBe('one\ntwo');
  });

  it('falls back to html when plain text is empty', () => {
    const data = {
      getData(type: string) {
        if (type === 'text/plain') {
          return '';
        }
        if (type === 'text/html') {
          return '<p>one</p><p>two</p>';
        }
        return '';
      },
    } as DataTransfer;

    expect(getClipboardText(data)).toBe('one\ntwo');
  });
});
