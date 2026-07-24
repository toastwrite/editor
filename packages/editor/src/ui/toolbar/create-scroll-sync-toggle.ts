import { wrapToolbarItem } from './toolbar-tooltip.js';

export interface ScrollSyncToggleOptions {
  label?: string;
  tooltip?: string;
  initialEnabled: boolean;
  isAvailable: () => boolean;
  onChange: (enabled: boolean) => void;
}

export interface ScrollSyncToggleController {
  setEnabled(enabled: boolean): void;
  syncAvailability(): void;
  destroy(): void;
}

export function createScrollSyncToggle({
  label = 'Auto scroll',
  tooltip = 'Sync editor and preview scroll position',
  initialEnabled,
  isAvailable,
  onChange,
}: ScrollSyncToggleOptions): { element: HTMLElement; controller: ScrollSyncToggleController } {
  const control = document.createElement('div');
  control.className = 'toastwrite-editor-toolbar-scroll-sync';

  const labelEl = document.createElement('span');
  labelEl.className = 'toastwrite-editor-toolbar-scroll-sync-label';
  labelEl.textContent = label;

  const switchButton = document.createElement('button');
  switchButton.type = 'button';
  switchButton.className = 'toastwrite-editor-toolbar-switch';
  switchButton.setAttribute('role', 'switch');
  switchButton.setAttribute('aria-label', label);

  let enabled = initialEnabled;

  const syncState = (): void => {
    const available = isAvailable();
    switchButton.disabled = !available;
    switchButton.setAttribute('aria-checked', enabled && available ? 'true' : 'false');
    switchButton.classList.toggle('is-on', enabled && available);
    control.classList.toggle('is-disabled', !available);
  };

  const onToggle = (): void => {
    if (!isAvailable()) {
      return;
    }

    enabled = !enabled;
    syncState();
    onChange(enabled);
  };

  switchButton.addEventListener('click', onToggle);
  syncState();

  control.append(labelEl, switchButton);

  const element = wrapToolbarItem(control, tooltip);
  element.classList.add('toastwrite-editor-toolbar-scroll-sync-item');

  return {
    element,
    controller: {
      setEnabled(nextEnabled: boolean) {
        enabled = nextEnabled;
        syncState();
      },
      syncAvailability() {
        syncState();
      },
      destroy() {
        switchButton.removeEventListener('click', onToggle);
        element.remove();
      },
    },
  };
}
