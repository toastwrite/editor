import { Node as ProseMirrorNode } from 'prosemirror-model';
import { TextSelection } from 'prosemirror-state';
import type { Transaction } from 'prosemirror-state';
import { markdownLineSchema as schema } from './schema.js';

export function markdownToDoc(markdown: string): ProseMirrorNode {
  const lines = markdown.split('\n');
  const paragraphs = lines.map((line) =>
    schema.nodes.paragraph.create(null, line ? schema.text(line) : undefined)
  );

  if (paragraphs.length === 0) {
    return schema.nodes.doc.create(null, [schema.nodes.paragraph.create()]);
  }

  return schema.nodes.doc.create(null, paragraphs);
}

export function docToMarkdown(doc: ProseMirrorNode): string {
  const lines: string[] = [];

  doc.forEach((node) => {
    lines.push(node.textContent);
  });

  return lines.join('\n');
}

function getParagraphStartPos(doc: ProseMirrorNode, index: number): number {
  let pos = 1;

  for (let i = 0; i < index; i += 1) {
    pos += doc.child(i).nodeSize;
  }

  return pos;
}

export function posToMarkdownOffset(doc: ProseMirrorNode, pos: number): number {
  let offset = 0;

  for (let index = 0; index < doc.childCount; index += 1) {
    const node = doc.child(index);
    const blockStart = getParagraphStartPos(doc, index);
    const blockEnd = blockStart + node.content.size;

    if (pos <= blockEnd) {
      return offset + Math.max(0, Math.min(node.textContent.length, pos - blockStart));
    }

    offset += node.textContent.length + 1;
  }

  return offset;
}

export function markdownOffsetToPos(doc: ProseMirrorNode, offset: number): number {
  let current = 0;

  for (let index = 0; index < doc.childCount; index += 1) {
    const node = doc.child(index);
    const text = node.textContent;
    const lineEnd = current + text.length;

    if (offset <= lineEnd || index === doc.childCount - 1) {
      const column = Math.min(Math.max(offset - current, 0), text.length);
      return getParagraphStartPos(doc, index) + column;
    }

    current = lineEnd + 1;
  }

  return doc.content.size;
}

export function setSelectionFromMarkdownOffset(
  tr: Transaction,
  selection: { start: number; end: number }
): Transaction {
  const { doc } = tr;
  const from = markdownOffsetToPos(doc, selection.start);
  const to = markdownOffsetToPos(doc, selection.end);

  return tr.setSelection(TextSelection.create(doc, from, to));
}

export function replaceDocumentFromMarkdown(
  tr: Transaction,
  markdown: string,
  selection: { start: number; end: number }
): Transaction {
  const nextDoc = markdownToDoc(markdown);
  const nextTr = tr.replaceWith(0, tr.doc.content.size, nextDoc.content);

  return setSelectionFromMarkdownOffset(nextTr, selection);
}
