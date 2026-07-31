import { BUILTIN_COMMANDS, resolveToolbarConfig } from '../commands/builtins.js';
import { matchKeyboardShortcut } from '../commands/keyboard.js';
import type { LinkPopupInitialValues } from '../commands/link-helpers.js';
import type { ImagePopupInitialValues } from '../commands/image-helpers.js';
import type { CommandId } from '../commands/types.js';
import type { PreviewStyle } from '../types.js';
import { createImagePopup } from './toolbar/create-image-popup.js';
import { createLinkPopup } from './toolbar/create-link-popup.js';
import { createToolbar } from './toolbar/create-toolbar.js';

export interface CommandControllerOptions {
  toolbarEl: HTMLElement;
  rootEl: HTMLElement;
  toolbarItems?: CommandId[];
  previewStyle: PreviewStyle;
  scrollSync: boolean;
  onExecute: (commandId: CommandId) => boolean;
  canExecute: (commandId: CommandId) => boolean;
  getScrollSyncEnabled: () => boolean;
  setScrollSyncEnabled: (enabled: boolean) => void;
  getLinkPopupInitialValues: () => LinkPopupInitialValues;
  onInsertLink: (url: string, linkText: string) => boolean;
  getImagePopupInitialValues: () => ImagePopupInitialValues;
  onInsertImage: (url: string, altText: string) => boolean;
}

export interface CommandController {
  destroy(): void;
}

export function createCommandController({
  toolbarEl,
  rootEl,
  toolbarItems,
  previewStyle,
  scrollSync,
  onExecute,
  canExecute,
  getScrollSyncEnabled,
  setScrollSyncEnabled,
  getLinkPopupInitialValues,
  onInsertLink,
  getImagePopupInitialValues,
  onInsertImage,
}: CommandControllerOptions): CommandController {
  const { commands, showScrollSync, showHeadingDropdown } = resolveToolbarConfig(toolbarItems);

  let linkPopup: ReturnType<typeof createLinkPopup>;
  let imagePopup: ReturnType<typeof createImagePopup>;

  const toolbar = createToolbar({
    mount: toolbarEl,
    commands,
    onCommand: (commandId) => {
      onExecute(commandId);
    },
    onLinkClick: (trigger) => {
      linkPopup.open(trigger, getLinkPopupInitialValues());
    },
    onImageClick: (trigger) => {
      imagePopup.open(trigger, getImagePopupInitialValues());
    },
    canExecute,
    headingDropdown: showHeadingDropdown,
    scrollSync: showScrollSync
      ? {
          initialEnabled: scrollSync,
          isAvailable: () => previewStyle === 'vertical',
          onChange: setScrollSyncEnabled,
          getEnabled: getScrollSyncEnabled,
        }
      : undefined,
  });

  linkPopup = createLinkPopup({
    mount: toolbarEl,
    onSubmit: ({ url, linkText }) => {
      onInsertLink(url, linkText);
    },
  });

  imagePopup = createImagePopup({
    mount: toolbarEl,
    onSubmit: ({ url, altText }) => {
      onInsertImage(url, altText);
    },
  });

  const onShortcut = (event: KeyboardEvent): void => {
    if (linkPopup.isOpen() || imagePopup.isOpen()) {
      return;
    }

    const target = event.target as HTMLElement | null;
    if (!target?.closest('.toastwrite-editor')) {
      return;
    }

    for (const command of BUILTIN_COMMANDS) {
      if (!command.shortcut) {
        continue;
      }

      if (!matchKeyboardShortcut(event, command.shortcut)) {
        continue;
      }

      if (!canExecute(command.id)) {
        continue;
      }

      event.preventDefault();
      onExecute(command.id);
      return;
    }
  };

  rootEl.addEventListener('keydown', onShortcut);

  return {
    destroy() {
      rootEl.removeEventListener('keydown', onShortcut);
      toolbar.destroy();
      linkPopup.destroy();
      imagePopup.destroy();
    },
  };
}
