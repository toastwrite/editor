import {
  chainCommands,
  createParagraphNear,
  liftEmptyBlock,
  newlineInCode,
  splitBlock,
} from 'prosemirror-commands';
import type { Command } from 'prosemirror-state';
import type { EditorState, Transaction } from 'prosemirror-state';
import { TextSelection } from 'prosemirror-state';
import { markdownLineSchema as schema } from './schema.js';
import { getBlockquotePrefix, isEmptyBlockquoteLine, parseBlockquoteLine } from './blockquote-utils.js';
import {
  indentListLine,
  getNextListPrefix,
  LIST_INDENT,
  outdentListLine,
  parseListLine,
  buildListLine,
  buildListPrefix,
} from './list-utils.js';
import { markdownToDoc, markdownOffsetToPos } from './doc-bridge.js';

const defaultEnterKeymap = chainCommands(
  newlineInCode,
  createParagraphNear,
  liftEmptyBlock,
  splitBlock
);

function getParagraphIndex($from: import('prosemirror-state').Selection['$from']): number {
  return $from.index(Math.max(0, $from.depth - 1));
}

function getLineTexts(state: EditorState): string[] {
  const lines: string[] = [];
  state.doc.forEach((node) => {
    lines.push(node.textContent);
  });
  return lines;
}

function lineStartOffset(lines: string[], lineIndex: number): number {
  let offset = 0;

  for (let index = 0; index < lineIndex; index += 1) {
    offset += lines[index].length + 1;
  }

  return offset;
}

function replaceDocumentFromLines(
  state: EditorState,
  dispatch: ((tr: Transaction) => void) | undefined,
  lines: string[],
  cursorMarkdownOffset: number
): boolean {
  const nextDoc = markdownToDoc(lines.join('\n'));
  const tr = state.tr.replaceWith(0, state.doc.content.size, nextDoc.content);
  const cursorPos = markdownOffsetToPos(tr.doc, cursorMarkdownOffset);

  dispatch?.(
    tr.setSelection(
      TextSelection.create(tr.doc, Math.min(Math.max(cursorPos, 1), tr.doc.content.size - 1))
    )
  );
  return true;
}

function replaceCurrentParagraphText(
  state: EditorState,
  dispatch: ((tr: Transaction) => void) | undefined,
  $from: import('prosemirror-state').Selection['$from'],
  nextText: string,
  cursorPos: number
): boolean {
  const tr = state.tr.replaceWith($from.start(), $from.end(), schema.text(nextText));
  dispatch?.(
    tr.setSelection(
      TextSelection.create(tr.doc, Math.min(Math.max(cursorPos, 1), tr.doc.content.size - 1))
    )
  );
  return true;
}

function countOrderedAtIndentBefore(lines: string[], beforeIndex: number, indent: string): number {
  let count = 0;

  for (let index = 0; index < beforeIndex; index += 1) {
    const info = parseListLine(lines[index]);
    if (info?.type === 'ordered' && info.indent === indent) {
      count += 1;
    }
  }

  return count;
}

function renumberOrderedSiblingsAfter(lines: string[], afterIndex: number, indent: string): void {
  let number = countOrderedAtIndentBefore(lines, afterIndex + 1, indent) + 1;

  for (let index = afterIndex + 1; index < lines.length; index += 1) {
    const info = parseListLine(lines[index]);
    if (!info || info.type !== 'ordered' || info.indent !== indent) {
      break;
    }

    lines[index] = buildListLine({ ...info, number }, info.content);
    number += 1;
  }
}

function renumberOrderedSiblingsFrom(lines: string[], fromIndex: number, indent: string): void {
  let number = countOrderedAtIndentBefore(lines, fromIndex, indent) + 1;

  for (let index = fromIndex; index < lines.length; index += 1) {
    const info = parseListLine(lines[index]);
    if (!info || info.type !== 'ordered' || info.indent !== indent) {
      break;
    }

    lines[index] = buildListLine({ ...info, number }, info.content);
    number += 1;
  }
}

export const markdownBlockquoteEnterKeymap: Command = (state, dispatch) => {
  const { selection } = state;
  if (!selection.empty) {
    return false;
  }

  const { $from } = selection;
  if ($from.parent.type !== schema.nodes.paragraph) {
    return false;
  }

  const lineText = $from.parent.textContent;
  const info = parseBlockquoteLine(lineText);
  if (!info) {
    return false;
  }

  const cursorInLine = $from.parentOffset;
  const blockIndex = getParagraphIndex($from);
  const lines = getLineTexts(state);

  if (isEmptyBlockquoteLine(info)) {
    lines.splice(blockIndex, 1, '', '');
    return replaceDocumentFromLines(state, dispatch, lines, lineStartOffset(lines, blockIndex + 1));
  }

  const before = lineText.slice(0, cursorInLine);
  const after = lineText.slice(cursorInLine).replace(/^\s+/, '');
  const nextPrefix = getBlockquotePrefix(info);

  lines[blockIndex] = before;
  lines.splice(blockIndex + 1, 0, `${nextPrefix}${after}`);

  return replaceDocumentFromLines(
    state,
    dispatch,
    lines,
    lineStartOffset(lines, blockIndex + 1) + nextPrefix.length
  );
};

