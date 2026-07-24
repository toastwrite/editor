import type { SelectionPos } from '../types.js';
import type { TextareaEditResult } from './markdown-helpers.js';

export interface LinkPopupInitialValues {
  url: string;
  linkText: string;
  linkTextDisabled: boolean;
}

export interface MarkdownLinkMatch {
  url: string;
  linkText: string;
  range: SelectionPos;
}

const RE_MD_IMAGE = /!\[.*\]\(.*\)/g;
const RE_ESCAPED_LINK_CHAR = /[[\]]/g;
const RE_MARKDOWN_LINK = /\[([^\]]*)\]\(([^)]*)\)/g;

export function escapeTextForLink(text: string): string {
  const imageRanges: Array<[number, number]> = [];
  let imageMatch = RE_MD_IMAGE.exec(text);

  while (imageMatch) {
    imageRanges.push([imageMatch.index, imageMatch.index + imageMatch[0].length]);
    imageMatch = RE_MD_IMAGE.exec(text);
  }

  return text.replace(RE_ESCAPED_LINK_CHAR, (matched, offset) => {
    const insideImage = imageRanges.some(([start, end]) => offset > start && offset < end);
    return insideImage ? matched : `\\${matched}`;
  });
}

export function findMarkdownLinkAtSelection(
  value: string,
  selection: SelectionPos
): MarkdownLinkMatch | null {
  const { start, end } = selection;
  const pattern = new RegExp(RE_MARKDOWN_LINK.source, 'g');
  let match = pattern.exec(value);

  while (match) {
    const linkStart = match.index;
    const linkEnd = match.index + match[0].length;

    if (start <= linkEnd && end >= linkStart) {
      return {
        url: match[2],
        linkText: match[1],
        range: { start: linkStart, end: linkEnd },
      };
    }

    match = pattern.exec(value);
  }

  return null;
}

export function getLinkPopupInitialValues(
  value: string,
  selection: SelectionPos
): LinkPopupInitialValues {
  const existing = findMarkdownLinkAtSelection(value, selection);

  if (existing) {
    return {
      url: existing.url,
      linkText: existing.linkText,
      linkTextDisabled: true,
    };
  }

  return {
    url: '',
    linkText: value.slice(selection.start, selection.end),
    linkTextDisabled: false,
  };
}

export function insertMarkdownLink(
  value: string,
  selection: SelectionPos,
  { url, linkText }: { url: string; linkText: string }
): TextareaEditResult {
  const existing = findMarkdownLinkAtSelection(value, selection);
  const text = escapeTextForLink(linkText);
  const syntax = `[${text}](${url})`;

  if (existing) {
    const { start, end } = existing.range;
    const nextValue = value.slice(0, start) + syntax + value.slice(end);

    return {
      value: nextValue,
      selection: {
        start: start + syntax.length,
        end: start + syntax.length,
      },
    };
  }

  const { start, end } = selection;
  const nextValue = value.slice(0, start) + syntax + value.slice(end);

  return {
    value: nextValue,
    selection: {
      start: start + syntax.length,
      end: start + syntax.length,
    },
  };
}
