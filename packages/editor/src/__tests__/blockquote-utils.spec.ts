import { describe, expect, it } from 'vitest';
import {
  getBlockquoteContentStart,
  getBlockquotePrefix,
  parseBlockquoteLine,
} from '../markdown/blockquote-utils.js';

describe('blockquote utils', () => {
  it('parses blockquote lines with a space after the marker', () => {
    expect(parseBlockquoteLine('> hello')).toEqual({
      indent: '',
      content: 'hello',
      spaced: true,
    });
  });

  it('parses blockquote lines without a space after the marker', () => {
    expect(parseBlockquoteLine('>hello')).toEqual({
      indent: '',
      content: 'hello',
      spaced: false,
    });
  });

  it('parses an empty blockquote marker line', () => {
    expect(parseBlockquoteLine('>')).toEqual({
      indent: '',
      content: '',
      spaced: false,
    });
    expect(parseBlockquoteLine('> ')).toEqual({
      indent: '',
      content: '',
      spaced: true,
    });
  });

  it('does not treat non-blockquote lines as blockquotes', () => {
    expect(parseBlockquoteLine('hello')).toBeNull();
    expect(parseBlockquoteLine('-> hello')).toBeNull();
  });

  it('preserves spaced and compact prefixes', () => {
    const spaced = parseBlockquoteLine('> hello')!;
    const compact = parseBlockquoteLine('>hello')!;

    expect(getBlockquotePrefix(spaced)).toBe('> ');
    expect(getBlockquotePrefix(compact)).toBe('>');
    expect(getBlockquoteContentStart(spaced)).toBe(2);
    expect(getBlockquoteContentStart(compact)).toBe(1);
  });
});
