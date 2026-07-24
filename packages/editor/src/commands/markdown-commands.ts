import type { CommandId } from './types.js';
import {
  insertMarkdownTable,
  insertTaskListPrefix,
  insertTextareaAtSelection,
  prefixTextareaLines,
  setHeadingLevelLines,
  wrapTextareaLines,
  wrapTextareaSelection,
} from './markdown-helpers.js';
import type { SelectionPos } from '../types.js';

export function executeMarkdownCommand(
  value: string,
  selection: SelectionPos,
  commandId: CommandId
): { value: string; selection: SelectionPos } | null {
  switch (commandId) {
    case 'bold':
      return wrapTextareaSelection(value, selection, '**', '**');
    case 'italic':
      return wrapTextareaSelection(value, selection, '*', '*');
    case 'strike':
      return wrapTextareaSelection(value, selection, '~~', '~~');
    case 'code':
      return wrapTextareaSelection(value, selection, '`', '`');
    case 'heading1':
      return setHeadingLevelLines(value, selection, 1);
    case 'heading2':
      return setHeadingLevelLines(value, selection, 2);
    case 'heading3':
      return setHeadingLevelLines(value, selection, 3);
    case 'heading4':
      return setHeadingLevelLines(value, selection, 4);
    case 'heading5':
      return setHeadingLevelLines(value, selection, 5);
    case 'heading6':
      return setHeadingLevelLines(value, selection, 6);
    case 'bulletList':
      return prefixTextareaLines(value, selection, '- ');
    case 'orderedList':
      return prefixTextareaLines(value, selection, '1. ');
    case 'taskList':
      return insertTaskListPrefix(value, selection);
    case 'blockquote':
      return prefixTextareaLines(value, selection, '> ');
    case 'codeBlock':
      return wrapTextareaLines(value, selection, '```', '```');
    case 'hr':
      return insertTextareaAtSelection(value, selection, '\n\n---\n\n');
    case 'table':
      return insertMarkdownTable(value, selection);
    default:
      return null;
  }
}
