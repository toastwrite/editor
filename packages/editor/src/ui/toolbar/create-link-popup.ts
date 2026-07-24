import type { LinkPopupInitialValues } from '../../commands/link-helpers.js';

export interface LinkPopupOptions {
  mount: HTMLElement;
  onSubmit: (values: { url: string; linkText: string }) => void;
}

export interface LinkPopupController {
  open(trigger: HTMLElement, initialValues: LinkPopupInitialValues): void;
  close(): void;
  isOpen(): boolean;
  destroy(): void;
}

const POPUP_MARGIN_FROM_RIGHT = 20;

function positionPopup(popup: HTMLElement, trigger: HTMLElement, mount: HTMLElement): void {
  const mountRect = mount.getBoundingClientRect();
  const triggerRect = trigger.getBoundingClientRect();
  const left = triggerRect.left - mountRect.left;
  const top = triggerRect.bottom - mountRect.top + 4;

  popup.style.left = `${left}px`;
  popup.style.top = `${top}px`;

  requestAnimationFrame(() => {
    const popupWidth = popup.offsetWidth;
    const maxLeft = Math.max(mount.clientWidth - popupWidth - POPUP_MARGIN_FROM_RIGHT, 0);
    popup.style.left = `${Math.min(left, maxLeft)}px`;
  });
}

export function createLinkPopup({ mount, onSubmit }: LinkPopupOptions): LinkPopupController {
  const popup = document.createElement('div');
  popup.className = 'toastwrite-editor-link-popup';
  popup.hidden = true;
  popup.setAttribute('role', 'dialog');
  popup.setAttribute('aria-label', 'Insert link');

  const body = document.createElement('div');
  body.className = 'toastwrite-editor-link-popup-body';

  const urlLabel = document.createElement('label');
  urlLabel.className = 'toastwrite-editor-link-popup-label';
  urlLabel.htmlFor = 'toastwrite-editor-link-url';
  urlLabel.textContent = 'URL';

  const urlInput = document.createElement('input');
  urlInput.id = 'toastwrite-editor-link-url';
  urlInput.type = 'text';
  urlInput.className = 'toastwrite-editor-link-popup-input';
  urlInput.autocomplete = 'off';

  const textLabel = document.createElement('label');
  textLabel.className = 'toastwrite-editor-link-popup-label';
  textLabel.htmlFor = 'toastwrite-editor-link-text';
  textLabel.textContent = 'Link text';

  const textInput = document.createElement('input');
  textInput.id = 'toastwrite-editor-link-text';
  textInput.type = 'text';
  textInput.className = 'toastwrite-editor-link-popup-input';
  textInput.autocomplete = 'off';

  const actions = document.createElement('div');
  actions.className = 'toastwrite-editor-link-popup-actions';

  const cancelButton = document.createElement('button');
  cancelButton.type = 'button';
  cancelButton.className = 'toastwrite-editor-link-popup-button toastwrite-editor-link-popup-cancel';
  cancelButton.textContent = 'Cancel';

  const okButton = document.createElement('button');
  okButton.type = 'button';
  okButton.className = 'toastwrite-editor-link-popup-button toastwrite-editor-link-popup-ok';
  okButton.textContent = 'OK';

  actions.append(cancelButton, okButton);
  body.append(urlLabel, urlInput, textLabel, textInput, actions);
  popup.appendChild(body);
  mount.appendChild(popup);

  let triggerEl: HTMLElement | null = null;
  let linkTextDisabled = false;

  const clearValidation = (): void => {
    urlInput.classList.remove('is-invalid');
    textInput.classList.remove('is-invalid');
  };

  const setLinkTextDisabled = (disabled: boolean): void => {
    linkTextDisabled = disabled;
    textInput.disabled = disabled;
    textInput.classList.toggle('is-disabled', disabled);
  };

  const initialize = (initialValues: LinkPopupInitialValues): void => {
    clearValidation();
    urlInput.value = initialValues.url;
    textInput.value = initialValues.linkText;
    setLinkTextDisabled(initialValues.linkTextDisabled);
  };

  const close = (): void => {
    popup.hidden = true;
    triggerEl = null;
    clearValidation();
  };

  const open = (trigger: HTMLElement, initialValues: LinkPopupInitialValues): void => {
    triggerEl = trigger;
    initialize(initialValues);
    popup.hidden = false;
    positionPopup(popup, trigger, mount);
    urlInput.focus();
    urlInput.select();
  };

  const submit = (): void => {
    clearValidation();

    const url = urlInput.value.trim();
    if (!url) {
      urlInput.classList.add('is-invalid');
      urlInput.focus();
      return;
    }

    const linkText = textInput.value;
    if (!linkTextDisabled && !linkText.trim()) {
      textInput.classList.add('is-invalid');
      textInput.focus();
      return;
    }

    onSubmit({ url, linkText: linkTextDisabled ? linkText : linkText.trim() });
    close();
  };

  const onCancelClick = (): void => {
    close();
  };

  const onOkClick = (): void => {
    submit();
  };

  const onUrlKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Enter') {
      event.preventDefault();
      if (linkTextDisabled) {
        submit();
        return;
      }
      textInput.focus();
    }
  };

  const onTextKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Enter') {
      event.preventDefault();
      submit();
    }
  };

  const onDocumentPointerDown = (event: PointerEvent): void => {
    const target = event.target as Node | null;
    if (!target) {
      return;
    }

    if (popup.contains(target) || triggerEl?.contains(target)) {
      return;
    }

    close();
  };

  const onDocumentKeyDown = (event: KeyboardEvent): void => {
    if (popup.hidden) {
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      close();
    }
  };

  cancelButton.addEventListener('click', onCancelClick);
  okButton.addEventListener('click', onOkClick);
  urlInput.addEventListener('keydown', onUrlKeyDown);
  textInput.addEventListener('keydown', onTextKeyDown);
  document.addEventListener('pointerdown', onDocumentPointerDown);
  document.addEventListener('keydown', onDocumentKeyDown);

  return {
    open,
    close,
    isOpen: () => !popup.hidden,
    destroy() {
      cancelButton.removeEventListener('click', onCancelClick);
      okButton.removeEventListener('click', onOkClick);
      urlInput.removeEventListener('keydown', onUrlKeyDown);
      textInput.removeEventListener('keydown', onTextKeyDown);
      document.removeEventListener('pointerdown', onDocumentPointerDown);
      document.removeEventListener('keydown', onDocumentKeyDown);
      popup.remove();
    },
  };
}
