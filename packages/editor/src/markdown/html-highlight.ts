import type { Mark } from 'prosemirror-model';
import { markdownLineSchema as schema } from './schema.js';

export interface HtmlHighlightRange {
  from: number;
  to: number;
  mark: Mark;
}

const RE_AUTOLINK_PREFIX = /^<\/?(?:https?:|mailto:|ftp:)/i;

function isValidTagName(name: string): boolean {
  return /^[A-Za-z][\w:-]*$/.test(name) && !/^(https?|mailto|ftp)$/i.test(name);
}

function addRange(ranges: HtmlHighlightRange[], from: number, to: number, mark: Mark): void {
  if (from < to) {
    ranges.push({ from, to, mark });
  }
}

function highlightHtmlAttributes(
  ranges: HtmlHighlightRange[],
  lineStart: number,
  attrText: string,
  attrTextStart: number
): void {
  let index = 0;

  while (index < attrText.length) {
    while (index < attrText.length && /\s/.test(attrText[index])) {
      index += 1;
    }

    if (index >= attrText.length || attrText[index] === '/') {
      break;
    }

    const nameStart = index;
    while (index < attrText.length && /[A-Za-z0-9:_-]/.test(attrText[index])) {
      index += 1;
    }

    const name = attrText.slice(nameStart, index);
    if (!name) {
      index += 1;
      continue;
    }

    addRange(
      ranges,
      lineStart + attrTextStart + nameStart,
      lineStart + attrTextStart + index,
      schema.marks.htmlAttr.create()
    );

    while (index < attrText.length && /\s/.test(attrText[index])) {
      index += 1;
    }

    if (attrText[index] !== '=') {
      continue;
    }

    const valueStart = index;
    index += 1;

    while (index < attrText.length && /\s/.test(attrText[index])) {
      index += 1;
    }

    if (attrText[index] === '"' || attrText[index] === "'") {
      const quote = attrText[index];
      index += 1;

      while (index < attrText.length && attrText[index] !== quote) {
        index += 1;
      }

      if (index < attrText.length) {
        index += 1;
      }
    } else {
      while (index < attrText.length && !/\s/.test(attrText[index])) {
        index += 1;
      }
    }

    addRange(
      ranges,
      lineStart + attrTextStart + valueStart,
      lineStart + attrTextStart + index,
      schema.marks.htmlAttrValue.create()
    );
  }
}

export function collectHtmlHighlightRanges(
  lineStart: number,
  line: string,
  overlapsProtected: (from: number, to: number) => boolean
): HtmlHighlightRange[] {
  const ranges: HtmlHighlightRange[] = [];
  let index = 0;

  while (index < line.length) {
    if (line[index] !== '<') {
      index += 1;
      continue;
    }

    const tagStart = index;
    const remainder = line.slice(tagStart);

    if (RE_AUTOLINK_PREFIX.test(remainder) || remainder.startsWith('<!--')) {
      index += 1;
      continue;
    }

    index += 1;
    const hasClosingSlash = line[index] === '/';

    if (hasClosingSlash) {
      index += 1;
    }

    const tagNameStart = index;
    while (index < line.length && /[A-Za-z0-9:_-]/.test(line[index])) {
      index += 1;
    }

    const tagName = line.slice(tagNameStart, index);
    if (!isValidTagName(tagName)) {
      index = tagStart + 1;
      continue;
    }

    const attrTextStart = index;
    while (index < line.length && line[index] !== '>') {
      index += 1;
    }

    if (index >= line.length) {
      break;
    }

    const tagEnd = index + 1;
    const absoluteTagStart = lineStart + tagStart;
    const absoluteTagEnd = lineStart + tagEnd;

    if (overlapsProtected(absoluteTagStart, absoluteTagEnd)) {
      index = tagEnd;
      continue;
    }

    const htmlTagMark = schema.marks.htmlTag.create();
    addRange(ranges, absoluteTagStart, absoluteTagStart + 1, htmlTagMark);

    if (hasClosingSlash) {
      addRange(ranges, absoluteTagStart + 1, absoluteTagStart + 2, htmlTagMark);
    }

    addRange(
      ranges,
      lineStart + tagNameStart,
      lineStart + tagNameStart + tagName.length,
      htmlTagMark
    );

    const attrText = line.slice(attrTextStart, index).trimEnd();
    if (attrText) {
      highlightHtmlAttributes(ranges, lineStart, attrText, attrTextStart);
    }

    if (attrText.endsWith('/')) {
      addRange(ranges, absoluteTagEnd - 2, absoluteTagEnd - 1, htmlTagMark);
    }

    addRange(ranges, absoluteTagEnd - 1, absoluteTagEnd, htmlTagMark);
    index = tagEnd;
  }

  return ranges;
}