export const markdownListEnterKeymap: Command = (state, dispatch) => {
  const { selection } = state;
  if (!selection.empty) {
    return false;
  }

  const { $from } = selection;
  if ($from.parent.type !== schema.nodes.paragraph) {
    return false;
  }

  const lineText = $from.parent.textContent;
  const info = parseListLine(lineText);
  if (!info) {
    return false;
  }

  const cursorInLine = $from.parentOffset;
  const blockIndex = getParagraphIndex($from);
  const lines = getLineTexts(state);

  if (!info.content.trim()) {
    lines.splice(blockIndex, 1, '', '');
    return replaceDocumentFromLines(state, dispatch, lines, lineStartOffset(lines, blockIndex + 1));
  }

  const before = lineText.slice(0, cursorInLine);
  const after = lineText.slice(cursorInLine).replace(/^\s+/, '');
  const nextPrefix = getNextListPrefix(info);

  lines[blockIndex] = before;
  lines.splice(blockIndex + 1, 0, `${nextPrefix}${after}`);

  return replaceDocumentFromLines(
    state,
    dispatch,
    lines,
    lineStartOffset(lines, blockIndex + 1) + nextPrefix.length
  );
};

export const markdownListTabKeymap: Command = (state, dispatch) => {
  const { selection } = state;
  if (!selection.empty) {
    return false;
  }

  const { $from } = selection;
  if ($from.parent.type !== schema.nodes.paragraph) {
    return false;
  }

  const lineText = $from.parent.textContent;
  const info = parseListLine(lineText);
  if (!info) {
    return false;
  }

  const blockIndex = getParagraphIndex($from);
  const indentedLine = indentListLine(lineText);
  const cursorPos = selection.from + LIST_INDENT.length;

  if (info.type === 'ordered') {
    const lines = getLineTexts(state);
    const indentedInfo = parseListLine(indentedLine)!;
    const newIndent = indentedInfo.indent;
    lines[blockIndex] = buildListLine({ ...indentedInfo, number: 1 }, indentedInfo.content);
    renumberOrderedSiblingsAfter(lines, blockIndex, info.indent);
    renumberOrderedSiblingsFrom(lines, blockIndex + 1, newIndent);

    const oldPrefixLen = buildListPrefix(info).length;
    const contentOffset = $from.parentOffset - oldPrefixLen;
    const newPrefix = buildListPrefix({ ...indentedInfo, number: 1 });
    const cursorMarkdownOffset =
      lineStartOffset(lines, blockIndex) + newPrefix.length + contentOffset;

    return replaceDocumentFromLines(state, dispatch, lines, cursorMarkdownOffset);
  }

  return replaceCurrentParagraphText(state, dispatch, $from, indentedLine, cursorPos);
};

export const markdownListShiftTabKeymap: Command = (state, dispatch) => {
  const { selection } = state;
  if (!selection.empty) {
    return false;
  }

  const { $from } = selection;
  if ($from.parent.type !== schema.nodes.paragraph) {
    return false;
  }

  const lineText = $from.parent.textContent;
  const info = parseListLine(lineText);
  if (!info) {
    return false;
  }

  const outdented = outdentListLine(lineText);
  if (outdented === null) {
    return false;
  }

  const removedSpaces = Math.min(LIST_INDENT.length, info.indent.length);
  const blockIndex = getParagraphIndex($from);
  const newIndent = outdented.match(/^(\s*)/)?.[1] ?? '';
  const cursorPos = Math.max(selection.from - removedSpaces, $from.start());

  if (info.type === 'ordered') {
    const lines = getLineTexts(state);
    const outdentedInfo = parseListLine(outdented)!;
    const newNumber = countOrderedAtIndentBefore(lines, blockIndex, newIndent) + 1;
    lines[blockIndex] = buildListLine({ ...outdentedInfo, number: newNumber }, outdentedInfo.content);
    renumberOrderedSiblingsFrom(lines, blockIndex + 1, newIndent);
    renumberOrderedSiblingsAfter(lines, blockIndex, info.indent);

    const oldPrefixLen = buildListPrefix(info).length;
    const contentOffset = $from.parentOffset - oldPrefixLen;
    const newPrefix = buildListPrefix({ ...outdentedInfo, number: newNumber });
    const cursorMarkdownOffset =
      lineStartOffset(lines, blockIndex) + newPrefix.length + contentOffset;

    return replaceDocumentFromLines(state, dispatch, lines, cursorMarkdownOffset);
  }

  return replaceCurrentParagraphText(state, dispatch, $from, outdented, cursorPos);
};

export const markdownTabKeymap: Command = (state, dispatch, view) => {
  if (markdownListTabKeymap(state, dispatch, view)) {
    return true;
  }

  const { selection } = state;
  if (!selection.empty) {
    return false;
  }

  dispatch?.(state.tr.insertText(LIST_INDENT, selection.from, selection.to));
  return true;
};

export const markdownShiftTabKeymap: Command = (state, dispatch, view) => {
  if (markdownListShiftTabKeymap(state, dispatch, view)) {
    return true;
  }

  const { selection } = state;
  const { $from } = selection;
  const lineStart = $from.start();
  const beforeCursor = state.doc.textBetween(lineStart, selection.from);
  const removed = beforeCursor.match(new RegExp(` {1,${LIST_INDENT.length}}$`))?.[0];

  if (!removed) {
    return false;
  }

  dispatch?.(state.tr.delete(selection.from - removed.length, selection.from));
  return true;
};

export const markdownEnterKeymap: Command = (state, dispatch, view) => {
  if (markdownBlockquoteEnterKeymap(state, dispatch, view)) {
    return true;
  }

  if (markdownListEnterKeymap(state, dispatch, view)) {
    return true;
  }

  return defaultEnterKeymap(state, dispatch, view);
};
