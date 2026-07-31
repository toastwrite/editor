import type { CommandId, EditorCommandDefinition } from './types.js';
import { HEADING_DROPDOWN_TOOLBAR_ITEM, SCROLL_SYNC_COMMAND_ID } from './types.js';

export const DEFAULT_TOOLBAR_ITEMS: CommandId[] = [
  HEADING_DROPDOWN_TOOLBAR_ITEM,
  'bold',
  'italic',
  'strike',
  'hr',
  'blockquote',
  'orderedList',
  'bulletList',
  'taskList',
  'table',
  'image',
  'link',
  'code',
  'codeBlock',
  SCROLL_SYNC_COMMAND_ID,
];

export const BUILTIN_COMMANDS: EditorCommandDefinition[] = [
  {
    id: 'heading1',
    label: 'Heading 1',
    group: 'Text',
    shortcut: 'Mod-Alt-1',
  },
  {
    id: 'heading2',
    label: 'Heading 2',
    group: 'Text',
    shortcut: 'Mod-Alt-2',
  },
  {
    id: 'heading3',
    label: 'Heading 3',
    group: 'Text',
    shortcut: 'Mod-Alt-3',
  },
  {
    id: 'heading4',
    label: 'Heading 4',
    group: 'Text',
    shortcut: 'Mod-Alt-4',
  },
  {
    id: 'heading5',
    label: 'Heading 5',
    group: 'Text',
    shortcut: 'Mod-Alt-5',
  },
  {
    id: 'heading6',
    label: 'Heading 6',
    group: 'Text',
    shortcut: 'Mod-Alt-6',
  },
  {
    id: 'bold',
    label: 'Bold',
    group: 'Text',
    shortcut: 'Mod-b',
  },
  {
    id: 'italic',
    label: 'Italic',
    group: 'Text',
    shortcut: 'Mod-i',
  },
  {
    id: 'strike',
    label: 'Strikethrough',
    group: 'Text',
    shortcut: 'Mod-Shift-s',
  },
  {
    id: 'hr',
    label: 'Horizontal rule',
    group: 'Structure',
  },
  {
    id: 'blockquote',
    label: 'Blockquote',
    group: 'Structure',
    shortcut: 'Mod-Shift-q',
  },
  {
    id: 'orderedList',
    label: 'Ordered list',
    group: 'Lists',
    shortcut: 'Mod-Shift-7',
  },
  {
    id: 'bulletList',
    label: 'Bullet list',
    group: 'Lists',
    shortcut: 'Mod-Shift-8',
  },
  {
    id: 'taskList',
    label: 'Task list',
    group: 'Lists',
  },
  {
    id: 'table',
    label: 'Table',
    group: 'Insert',
    shortcut: 'Mod-Alt-t',
  },
  {
    id: 'image',
    label: 'Insert image',
    group: 'Insert',
  },
  {
    id: 'link',
    label: 'Link',
    group: 'Insert',
    shortcut: 'Mod-Shift-k',
  },
  {
    id: 'code',
    label: 'Inline code',
    group: 'Code',
    shortcut: 'Mod-e',
  },
  {
    id: 'codeBlock',
    label: 'Code block',
    group: 'Code',
    shortcut: 'Mod-Shift-c',
  },
];

export function getCommandDefinition(id: CommandId): EditorCommandDefinition | undefined {
  return BUILTIN_COMMANDS.find((command) => command.id === id);
}

export function resolveToolbarItems(items?: CommandId[]): EditorCommandDefinition[] {
  return resolveToolbarConfig(items).commands;
}

export function resolveToolbarConfig(items?: CommandId[]): {
  commands: EditorCommandDefinition[];
  showScrollSync: boolean;
  showHeadingDropdown: boolean;
} {
  const ids = items ?? DEFAULT_TOOLBAR_ITEMS;
  const showScrollSync = ids.includes(SCROLL_SYNC_COMMAND_ID);
  const showHeadingDropdown = ids.includes(HEADING_DROPDOWN_TOOLBAR_ITEM);

  const commands = ids
    .filter((id) => id !== SCROLL_SYNC_COMMAND_ID && id !== HEADING_DROPDOWN_TOOLBAR_ITEM)
    .map((id) => getCommandDefinition(id))
    .filter((command): command is EditorCommandDefinition => Boolean(command));

  return { commands, showScrollSync, showHeadingDropdown };
}
