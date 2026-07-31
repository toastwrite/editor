import { getCommandDefinition } from '../../commands/builtins.js';
import type { CommandId } from '../../commands/types.js';
import { HEADING_COMMAND_IDS } from '../../commands/types.js';
import { createHeadingIcon } from './toolbar-icons.js';
import { formatToolbarTooltip, wrapToolbarItem } from './toolbar-tooltip.js';

export interface HeadingDropdownOptions {
  onSelect: (commandId: CommandId) => void;
  canExecute: (commandId: CommandId) => boolean;
}

export interface HeadingDropdownController {
  updateAvailability(canExecute: (commandId: CommandId) => boolean): void;
  destroy(): void;
}

export function createHeadingDropdown({
  onSelect,
  canExecute,
}: HeadingDropdownOptions): { element: HTMLElement; controller: HeadingDropdownController } {
  const root = document.createElement('div');
  root.className = 'toastwrite-editor-toolbar-heading';

  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'toastwrite-editor-toolbar-button toastwrite-editor-toolbar-heading-trigger';
  trigger.setAttribute('aria-label', 'Heading');
  trigger.setAttribute('aria-haspopup', 'menu');
  trigger.setAttribute('aria-expanded', 'false');

  const icon = createHeadingIcon();
  if (icon) {
    trigger.appendChild(icon);
  }

  const chevron = document.createElement('span');
  chevron.className = 'toastwrite-editor-toolbar-heading-chevron';
  chevron.setAttribute('aria-hidden', 'true');
  chevron.textContent = '▾';
  trigger.append(chevron);

  const menu = document.createElement('div');
  menu.className = 'toastwrite-editor-toolbar-heading-menu';
  menu.setAttribute('role', 'menu');
  menu.hidden = true;

  const menuItems = HEADING_COMMAND_IDS.map((commandId) => {
    const definition = getCommandDefinition(commandId);
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'toastwrite-editor-toolbar-heading-item';
    item.setAttribute('role', 'menuitem');
    item.dataset.command = commandId;
    item.textContent = definition?.label ?? commandId;
    item.disabled = !canExecute(commandId);
    return { commandId, item };
  });

  menu.append(...menuItems.map(({ item }) => item));
  root.append(trigger, menu);

  const item = wrapToolbarItem(
    root,
    formatToolbarTooltip('Heading', 'Mod-Alt-1 … Mod-Alt-6')
  );
  item.classList.add('toastwrite-editor-toolbar-heading-item-wrap');

  const setOpen = (open: boolean): void => {
    menu.hidden = !open;
    trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
    root.classList.toggle('is-open', open);
  };

  const closeMenu = (): void => {
    setOpen(false);
  };

  const onTriggerClick = (): void => {
    setOpen(Boolean(menu.hidden));
  };

  const itemClickHandlers = menuItems.map(({ commandId, item }) => {
    const handler = (): void => {
      closeMenu();
      onSelect(commandId);
    };

    item.addEventListener('click', handler);
    return { item, handler };
  });

  const onDocumentPointerDown = (event: PointerEvent): void => {
    const target = event.target as Node | null;
    if (target && root.contains(target)) {
      return;
    }

    closeMenu();
  };

  const onDocumentKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') {
      closeMenu();
    }
  };

  trigger.addEventListener('click', onTriggerClick);
  document.addEventListener('pointerdown', onDocumentPointerDown);
  document.addEventListener('keydown', onDocumentKeyDown);

  return {
    element: item,
    controller: {
      updateAvailability(nextCanExecute) {
        menuItems.forEach(({ commandId, item: menuItem }) => {
          menuItem.disabled = !nextCanExecute(commandId);
        });
      },
      destroy() {
        trigger.removeEventListener('click', onTriggerClick);
        itemClickHandlers.forEach(({ item: menuItem, handler }) => {
          menuItem.removeEventListener('click', handler);
        });
        document.removeEventListener('pointerdown', onDocumentPointerDown);
        document.removeEventListener('keydown', onDocumentKeyDown);
        item.remove();
      },
    },
  };
}
