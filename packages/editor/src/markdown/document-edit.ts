import type { EditResult } from '@toastwrite/parser';
import type { Transaction } from 'prosemirror-state';
import type { Slice } from 'prosemirror-model';
import type { ContentService } from '../services/content-service.js';
import { getChangedFromSlice, getEditorToMdPos } from './pos.js';

export const EDIT_RESULT_META = 'editResult';

interface ReplaceLikeStep {
  from: number;
  to: number;
  slice: Slice;
}

function isReplaceLikeStep(step: unknown): step is ReplaceLikeStep {
  return typeof step === 'object' && step !== null && 'slice' in step && !('gapFrom' in step);
}

export function collectTransactionEditResults(
  content: ContentService,
  tr: Transaction
): EditResult[] {
  const editResults: EditResult[] = [];

  tr.steps.forEach((step, index) => {
    if (!isReplaceLikeStep(step)) {
      return;
    }

    const doc = tr.docs[index];
    const [startPos, endPos] = getEditorToMdPos(doc, step.from, step.to);
    let changed = getChangedFromSlice(step.slice);

    if (startPos[0] === endPos[0] && startPos[1] === endPos[1] && changed === '') {
      changed = '\n';
    }

    editResults.push(...content.editMarkdown(startPos, endPos, changed));
  });

  return editResults;
}

export function collectAffectedLineIndices(editResults: EditResult[]): Set<number> {
  const indices = new Set<number>();

  for (const { nodes, removedNodeRange } of editResults) {
    if (removedNodeRange) {
      const [startLine, endLine] = removedNodeRange.line;
      for (let line = startLine; line <= endLine; line += 1) {
        indices.add(line);
      }
    }

    for (const node of nodes) {
      const sourcepos = node.sourcepos;
      if (!sourcepos) {
        continue;
      }

      const startLine = sourcepos[0][0] - 1;
      const endLine = sourcepos[1][0] - 1;
      for (let line = startLine; line <= endLine; line += 1) {
        indices.add(line);
      }
    }
  }

  return indices;
}
