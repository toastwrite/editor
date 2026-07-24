import { afterEach, describe, expect, it } from 'vitest';
import { createScrollSyncToggle } from '../ui/toolbar/create-scroll-sync-toggle.js';

describe('createScrollSyncToggle', () => {
  let container: HTMLDivElement;

  afterEach(() => {
    container?.remove();
  });

  it('renders label on the left and switch on the right', () => {
    container = document.createElement('div');
    document.body.appendChild(container);

    const { element, controller } = createScrollSyncToggle({
      initialEnabled: true,
      isAvailable: () => true,
      onChange: () => {},
    });

    container.appendChild(element);

    const control = element.querySelector('.toastwrite-editor-toolbar-scroll-sync')!;
    const label = control.querySelector('.toastwrite-editor-toolbar-scroll-sync-label');
    const switchButton = control.querySelector('.toastwrite-editor-toolbar-switch');

    expect(label?.textContent).toBe('Auto scroll');
    expect(switchButton?.getAttribute('role')).toBe('switch');
    expect(control.firstElementChild).toBe(label);
    expect(control.lastElementChild).toBe(switchButton);
    expect(element.querySelector('.toastwrite-editor-toolbar-tooltip')).toBeTruthy();

    controller.destroy();
  });

  it('toggles enabled state and calls onChange', () => {
    container = document.createElement('div');
    document.body.appendChild(container);

    let enabled = true;
    const { element, controller } = createScrollSyncToggle({
      initialEnabled: true,
      isAvailable: () => true,
      onChange: (nextEnabled) => {
        enabled = nextEnabled;
      },
    });

    container.appendChild(element);

    const switchButton = element.querySelector('.toastwrite-editor-toolbar-switch') as HTMLButtonElement;
    switchButton.click();

    expect(enabled).toBe(false);
    expect(switchButton.getAttribute('aria-checked')).toBe('false');
    expect(switchButton.classList.contains('is-on')).toBe(false);

    controller.destroy();
  });
});
