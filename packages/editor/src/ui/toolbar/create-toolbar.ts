import type { CommandId, EditorCommandDefinition } from '../../commands/types.js';
import {
  createScrollSyncToggle,
  type ScrollSyncToggleController,
} from './create-scroll-sync-toggle.js';
import {
  createHeadingDropdown,
  type HeadingDropdownController,
} from './create-heading-dropdown.js';
import { createToolbarIcon } from './toolbar-icons.js';
import { formatToolbarTooltip, wrapToolbarItem } from './toolbar-tooltip.js';

export interface ToolbarScrollSyncOptions {
  initialEnabled: boolean;
  isAvailable: () => boolean;
  onChange: (enabled: boolean) => void;
  getEnabled: () => boolean;
}

export interface ToolbarOptions {
  mount: HTMLElement;
  commands: EditorCommandDefinition[];
  onCommand: (commandId: CommandId) => void;
  onLinkClick?: (trigger: HTMLButtonElement) => void;
  canExecute?: (commandId: CommandId) => boolean;
  headingDropdown?: boolean;
  scrollSync?: ToolbarScrollSyncOptions;
}

export interface ToolbarController {
  updateAvailability(canExecute: (commandId: CommandId) => boolean): void;
  updateScrollSync(): void;
  destroy(): void;
}

const TOOLBAR_GROUP_ITEM_ORDER: Partial<Record<EditorCommandDefinition['group'], CommandId[]>> = {
  Text: ['bold', 'italic', 'strike'],
  Structure: ['hr', 'blockquote'],
  Lists: ['orderedList', 'bulletList', 'taskList'],
  Insert: ['table', 'link'],
  Code: ['code', 'codeBlock'],
};

function sortCommandsForGroup(
  groupName: EditorCommandDefinition['group'],
  groupCommands: EditorCommandDefinition[]
): EditorCommandDefinition[] {
  const order = TOOLBAR_GROUP_ITEM_ORDER[groupName];
  if (!order) {
    return groupCommands;
  }

  const commandMap = new Map(groupCommands.map((command) => [command.id, command]));
  return order
    .map((id) => commandMap.get(id))
    .filter((command): command is EditorCommandDefinition => Boolean(command));
}

function createCommandButton(
  command: EditorCommandDefinition,
  onCommand: (commandId: CommandId) => void,
  onLinkClick: ((trigger: HTMLButtonElement) => void) | undefined,
  canExecute: (commandId: CommandId) => boolean
): { item: HTMLElement; button: HTMLButtonElement } {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'toastwrite-editor-toolbar-button';
  button.dataset.command = command.id;
  button.setAttribute('aria-label', command.label);
  button.disabled = !canExecute(command.id);

  const icon = createToolbarIcon(command.id);
  if (icon) {
    button.appendChild(icon);
  }

  button.classList.add(`toastwrite-editor-toolbar-button-${command.id}`);

  button.addEventListener('click', () => {
    if (command.id === 'link' && onLinkClick) {
      onLinkClick(button);
      return;
    }

    onCommand(command.id);
  });

  const item = wrapToolbarItem(button, formatToolbarTooltip(command.label, command.shortcut));
  return { item, button };
}

export function createToolbar({
  mount,
  commands,
  onCommand,
  onLinkClick,
  canExecute = () => true,
  headingDropdown = false,
  scrollSync,
}: ToolbarOptions): ToolbarController {
  mount.classList.add('toastwrite-editor-toolbar-inner');
  if (scrollSync) {
    mount.classList.add('toastwrite-editor-toolbar-inner-with-actions');
  }
  mount.replaceChildren();

  const groups = document.createElement('div');
  groups.className = 'toastwrite-editor-toolbar-groups';

  const groupOrder = ['Text', 'Structure', 'Lists', 'Insert', 'Code'] as const;
  const buttons = new Map<CommandId, HTMLButtonElement>();
  let headingDropdownController: HeadingDropdownController | null = null;

  groupOrder.forEach((groupName) => {
    const groupCommands = sortCommandsForGroup(
      groupName,
      commands.filter((command) => command.group === groupName)
    );
    if (groupName === 'Text' && !headingDropdown && groupCommands.length === 0) {
      return;
    }
    if (groupName !== 'Text' && groupCommands.length === 0) {
      return;
    }

    const group = document.createElement('div');
    group.className = 'toastwrite-editor-toolbar-group';
    group.dataset.group = groupName;

    if (groupName === 'Text' && headingDropdown) {
      const dropdown = createHeadingDropdown({
        onSelect: onCommand,
        canExecute,
      });
      group.appendChild(dropdown.element);
      headingDropdownController = dropdown.controller;
    }

    groupCommands.forEach((command) => {
      const { item, button } = createCommandButton(command, onCommand, onLinkClick, canExecute);
      buttons.set(command.id, button);
      group.appendChild(item);
    });

    groups.appendChild(group);
  });

  mount.appendChild(groups);

  let scrollSyncToggle: ScrollSyncToggleController | null = null;
  if (scrollSync) {
    const actions = document.createElement('div');
    actions.className = 'toastwrite-editor-toolbar-actions';

    const toggle = createScrollSyncToggle({
      initialEnabled: scrollSync.initialEnabled,
      isAvailable: scrollSync.isAvailable,
      onChange: scrollSync.onChange,
      tooltip: 'Sync editor and preview scroll position',
    });
    actions.appendChild(toggle.element);
    scrollSyncToggle = toggle.controller;

    mount.appendChild(actions);
  }

  return {
    updateAvailability(nextCanExecute) {
      buttons.forEach((button, commandId) => {
        button.disabled = !nextCanExecute(commandId);
      });
      headingDropdownController?.updateAvailability(nextCanExecute);
    },
    updateScrollSync() {
      if (!scrollSync || !scrollSyncToggle) {
        return;
      }

      scrollSyncToggle.setEnabled(scrollSync.getEnabled());
      scrollSyncToggle.syncAvailability();
    },
    destroy() {
      scrollSyncToggle?.destroy();
      headingDropdownController?.destroy();
      mount.replaceChildren();
      mount.classList.remove(
        'toastwrite-editor-toolbar-inner',
        'toastwrite-editor-toolbar-inner-with-actions'
      );
    },
  };
}
