import type { SelectionPos } from '../types.js';

export interface TextareaEditResult {
  value: string;
  selection: SelectionPos;
}

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

const RE_HEADING = /^#{1,6}\s*/;
const RE_BULLET_LIST = /^(\s*)([-*+] )(.*)$/;
const RE_ORDERED_LIST = /^(\s*)(\d+)\. (.*)$/;

export function getLineBounds(value: string, position: number): { start: number; end: number } {
  const start = value.lastIndexOf('\n', position - 1) + 1;
  const nextBreak = value.indexOf('\n', position);
  const end = nextBreak === -1 ? value.length : nextBreak;
  return { start, end };
}

export function setHeadingLevelLines(
  value: string,
  selection: SelectionPos,
  level: HeadingLevel
): TextareaEditResult {
  const { start, end } = selection;
  const lineStart = getLineBounds(value, start).start;
  const lineEnd = getLineBounds(value, end).end;
  const block = value.slice(lineStart, lineEnd);
  const headingPrefix = `${'#'.repeat(level)} `;

  const converted = block
    .split('\n')
    .map((line) => {
      const content = line.replace(RE_HEADING, '').trim();
      return content ? `${headingPrefix}${content}` : headingPrefix;
    })
    .join('\n');

  const nextValue = value.slice(0, lineStart) + converted + value.slice(lineEnd);
  const offset = converted.length - block.length;
  const lineWasEmpty = block.split('\n').every((line) => !line.replace(RE_HEADING, '').trim());
  const selectionStart = lineWasEmpty ? lineStart + headingPrefix.length : start + offset;
  const selectionEnd = lineWasEmpty ? lineStart + headingPrefix.length : end + offset;

  return {
    value: nextValue,
    selection: {
      start: selectionStart,
      end: selectionEnd,
    },
  };
}

export function handleListEnter(
  value: string,
  selection: SelectionPos
): TextareaEditResult | null {
  const { start } = selection;
  const { start: lineStart, end: lineEnd } = getLineBounds(value, start);
  const line = value.slice(lineStart, lineEnd);
  const cursorInLine = start - lineStart;

  const bulletMatch = line.match(RE_BULLET_LIST);
  const orderedMatch = line.match(RE_ORDERED_LIST);

  if (!bulletMatch && !orderedMatch) {
    return null;
  }

  const indent = bulletMatch?.[1] ?? orderedMatch![1];
  const content = bulletMatch?.[3] ?? orderedMatch![3];
  const isEmpty = !content.trim();

  if (isEmpty) {
    const nextValue = `${value.slice(0, lineStart)}\n${value.slice(lineEnd)}`;
    return {
      value: nextValue,
      selection: { start: lineStart + 1, end: lineStart + 1 },
    };
  }

  const before = line.slice(0, cursorInLine);
  const after = line.slice(cursorInLine);
  let nextPrefix: string;

  if (bulletMatch) {
    nextPrefix = `${indent}- `;
  } else {
    const nextNumber = Number(orderedMatch![2]) + 1;
    nextPrefix = `${indent}${nextNumber}. `;
  }

  const insert = `\n${nextPrefix}`;
  const nextValue = value.slice(0, lineStart) + before + insert + after + value.slice(lineEnd);
  const cursor = lineStart + before.length + insert.length;

  return {
    value: nextValue,
    selection: { start: cursor, end: cursor },
  };
}

function hasEdgeSpaces(text: string): boolean {
  return text.length > 0 && (text.startsWith(' ') || text.endsWith(' '));
}

function getWrappedSelectionRange(
  value: string,
  start: number,
  end: number,
  before: string,
  after: string
): { from: number; to: number; inner: string } | null {
  if (start === end) {
    return null;
  }

  const selected = value.slice(start, end);
  if (hasEdgeSpaces(selected)) {
    return null;
  }

  if (
    selected.length >= before.length + after.length &&
    selected.startsWith(before) &&
    selected.endsWith(after)
  ) {
    const inner = selected.slice(before.length, selected.length - after.length);
    if (hasEdgeSpaces(inner)) {
      return null;
    }

    return { from: start, to: end, inner };
  }

  if (start < before.length || end + after.length > value.length) {
    return null;
  }

  const prev = value.slice(start - before.length, start);
  const next = value.slice(end, end + after.length);
  if (prev !== before || next !== after) {
    return null;
  }

  if (before === '*' && after === '*') {
    const openingBold = value.slice(Math.max(0, start - 2), start);
    const closingBold = value.slice(end, end + 2);
    if (openingBold === '**' || closingBold === '**') {
      return null;
    }
  }

  return {
    from: start - before.length,
    to: end + after.length,
    inner: selected,
  };
}

