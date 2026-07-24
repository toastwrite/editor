import { formatShortcutLabel } from '../../commands/keyboard.js';

export function formatToolbarTooltip(label: string, shortcut?: string): string {
  if (!shortcut) {
    return label;
  }

  return `${label} (${formatShortcutLabel(shortcut)})`;
}

export function wrapToolbarItem(button: HTMLElement, tooltipText: string): HTMLElement {
  const item = document.createElement('div');
  item.className = 'toastwrite-editor-toolbar-item';

  const tooltip = document.createElement('span');
  tooltip.className = 'toastwrite-editor-toolbar-tooltip';
  tooltip.textContent = tooltipText;
  tooltip.setAttribute('role', 'tooltip');

  item.append(button, tooltip);
  return item;
}
