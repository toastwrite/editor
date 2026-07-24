export function formatShortcutLabel(shortcut: string): string {
  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);

  return shortcut
    .replace(/Mod-/g, isMac ? '⌘' : 'Ctrl+')
    .replace(/Alt-/g, isMac ? '⌥' : 'Alt+')
    .replace(/Shift-/g, isMac ? '⇧' : 'Shift+');
}

export function matchKeyboardShortcut(event: KeyboardEvent, shortcut: string): boolean {
  const parts = shortcut.split('-');
  const key = parts[parts.length - 1].toLowerCase();
  const needMod = parts.includes('Mod');
  const needShift = parts.includes('Shift');
  const needAlt = parts.includes('Alt');
  const mod = event.metaKey || event.ctrlKey;

  if (needMod !== mod) {
    return false;
  }
  if (needShift !== event.shiftKey) {
    return false;
  }
  if (needAlt !== event.altKey) {
    return false;
  }

  if (/^\d$/.test(key)) {
    return event.key === key;
  }

  return event.key.toLowerCase() === key;
}
