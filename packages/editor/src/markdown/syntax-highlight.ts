import { Plugin } from 'prosemirror-state';
import type { EditResult } from '@toastwrite/parser';
import type { Node as ProseMirrorNode } from 'prosemirror-model';
import type { Mark } from 'prosemirror-model';
import { markdownLineSchema as schema, SYNTAX_MARK_TYPES } from './schema.js';
import { getBlockquoteContentStart, parseBlockquoteLine } from './blockquote-utils.js';
import { collectHtmlHighlightRanges } from './html-highlight.js';
import { LIST_INDENT } from './list-utils.js';
import { collectAffectedLineIndices, EDIT_RESULT_META } from './document-edit.js';

interface HighlightRange {
  from: number;
  to: number;
  mark: Mark;
}

interface ParagraphUpdate {
  index: number;
  lineBackground: string | null;
}

const RE_TASK_BULLET_LIST = /^(\s*)([-*+]) (\[[ xX]\] )(.*)$/;
const RE_BULLET_LIST = /^(\s*)([-*+]) (.*)$/;
const RE_TASK_ORDERED_LIST = /^(\s*)(\d+)(\. )(\[[ xX]\] )(.*)$/;
const RE_ORDERED_LIST = /^(\s*)(\d+)(\. )(.*)$/;
const RE_LINK = /(!?)\[([^\]]*)\]\(([^)]*)\)/g;
const RE_INLINE_CODE = /(`+)([^`]+)\1/g;
const RE_FENCE = /^(`{3,}|~{3,})(.*)$/;
const RE_STRONG = /\*\*([^*\n]+)\*\*/g;
const RE_STRIKE = /~~([^~\n]+)~~/g;
const RE_EMPH_ASTERISK = /(?<!\*)\*([^*\n]+)\*(?!\*)/g;
const RE_EMPH_UNDERSCORE = /(?<!_)_([^_\n]+)_(?!_)/g;
const RE_TABLE_LINE = /^\s*\|(.+\|)\s*$/;
const RE_TABLE_DELIM_LINE = /^\s*\|(\s*:?-+:?\s*\|)+\s*$/;

function rangeOverlapsProtected(ranges: HighlightRange[], from: number, to: number): boolean {
  return ranges.some((range) => {
    const markType = range.mark.type.name;

    if (markType !== 'code' && markType !== 'link') {
      return false;
    }

    return from < range.to && to > range.from;
  });
}

function addEmphasisMatch(
  ranges: HighlightRange[],
  lineStart: number,
  matchIndex: number,
  full: string,
  content: string,
  delimLen: number,
  markType: 'strong' | 'emph' | 'strike'
): void {
  const start = lineStart + matchIndex;
  const contentStart = start + delimLen;
  const contentEnd = contentStart + content.length;
  const end = start + full.length;

  if (rangeOverlapsProtected(ranges, start, end)) {
    return;
  }

  addRange(ranges, start, contentStart, schema.marks.delimiter.create());
  addRange(ranges, contentStart, contentEnd, schema.marks[markType].create());
  addRange(ranges, contentEnd, end, schema.marks.delimiter.create());
}

function highlightInlineEmphasis(ranges: HighlightRange[], lineStart: number, line: string): void {
  RE_STRONG.lastIndex = 0;
  let match = RE_STRONG.exec(line);
  while (match) {
    addEmphasisMatch(ranges, lineStart, match.index, match[0], match[1], 2, 'strong');
    match = RE_STRONG.exec(line);
  }

  RE_STRIKE.lastIndex = 0;
  match = RE_STRIKE.exec(line);
  while (match) {
    addEmphasisMatch(ranges, lineStart, match.index, match[0], match[1], 2, 'strike');
    match = RE_STRIKE.exec(line);
  }

  RE_EMPH_ASTERISK.lastIndex = 0;
  match = RE_EMPH_ASTERISK.exec(line);
  while (match) {
    addEmphasisMatch(ranges, lineStart, match.index, match[0], match[1], 1, 'emph');
    match = RE_EMPH_ASTERISK.exec(line);
  }

  RE_EMPH_UNDERSCORE.lastIndex = 0;
  match = RE_EMPH_UNDERSCORE.exec(line);
  while (match) {
    addEmphasisMatch(ranges, lineStart, match.index, match[0], match[1], 1, 'emph');
    match = RE_EMPH_UNDERSCORE.exec(line);
  }
}

function highlightTableLine(ranges: HighlightRange[], lineStart: number, line: string): boolean {
  const trimmed = line.trim();
  if (!RE_TABLE_LINE.test(trimmed) && !RE_TABLE_DELIM_LINE.test(trimmed)) {
    return false;
  }

  let index = 0;
  while (index < line.length) {
    const pipeIndex = line.indexOf('|', index);
    if (pipeIndex === -1) {
      break;
    }

    addRange(ranges, lineStart + pipeIndex, lineStart + pipeIndex + 1, schema.marks.table.create());

    const nextPipeIndex = line.indexOf('|', pipeIndex + 1);
    if (nextPipeIndex === -1) {
      break;
    }

    const cellStart = pipeIndex + 1;
    const cellEnd = nextPipeIndex;
    if (cellEnd > cellStart) {
      addRange(
        ranges,
        lineStart + cellStart,
        lineStart + cellEnd,
        schema.marks.tableCell.create()
      );
    }

    index = nextPipeIndex;
  }

  return true;
}

function highlightTaskDelimiter(ranges: HighlightRange[], taskStart: number): number {
  addRange(
    ranges,
    taskStart,
    taskStart + 3,
    schema.marks.taskDelimiter.create()
  );
  addRange(ranges, taskStart + 1, taskStart + 2, schema.marks.meta.create());

  return taskStart + 3;
}

function getParagraphNodePos(doc: ProseMirrorNode, index: number): number {
  let pos = 0;

  for (let i = 0; i < index; i += 1) {
    pos += doc.child(i).nodeSize;
  }

  return pos;
}

function getParagraphContentStart(doc: ProseMirrorNode, index: number): number {
  return getParagraphNodePos(doc, index) + 1;
}

function getListDepth(indent: string): number {
  const normalizedIndent = indent.replace(/\t/g, LIST_INDENT);
  return Math.floor(normalizedIndent.length / LIST_INDENT.length) + 1;
}

function addRange(ranges: HighlightRange[], from: number, to: number, mark: Mark): void {
  if (from < to) {
    ranges.push({ from, to, mark });
  }
}

function highlightBlockquoteLine(
  ranges: HighlightRange[],
  lineStart: number,
  line: string,
  inCodeBlock: boolean
): void {
  if (inCodeBlock) {
    return;
  }

  const info = parseBlockquoteLine(line);
  if (!info) {
    return;
  }

  const indent = info.indent;
  const markerStart = lineStart + indent.length;
  const contentStart = lineStart + getBlockquoteContentStart(info);

  addRange(
    ranges,
    markerStart,
    markerStart + 1,
    schema.marks.blockquote.create({ marker: true })
  );

  if (info.content) {
    addRange(ranges, contentStart, lineStart + line.length, schema.marks.markedText.create());
  }
}

function highlightListLine(
  ranges: HighlightRange[],
  lineStart: number,
  line: string,
  inCodeBlock: boolean
): void {
  if (inCodeBlock) {
    return;
  }

  const taskBulletMatch = line.match(RE_TASK_BULLET_LIST);
  const bulletMatch = taskBulletMatch ? null : line.match(RE_BULLET_LIST);
  const taskOrderedMatch = line.match(RE_TASK_ORDERED_LIST);
  const orderedMatch = taskOrderedMatch ? null : line.match(RE_ORDERED_LIST);
  const match = taskBulletMatch ?? bulletMatch ?? taskOrderedMatch ?? orderedMatch;
  if (!match) {
    return;
  }

  const indent = match[1];
  const depth = getListDepth(indent);
  const isOdd = depth % 2 === 1;
  let markerEnd: number;
  let content: string;
  let listStyleEnd: number;

  if (taskBulletMatch) {
    listStyleEnd = lineStart + indent.length + taskBulletMatch[2].length + 1;
    markerEnd = highlightTaskDelimiter(ranges, listStyleEnd) + 1;
    content = taskBulletMatch[4];
  } else if (bulletMatch) {
    listStyleEnd = lineStart + indent.length + bulletMatch[2].length + 1;
    markerEnd = listStyleEnd;
    content = bulletMatch[3];
  } else if (taskOrderedMatch) {
    listStyleEnd =
      lineStart + indent.length + taskOrderedMatch[2].length + taskOrderedMatch[3].length;
    markerEnd = highlightTaskDelimiter(ranges, listStyleEnd) + 1;
    content = taskOrderedMatch[5];
  } else {
    listStyleEnd = lineStart + indent.length + orderedMatch![2].length + orderedMatch![3].length;
    markerEnd = listStyleEnd;
    content = orderedMatch![4];
  }

  addRange(
    ranges,
    lineStart + indent.length,
    listStyleEnd,
    schema.marks.listItem.create({ listStyle: true, odd: isOdd, even: !isOdd })
  );

  if (content) {
    addRange(
      ranges,
      markerEnd,
      lineStart + line.length,
      schema.marks.markedText.create()
    );
  }
}

function highlightLinks(ranges: HighlightRange[], lineStart: number, line: string): void {
  RE_LINK.lastIndex = 0;
  let match = RE_LINK.exec(line);

  while (match) {
    const [full, bang, desc] = match;
    const start = lineStart + match.index;

    if (bang) {
      addRange(ranges, start, start + 1, schema.marks.meta.create());
    }

    addRange(ranges, start + bang.length, start + bang.length + 1, schema.marks.link.create());
    addRange(
      ranges,
      start + bang.length + 1,
      start + bang.length + 1 + desc.length,
      schema.marks.link.create({ desc: true })
    );
    addRange(
      ranges,
      start + bang.length + 1 + desc.length,
      start + bang.length + 2 + desc.length,
      schema.marks.link.create()
    );
    addRange(
      ranges,
      start + bang.length + 2 + desc.length,
      start + bang.length + 3 + desc.length,
      schema.marks.link.create()
    );
    addRange(
      ranges,
      start + bang.length + 3 + desc.length,
      start + full.length - 1,
      schema.marks.link.create({ url: true })
    );
    addRange(ranges, start + full.length - 1, start + full.length, schema.marks.link.create());

    match = RE_LINK.exec(line);
  }
}

function highlightInlineCode(ranges: HighlightRange[], lineStart: number, line: string): void {
  RE_INLINE_CODE.lastIndex = 0;
  let match = RE_INLINE_CODE.exec(line);

  while (match) {
    const [full, ticks, content] = match;
    const start = lineStart + match.index;
    const tickLen = ticks.length;

    addRange(
      ranges,
      start,
      start + tickLen,
      schema.marks.code.create({ start: true })
    );
    addRange(
      ranges,
      start + tickLen,
      start + tickLen + content.length,
      schema.marks.code.create({ marked: true })
    );
    addRange(
      ranges,
      start + tickLen + content.length,
      start + full.length,
      schema.marks.code.create({ end: true })
    );

    match = RE_INLINE_CODE.exec(line);
  }
}

function highlightHtml(ranges: HighlightRange[], lineStart: number, line: string): void {
  const htmlRanges = collectHtmlHighlightRanges(lineStart, line, (from, to) =>
    rangeOverlapsProtected(ranges, from, to)
  );

  htmlRanges.forEach(({ from, to, mark }) => {
    addRange(ranges, from, to, mark);
  });
}

function highlightNormalLine(
  ranges: HighlightRange[],
  lineStart: number,
  line: string
): void {
  const isTableLine = highlightTableLine(ranges, lineStart, line);

  if (!isTableLine) {
    highlightBlockquoteLine(ranges, lineStart, line, false);
    highlightListLine(ranges, lineStart, line, false);
  }

  highlightLinks(ranges, lineStart, line);
  highlightInlineCode(ranges, lineStart, line);
  highlightInlineEmphasis(ranges, lineStart, line);
  highlightHtml(ranges, lineStart, line);
}

function computeHighlights(doc: ProseMirrorNode, targetIndices?: Set<number>): {
  ranges: HighlightRange[];
  paragraphUpdates: ParagraphUpdate[];
} {
  const ranges: HighlightRange[] = [];
  const paragraphUpdates: ParagraphUpdate[] = [];
  let inCodeBlock = false;
  let codeBlockStartIndex = -1;

  doc.forEach((node, _offset, index) => {
    const shouldHighlight = !targetIndices || targetIndices.has(index);
    const line = node.textContent;
    const lineStart = getParagraphContentStart(doc, index);
    const fenceMatch = line.match(RE_FENCE);

    if (!inCodeBlock && fenceMatch) {
      if (shouldHighlight) {
        const [, fence, info] = fenceMatch;
        const fenceEnd = lineStart + fence.length;
        addRange(ranges, lineStart, fenceEnd, schema.marks.delimiter.create());

        if (info) {
          addRange(ranges, fenceEnd, lineStart + line.length, schema.marks.meta.create());
        }
      }

      inCodeBlock = true;
      codeBlockStartIndex = index;
      paragraphUpdates.push({ index, lineBackground: 'code-block-line-background start' });
      return;
    }

    if (inCodeBlock) {
      if (fenceMatch && index > codeBlockStartIndex) {
        if (shouldHighlight) {
          addRange(
            ranges,
            lineStart,
            lineStart + fenceMatch[1].length,
            schema.marks.delimiter.create()
          );
        }

        paragraphUpdates.push({ index, lineBackground: 'code-block-line-background' });
        inCodeBlock = false;
        codeBlockStartIndex = -1;
        return;
      }

      if (shouldHighlight && line.length > 0) {
        addRange(ranges, lineStart, lineStart + line.length, schema.marks.codeBlock.create());
      }

      paragraphUpdates.push({
        index,
        lineBackground:
          index === codeBlockStartIndex
            ? 'code-block-line-background start'
            : 'code-block-line-background',
      });
      return;
    }

    paragraphUpdates.push({ index, lineBackground: null });

    if (shouldHighlight) {
      highlightNormalLine(ranges, lineStart, line);
    }
  });

  return { ranges, paragraphUpdates };
}

function clearSyntaxMarksInRange(
  tr: import('prosemirror-state').Transaction,
  from: number,
  to: number
): void {
  SYNTAX_MARK_TYPES.forEach((type) => {
    tr.removeMark(from, to, schema.marks[type]);
  });
}

function clearSyntaxMarks(tr: import('prosemirror-state').Transaction): void {
  clearSyntaxMarksInRange(tr, 0, tr.doc.content.size);
}

function expandAffectedLineIndices(doc: ProseMirrorNode, indices: Set<number>): Set<number> {
  const expanded = new Set(indices);

  indices.forEach((index) => {
    if (index < 0 || index >= doc.childCount) {
      return;
    }

    const background = doc.child(index).attrs.lineBackground as string | null;
    if (!background?.includes('code-block')) {
      return;
    }

    let start = index;
    while (start > 0) {
      const previousBackground = doc.child(start - 1).attrs.lineBackground as string | null;
      if (!previousBackground?.includes('code-block')) {
        break;
      }
      start -= 1;
    }

    let end = index;
    while (end < doc.childCount - 1) {
      const nextBackground = doc.child(end + 1).attrs.lineBackground as string | null;
      if (!nextBackground?.includes('code-block')) {
        break;
      }
      end += 1;
    }

    for (let line = start; line <= end; line += 1) {
      expanded.add(line);
    }
  });

  return expanded;
}

function applyHighlightUpdates(
  tr: import('prosemirror-state').Transaction,
  ranges: HighlightRange[],
  paragraphUpdates: ParagraphUpdate[]
): void {
  paragraphUpdates.forEach(({ index, lineBackground }) => {
    if (index >= tr.doc.childCount) {
      return;
    }

    const node = tr.doc.child(index);
    const pos = getParagraphNodePos(tr.doc, index);

    if (node.attrs.lineBackground !== lineBackground) {
      tr.setNodeMarkup(pos, undefined, { lineBackground });
    }
  });

  ranges.forEach(({ from, to, mark }) => {
    tr.addMark(from, to, mark);
  });
}

export function applySyntaxHighlightForEditResults(
  state: import('prosemirror-state').EditorState,
  editResults: EditResult[]
): import('prosemirror-state').Transaction | null {
  const affectedLines = expandAffectedLineIndices(state.doc, collectAffectedLineIndices(editResults));

  if (affectedLines.size === 0) {
    return applySyntaxHighlight(state);
  }

  const tr = state.tr;
  tr.setMeta('syntaxHighlight', true);

  affectedLines.forEach((index) => {
    if (index >= tr.doc.childCount) {
      return;
    }

    const node = tr.doc.child(index);
    const pos = getParagraphNodePos(tr.doc, index);
    clearSyntaxMarksInRange(tr, pos + 1, pos + node.nodeSize - 1);
  });

  const { ranges, paragraphUpdates } = computeHighlights(state.doc, affectedLines);
  applyHighlightUpdates(tr, ranges, paragraphUpdates);

  return tr.docChanged ? tr : null;
}

export function applySyntaxHighlight(state: import('prosemirror-state').EditorState): import('prosemirror-state').Transaction | null {
  const { ranges, paragraphUpdates } = computeHighlights(state.doc);
  const tr = state.tr;
  tr.setMeta('syntaxHighlight', true);

  clearSyntaxMarks(tr);
  applyHighlightUpdates(tr, ranges, paragraphUpdates);

  return tr.docChanged ? tr : null;
}

export function syntaxHighlightPlugin(): Plugin {
  return new Plugin({
    appendTransaction(transactions, _oldState, newState) {
      const editTransaction = transactions.find(
        (tr) => tr.docChanged && !tr.getMeta('syntaxHighlight')
      );

      if (!editTransaction) {
        return null;
      }

      const editResults = editTransaction.getMeta(EDIT_RESULT_META) as EditResult[] | undefined;
      if (editResults?.length) {
        return applySyntaxHighlightForEditResults(newState, editResults);
      }

      return applySyntaxHighlight(newState);
    },
  });
}