export function wrapTextareaSelection(
  value: string,
  selection: SelectionPos,
  before: string,
  after: string,
  fallback = 'text'
): TextareaEditResult {
  const { start, end } = selection;
  const wrapped = getWrappedSelectionRange(value, start, end, before, after);

  if (wrapped) {
    const nextValue = value.slice(0, wrapped.from) + wrapped.inner + value.slice(wrapped.to);

    return {
      value: nextValue,
      selection: {
        start: wrapped.from,
        end: wrapped.from + wrapped.inner.length,
      },
    };
  }

  const selected = value.slice(start, end) || fallback;
  const nextValue = value.slice(0, start) + before + selected + after + value.slice(end);

  return {
    value: nextValue,
    selection: {
      start: start + before.length,
      end: start + before.length + selected.length,
    },
  };
}

export function prefixTextareaLines(
  value: string,
  selection: SelectionPos,
  prefix: string
): TextareaEditResult {
  const { start, end } = selection;
  const lineStart = getLineBounds(value, start).start;
  const lineEnd = getLineBounds(value, end).end;
  const block = value.slice(lineStart, lineEnd);
  const prefixed = block
    .split('\n')
    .map((line) => {
      if (!line.trim()) {
        return prefix.trimEnd();
      }
      return line.startsWith(prefix) ? line : `${prefix}${line}`;
    })
    .join('\n');

  const nextValue = value.slice(0, lineStart) + prefixed + value.slice(lineEnd);
  const offset = prefixed.length - block.length;

  return {
    value: nextValue,
    selection: {
      start: start + prefix.length,
      end: end + offset,
    },
  };
}

export function insertTextareaAtSelection(
  value: string,
  selection: SelectionPos,
  insert: string
): TextareaEditResult {
  const { start, end } = selection;
  const nextValue = value.slice(0, start) + insert + value.slice(end);

  return {
    value: nextValue,
    selection: {
      start: start + insert.length,
      end: start + insert.length,
    },
  };
}

export function wrapTextareaLines(
  value: string,
  selection: SelectionPos,
  before: string,
  after: string
): TextareaEditResult {
  const { start, end } = selection;
  const lineStart = getLineBounds(value, start).start;
  const lineEnd = getLineBounds(value, end).end;
  const block = value.slice(lineStart, lineEnd);
  const wrapped = `${before}\n${block}\n${after}`;
  const nextValue = value.slice(0, lineStart) + wrapped + value.slice(lineEnd);

  return {
    value: nextValue,
    selection: {
      start: lineStart + before.length + 1,
      end: lineStart + before.length + 1 + block.length,
    },
  };
}

function buildMarkdownTable(rows: number, cols: number): string {
  const safeRows = Math.max(2, rows);
  const safeCols = Math.max(2, cols);
  const emptyRow = `| ${Array.from({ length: safeCols }, () => '').join(' | ')} |`;
  const delimiter = `| ${Array.from({ length: safeCols }, () => '---').join(' | ')} |`;
  const body = Array.from({ length: safeRows - 1 }, () => emptyRow).join('\n');

  return `${emptyRow}\n${delimiter}\n${body}`;
}

function getTableInsertionAffixes(value: string, selection: SelectionPos): {
  prefix: string;
  suffix: string;
} {
  const { start } = selection;
  const suffix = '\n\n\n';

  if (start === 0) {
    return { prefix: '', suffix };
  }

  const { start: lineStart } = getLineBounds(value, start);
  const atLineStart = start === lineStart;

  if (!atLineStart) {
    return { prefix: '\n\n', suffix };
  }

  const previousLineEnd = lineStart - 1;
  if (previousLineEnd < 0) {
    return { prefix: '', suffix };
  }

  const previousLineStart = value.lastIndexOf('\n', previousLineEnd - 1) + 1;
  const previousLine = value.slice(previousLineStart, previousLineEnd);

  if (!previousLine.trim()) {
    return { prefix: '', suffix };
  }

  return { prefix: '\n', suffix };
}

export function insertMarkdownTable(
  value: string,
  selection: SelectionPos,
  rows = 3,
  cols = 3
): TextareaEditResult {
  const table = buildMarkdownTable(rows, cols);
  const { prefix, suffix } = getTableInsertionAffixes(value, selection);
  const insert = `${prefix}${table}${suffix}`;
  const { start, end } = selection;
  const nextValue = value.slice(0, start) + insert + value.slice(end);
  const cursor = start + prefix.length + 2;

  return {
    value: nextValue,
    selection: {
      start: cursor,
      end: cursor,
    },
  };
}

export function insertTaskListPrefix(
  value: string,
  selection: SelectionPos
): TextareaEditResult {
  const { start, end } = selection;
  const lineStart = getLineBounds(value, start).start;
  const lineEnd = getLineBounds(value, end).end;
  const line = value.slice(lineStart, lineEnd);

  if (start === end && !line.trim()) {
    return insertTextareaAtSelection(value, selection, '* [x] ');
  }

  return prefixTextareaLines(value, selection, '* [x] ');
}
