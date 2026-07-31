export type CommandId =
  | 'bold'
  | 'italic'
  | 'strike'
  | 'code'
  | 'codeBlock'
  | 'heading'
  | 'heading1'
  | 'heading2'
  | 'heading3'
  | 'heading4'
  | 'heading5'
  | 'heading6'
  | 'bulletList'
  | 'orderedList'
  | 'taskList'
  | 'blockquote'
  | 'hr'
  | 'link'
  | 'image'
  | 'table'
  | 'scrollSync';

export const SCROLL_SYNC_COMMAND_ID = 'scrollSync' as const;
export const HEADING_DROPDOWN_TOOLBAR_ITEM = 'heading' as const;

export const HEADING_COMMAND_IDS = [
  'heading1',
  'heading2',
  'heading3',
  'heading4',
  'heading5',
  'heading6',
] as const;

export type HeadingCommandId = (typeof HEADING_COMMAND_IDS)[number];

export function isExecutableCommandId(
  id: CommandId
): id is Exclude<CommandId, typeof SCROLL_SYNC_COMMAND_ID | typeof HEADING_DROPDOWN_TOOLBAR_ITEM> {
  return id !== SCROLL_SYNC_COMMAND_ID && id !== HEADING_DROPDOWN_TOOLBAR_ITEM;
}

export interface EditorCommandDefinition {
  id: CommandId;
  label: string;
  group: 'Text' | 'Structure' | 'Lists' | 'Insert' | 'Code';
  shortcut?: string;
}

export interface CommandExecutor {
  executeCommand(commandId: CommandId): boolean;
  canExecuteCommand?(commandId: CommandId): boolean;
}
