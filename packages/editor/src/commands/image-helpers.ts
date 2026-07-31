import type { SelectionPos } from '../types.js';
import { escapeTextForLink } from './link-helpers.js';
import type { TextareaEditResult } from './markdown-helpers.js';

export interface ImagePopupInitialValues {
  url: string;
  altText: string;
  altTextDisabled: boolean;
}

export interface MarkdownImageMatch {
  url: string;
  altText: string;
  range: SelectionPos;
}

const RE_MARKDOWN_IMAGE = /!\[([^\]]*)\]\(([^)]*)\)/g;

export function findMarkdownImageAtSelection(
  value: string,
  selection: SelectionPos
): MarkdownImageMatch | null {
  const { start, end } = selection;
  const pattern = new RegExp(RE_MARKDOWN_IMAGE.source, 'g');
  let match = pattern.exec(value);

  while (match) {
    const imageStart = match.index;
    const imageEnd = match.index + match[0].length;

    if (start <= imageEnd && end >= imageStart) {
      return {
        url: match[2],
        altText: match[1],
        range: { start: imageStart, end: imageEnd },
      };
    }

    match = pattern.exec(value);
  }

  return null;
}

export function getImagePopupInitialValues(
  value: string,
  selection: SelectionPos
): ImagePopupInitialValues {
  const existing = findMarkdownImageAtSelection(value, selection);

  if (existing) {
    return {
      url: existing.url,
      altText: existing.altText,
      altTextDisabled: true,
    };
  }

  return {
    url: '',
    altText: value.slice(selection.start, selection.end),
    altTextDisabled: false,
  };
}

export function insertMarkdownImage(
  value: string,
  selection: SelectionPos,
  { url, altText }: { url: string; altText: string }
): TextareaEditResult {
  const existing = findMarkdownImageAtSelection(value, selection);
  const text = escapeTextForLink(altText);
  const syntax = `![${text}](${url})`;

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
