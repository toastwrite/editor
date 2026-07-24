import { describe, expect, it } from 'vitest';
import { collectHtmlHighlightRanges } from '../markdown/html-highlight.js';
import { markdownLineSchema as schema } from '../markdown/schema.js';

describe('html highlight', () => {
  it('highlights tags, attributes, and quoted values', () => {
    const line = '<div style="color: red">text</div>';
    const ranges = collectHtmlHighlightRanges(0, line, () => false);

    expect(ranges.some((range) => range.mark.eq(schema.marks.htmlTag.create()))).toBe(true);
    expect(ranges.some((range) => range.mark.eq(schema.marks.htmlAttr.create()))).toBe(true);
    expect(ranges.some((range) => range.mark.eq(schema.marks.htmlAttrValue.create()))).toBe(true);

    const styleAttr = ranges.find(
      (range) =>
        range.mark.eq(schema.marks.htmlAttr.create()) &&
        line.slice(range.from, range.to) === 'style'
    );
    const styleValue = ranges.find(
      (range) =>
        range.mark.eq(schema.marks.htmlAttrValue.create()) &&
        line.slice(range.from, range.to) === '="color: red"'
    );

    expect(styleAttr).toBeTruthy();
    expect(styleValue).toBeTruthy();
  });

  it('highlights self-closing tags', () => {
    const line = '<hr />';
    const ranges = collectHtmlHighlightRanges(0, line, () => false);

    expect(ranges.filter((range) => range.mark.eq(schema.marks.htmlTag.create())).length).toBeGreaterThan(
      0
    );
  });

  it('skips markdown autolinks', () => {
    const line = 'Visit <https://example.com> today';
    const ranges = collectHtmlHighlightRanges(0, line, () => false);

    expect(ranges).toHaveLength(0);
  });
});
