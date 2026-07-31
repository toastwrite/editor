import type { ImagePopupInitialValues } from '../../commands/image-helpers.js';

export interface ImagePopupOptions {
  mount: HTMLElement;
  onSubmit: (values: { url: string; altText: string }) => void;
}

export interface ImagePopupController {
  open(trigger: HTMLElement, initialValues: ImagePopupInitialValues): void;
  close(): void;
  isOpen(): boolean;
  destroy(): void;
}

type ImageTab = 'file' | 'url';

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

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function createImagePopup({ mount, onSubmit }: ImagePopupOptions): ImagePopupController {
  const popup = document.createElement('div');
  popup.className = 'toastwrite-editor-image-popup';
  popup.hidden = true;
  popup.setAttribute('role', 'dialog');
  popup.setAttribute('aria-label', 'Insert image');

  const body = document.createElement('div');
  body.className = 'toastwrite-editor-image-popup-body';

  const tabs = document.createElement('div');
  tabs.className = 'toastwrite-editor-image-popup-tabs';

  const fileTab = document.createElement('button');
  fileTab.type = 'button';
  fileTab.className = 'toastwrite-editor-image-popup-tab active';
  fileTab.dataset.tab = 'file';
  fileTab.textContent = 'File';

  const urlTab = document.createElement('button');
  urlTab.type = 'button';
  urlTab.className = 'toastwrite-editor-image-popup-tab';
  urlTab.dataset.tab = 'url';
  urlTab.textContent = 'URL';

  tabs.append(fileTab, urlTab);

  const filePanel = document.createElement('div');
  filePanel.className = 'toastwrite-editor-image-popup-panel';
  filePanel.dataset.panel = 'file';

  const fileLabel = document.createElement('label');
  fileLabel.className = 'toastwrite-editor-image-popup-label';
  fileLabel.textContent = 'Select image file';

  const fileRow = document.createElement('div');
  fileRow.className = 'toastwrite-editor-image-popup-file-row';

  const fileName = document.createElement('span');
  fileName.className = 'toastwrite-editor-image-popup-file-name';
  fileName.textContent = 'No file';

  const chooseFileButton = document.createElement('button');
  chooseFileButton.type = 'button';
  chooseFileButton.className = 'toastwrite-editor-image-popup-file-button';
  chooseFileButton.textContent = 'Choose a file';

  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'image/*';
  fileInput.className = 'toastwrite-editor-image-popup-file-input';
  fileInput.tabIndex = -1;

  fileRow.append(fileName, chooseFileButton, fileInput);
  filePanel.append(fileLabel, fileRow);

  const urlPanel = document.createElement('div');
  urlPanel.className = 'toastwrite-editor-image-popup-panel';
  urlPanel.dataset.panel = 'url';
  urlPanel.hidden = true;

  const urlLabel = document.createElement('label');
  urlLabel.className = 'toastwrite-editor-image-popup-label';
  urlLabel.htmlFor = 'toastwrite-editor-image-url';
  urlLabel.textContent = 'Image URL';

  const urlInput = document.createElement('input');
  urlInput.id = 'toastwrite-editor-image-url';
  urlInput.type = 'text';
  urlInput.className = 'toastwrite-editor-image-popup-input';
  urlInput.autocomplete = 'off';

  urlPanel.append(urlLabel, urlInput);

  const altLabel = document.createElement('label');
  altLabel.className = 'toastwrite-editor-image-popup-label';
  altLabel.htmlFor = 'toastwrite-editor-image-alt';
  altLabel.textContent = 'Description';

  const altInput = document.createElement('input');
  altInput.id = 'toastwrite-editor-image-alt';
  altInput.type = 'text';
  altInput.className = 'toastwrite-editor-image-popup-input';
  altInput.autocomplete = 'off';

  const actions = document.createElement('div');
  actions.className = 'toastwrite-editor-image-popup-actions';

  const cancelButton = document.createElement('button');
  cancelButton.type = 'button';
  cancelButton.className =
    'toastwrite-editor-image-popup-button toastwrite-editor-image-popup-cancel';
  cancelButton.textContent = 'Cancel';

  const okButton = document.createElement('button');
  okButton.type = 'button';
  okButton.className = 'toastwrite-editor-image-popup-button toastwrite-editor-image-popup-ok';
  okButton.textContent = 'OK';

  actions.append(cancelButton, okButton);
  body.append(tabs, filePanel, urlPanel, altLabel, altInput, actions);
  popup.appendChild(body);
  mount.appendChild(popup);

  let triggerEl: HTMLElement | null = null;
  let activeTab: ImageTab = 'file';
  let selectedFile: File | null = null;
  let altTextDisabled = false;

  const clearValidation = (): void => {
    urlInput.classList.remove('is-invalid');
    fileName.classList.remove('is-invalid');
    altInput.classList.remove('is-invalid');
  };

  const setAltTextDisabled = (disabled: boolean): void => {
    altTextDisabled = disabled;
    altInput.disabled = disabled;
    altInput.classList.toggle('is-disabled', disabled);
  };

  const setActiveTab = (tab: ImageTab): void => {
    activeTab = tab;
    fileTab.classList.toggle('active', tab === 'file');
    urlTab.classList.toggle('active', tab === 'url');
    filePanel.hidden = tab !== 'file';
    urlPanel.hidden = tab !== 'url';
    clearValidation();
  };

  const resetFileSelection = (): void => {
    selectedFile = null;
    fileInput.value = '';
    fileName.textContent = 'No file';
    fileName.classList.remove('has-file');
  };

  const initialize = (initialValues: ImagePopupInitialValues): void => {
    clearValidation();
    setActiveTab('file');
    resetFileSelection();
    urlInput.value = initialValues.url;
    altInput.value = initialValues.altText;
    setAltTextDisabled(initialValues.altTextDisabled);
  };

  const close = (): void => {
    popup.hidden = true;
    triggerEl = null;
    clearValidation();
  };

  const open = (trigger: HTMLElement, initialValues: ImagePopupInitialValues): void => {
    triggerEl = trigger;
    initialize(initialValues);
    popup.hidden = false;
    positionPopup(popup, trigger, mount);

    if (initialValues.url && initialValues.altTextDisabled) {
      setActiveTab('url');
      urlInput.focus();
      urlInput.select();
      return;
    }

    if (activeTab === 'url') {
      urlInput.focus();
    } else {
      altInput.focus();
    }
  };

  const submitUrl = (): void => {
    clearValidation();

    const url = urlInput.value.trim();
    if (!url) {
      urlInput.classList.add('is-invalid');
      urlInput.focus();
      return;
    }

    const altText = altTextDisabled ? altInput.value : altInput.value.trim() || 'image';
    onSubmit({ url, altText });
    close();
  };

  const submitFile = async (): Promise<void> => {
    clearValidation();

    if (!selectedFile) {
      fileName.classList.add('is-invalid');
      return;
    }

    try {
      const url = await readFileAsDataUrl(selectedFile);
      const altText = altTextDisabled
        ? altInput.value
        : altInput.value.trim() || selectedFile.name || 'image';
      onSubmit({ url, altText });
      close();
    } catch {
      fileName.classList.add('is-invalid');
    }
  };

  const submit = (): void => {
    if (activeTab === 'file') {
      void submitFile();
      return;
    }

    submitUrl();
  };

  const onTabClick = (event: Event): void => {
    const target = event.currentTarget as HTMLButtonElement;
    const tab = target.dataset.tab as ImageTab | undefined;
    if (!tab || tab === activeTab) {
      return;
    }

    setActiveTab(tab);
    resetFileSelection();
    urlInput.value = '';
  };

  const onChooseFileClick = (): void => {
    fileInput.click();
  };

  const onFileNameClick = (): void => {
    fileInput.click();
  };

  const onFileChange = (): void => {
    const file = fileInput.files?.item(0) ?? null;
    selectedFile = file;

    if (file) {
      fileName.textContent = file.name;
      fileName.classList.add('has-file');
      fileName.classList.remove('is-invalid');
      return;
    }

    resetFileSelection();
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

  const onUrlKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Enter') {
      event.preventDefault();
      submitUrl();
    }
  };

  const onAltKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Enter') {
      event.preventDefault();
      submit();
    }
  };

  fileTab.addEventListener('click', onTabClick);
  urlTab.addEventListener('click', onTabClick);
  chooseFileButton.addEventListener('click', onChooseFileClick);
  fileName.addEventListener('click', onFileNameClick);
  fileInput.addEventListener('change', onFileChange);
  cancelButton.addEventListener('click', close);
  okButton.addEventListener('click', submit);
  urlInput.addEventListener('keydown', onUrlKeyDown);
  altInput.addEventListener('keydown', onAltKeyDown);
  document.addEventListener('pointerdown', onDocumentPointerDown);
  document.addEventListener('keydown', onDocumentKeyDown);

  return {
    open,
    close,
    isOpen: () => !popup.hidden,
    destroy() {
      fileTab.removeEventListener('click', onTabClick);
      urlTab.removeEventListener('click', onTabClick);
      chooseFileButton.removeEventListener('click', onChooseFileClick);
      fileName.removeEventListener('click', onFileNameClick);
      fileInput.removeEventListener('change', onFileChange);
      cancelButton.removeEventListener('click', close);
      okButton.removeEventListener('click', submit);
      urlInput.removeEventListener('keydown', onUrlKeyDown);
      altInput.removeEventListener('keydown', onAltKeyDown);
      document.removeEventListener('pointerdown', onDocumentPointerDown);
      document.removeEventListener('keydown', onDocumentKeyDown);
      popup.remove();
    },
  };
}
