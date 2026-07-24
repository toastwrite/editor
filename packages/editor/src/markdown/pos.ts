import type { Node as ProseMirrorNode, Slice } from 'prosemirror-model';
import type { MarkdownPos } from './compute-markdown-edit.js';

export function getEditorToMdPos(
  doc: ProseMirrorNode,
  from: number,
  to = from
): [MarkdownPos, MarkdownPos] {
  const startResolved = doc.resolve(from);
  const startLine = startResolved.index(0) + 1;
  const startOffset = startResolved.start(1);
  const startCh = Math.max(from - startOffset + 1, 1);

  if (from === to) {
    return [
      [startLine, startCh],
      [startLine, startCh],
    ];
  }

  let endPos = to;
  if (to === doc.content.size) {
    endPos = Math.max(doc.content.size - 1, 1);
  }

  const endResolved = doc.resolve(endPos);
  const endLine = endResolved.index(0) + 1;
  const endOffset = endResolved.start(1);
  const endCh = Math.max(endPos - endOffset + 1, 1);

  return [
    [startLine, startCh],
    [endLine, endCh],
  ];
}

export function getChangedFromSlice(slice: Slice): string {
  let changed = '';
  const from = 0;
  const to = slice.content.size;

  slice.content.nodesBetween(from, to, (node, pos) => {
    if (node.isText) {
      changed += node.text!.slice(Math.max(from, pos) - pos, to - pos);
    } else if (node.isBlock && pos > 0) {
      changed += '\n';
    }
  });

  return changed;
}
