import type { CommandId } from '../commands/types.js';
import type { EditorContext } from '../core/editor-context.js';
import type { PreviewStyle, SelectionPos } from '../types.js';

export interface EditorMode {
  readonly type: 'markdown';
  mount(root: HTMLElement): void;
  activate(): void;
  deactivate(): void;
  destroy(): void;
  focus(): void;
  getSelection(): SelectionPos;
  setSelection(selection: SelectionPos): void;
  executeCommand(commandId: CommandId): boolean;
  canExecuteCommand(commandId: CommandId): boolean;
  syncToContext(): void;
}

export interface EditorModeFactory {
  create(context: EditorContext, previewStyle: PreviewStyle): EditorMode;
}
