import { describe, expect, it } from 'vitest';
import { DEFAULT_TOOLBAR_ITEMS } from '../commands/builtins.js';
import { HEADING_DROPDOWN_TOOLBAR_ITEM, SCROLL_SYNC_COMMAND_ID } from '../commands/types.js';
import { createHeadingIcon, createToolbarIcon } from '../ui/toolbar/toolbar-icons.js';

const TOOLBAR_ICON_COMMANDS = DEFAULT_TOOLBAR_ITEMS.filter(
  (id) => id !== SCROLL_SYNC_COMMAND_ID && id !== HEADING_DROPDOWN_TOOLBAR_ITEM
);
const SVG_ASSET_COMMANDS = [
  'bold',
  'italic',
  'code',
  'link',
  'image',
  'table',
  'blockquote',
  'strike',
  'bulletList',
  'orderedList',
  'taskList',
  'hr',
] as const;

describe('toolbar icons', () => {
  it('creates svg icons for all toolbar commands', () => {
    for (const commandId of TOOLBAR_ICON_COMMANDS) {
      const icon = createToolbarIcon(commandId);
      expect(icon?.tagName.toLowerCase(), commandId).toBe('svg');
      expect(icon?.classList.contains('toastwrite-editor-toolbar-icon-svg'), commandId).toBe(true);
      expect(icon?.classList.contains(`toastwrite-editor-toolbar-icon-${commandId}`), commandId).toBe(
        true
      );
    }
  });

  it('creates a heading icon for the dropdown trigger', () => {
    const icon = createHeadingIcon();
    expect(icon.tagName.toLowerCase()).toBe('svg');
    expect(icon.classList.contains('toastwrite-editor-toolbar-icon-heading')).toBe(true);
  });

  it('renders svg asset icons without transform reconstruction', () => {
    for (const commandId of SVG_ASSET_COMMANDS) {
      const icon = createToolbarIcon(commandId);

      expect(icon?.getAttribute('viewBox'), commandId).toBeTruthy();
      expect(icon?.querySelector('g[transform]'), commandId).toBeFalsy();
      expect(
        icon?.querySelector('path, image, rect, circle, line, polyline, polygon'),
        commandId
      ).toBeTruthy();
    }
  });
});
