export type PreviewSplitState = 'both' | 'editor-hidden' | 'preview-hidden';

export interface PreviewSplitterOptions {
  container: HTMLElement;
  editorWrap: HTMLElement;
  previewWrap: HTMLElement;
  onResize?: () => void;
}

const MIN_PANEL_RATIO = 0.12;
const DEFAULT_RATIO = 0.5;

export class PreviewSplitter {
  private readonly el: HTMLElement;
  private readonly handle: HTMLElement;
  private readonly hideEditorButton: HTMLButtonElement;
  private readonly hidePreviewButton: HTMLButtonElement;
  private editorRatio = DEFAULT_RATIO;
  private savedRatio = DEFAULT_RATIO;
  private splitState: PreviewSplitState = 'both';
  private dragging = false;
  private cleanupFns: Array<() => void> = [];

  constructor(private readonly options: PreviewSplitterOptions) {
    this.el = document.createElement('div');
    this.el.className = 'toastwrite-editor-md-splitter';
    this.el.setAttribute('role', 'separator');
    this.el.setAttribute('aria-orientation', 'vertical');
    this.el.setAttribute('aria-valuemin', '0');
    this.el.setAttribute('aria-valuemax', '100');

    this.hideEditorButton = document.createElement('button');
    this.hideEditorButton.type = 'button';
    this.hideEditorButton.className =
      'toastwrite-editor-md-splitter-button toastwrite-editor-md-splitter-hide-editor';
    this.hideEditorButton.setAttribute('aria-label', 'Hide editor');
    this.hideEditorButton.textContent = '◀';

    this.handle = document.createElement('div');
    this.handle.className = 'toastwrite-editor-md-splitter-handle';
    this.handle.setAttribute('aria-label', 'Resize editor and preview');

    const controls = document.createElement('div');
    controls.className = 'toastwrite-editor-md-splitter-controls';

    this.hidePreviewButton = document.createElement('button');
    this.hidePreviewButton.type = 'button';
    this.hidePreviewButton.className =
      'toastwrite-editor-md-splitter-button toastwrite-editor-md-splitter-hide-preview';
    this.hidePreviewButton.setAttribute('aria-label', 'Hide preview');
    this.hidePreviewButton.textContent = '▶';

    controls.append(this.hideEditorButton, this.hidePreviewButton);
    this.el.append(this.handle, controls);
    options.editorWrap.after(this.el);

    options.container.classList.add('toastwrite-editor-md-split-enabled');
    this.applyLayout();
    this.bindEvents();
  }

  destroy(): void {
    this.cleanupFns.forEach((cleanup) => cleanup());
    this.cleanupFns = [];
    this.el.remove();
    this.options.container.classList.remove(
      'toastwrite-editor-md-split-enabled',
      'toastwrite-editor-md-split-editor-hidden',
      'toastwrite-editor-md-split-preview-hidden'
    );
    this.options.editorWrap.style.flex = '';
    this.options.editorWrap.style.width = '';
    this.options.previewWrap.style.flex = '';
    this.options.previewWrap.style.width = '';
  }

  private bindEvents(): void {
    const onHideEditor = (event: Event) => {
      event.preventDefault();
      event.stopPropagation();
      this.onEditorButtonClick();
    };

    const onHidePreview = (event: Event) => {
      event.preventDefault();
      event.stopPropagation();
      this.onPreviewButtonClick();
    };

    const onHandlePointerDown = (event: PointerEvent) => {
      if (event.button !== 0) {
        return;
      }

      event.preventDefault();
      this.dragging = true;
      this.handle.setPointerCapture(event.pointerId);
      document.body.classList.add('toastwrite-editor-md-split-dragging');

      if (this.splitState !== 'both') {
        this.splitState = 'both';
        this.editorRatio = this.savedRatio;
        this.applyLayout();
      }

      this.updateRatioFromPointer(event.clientX);
    };

    const onHandlePointerMove = (event: PointerEvent) => {
      if (!this.dragging) {
        return;
      }

      event.preventDefault();
      this.updateRatioFromPointer(event.clientX);
    };

    const endDrag = (event: PointerEvent) => {
      if (!this.dragging) {
        return;
      }

      this.dragging = false;
      if (this.handle.hasPointerCapture(event.pointerId)) {
        this.handle.releasePointerCapture(event.pointerId);
      }
      document.body.classList.remove('toastwrite-editor-md-split-dragging');
    };

    this.hideEditorButton.addEventListener('click', onHideEditor);
    this.hidePreviewButton.addEventListener('click', onHidePreview);
    this.handle.addEventListener('pointerdown', onHandlePointerDown);
    this.handle.addEventListener('pointermove', onHandlePointerMove);
    this.handle.addEventListener('pointerup', endDrag);
    this.handle.addEventListener('pointercancel', endDrag);

    this.cleanupFns.push(
      () => this.hideEditorButton.removeEventListener('click', onHideEditor),
      () => this.hidePreviewButton.removeEventListener('click', onHidePreview),
      () => this.handle.removeEventListener('pointerdown', onHandlePointerDown),
      () => this.handle.removeEventListener('pointermove', onHandlePointerMove),
      () => this.handle.removeEventListener('pointerup', endDrag),
      () => this.handle.removeEventListener('pointercancel', endDrag),
      () => document.body.classList.remove('toastwrite-editor-md-split-dragging')
    );
  }

  private toggleEditorHidden(): void {
    if (this.splitState === 'editor-hidden') {
      this.splitState = 'both';
      this.editorRatio = this.savedRatio;
    } else {
      this.savedRatio = this.editorRatio;
      this.splitState = 'editor-hidden';
    }

    this.applyLayout();
  }

  private togglePreviewHidden(): void {
    if (this.splitState === 'preview-hidden') {
      this.splitState = 'both';
      this.editorRatio = this.savedRatio;
    } else {
      this.savedRatio = this.editorRatio;
      this.splitState = 'preview-hidden';
    }

    this.applyLayout();
  }

  private onEditorButtonClick(): void {
    if (this.splitState === 'preview-hidden') {
      this.togglePreviewHidden();
      return;
    }

    this.toggleEditorHidden();
  }

  private onPreviewButtonClick(): void {
    if (this.splitState === 'editor-hidden') {
      this.toggleEditorHidden();
      return;
    }

    this.togglePreviewHidden();
  }

  private updateButtonLabels(): void {
    this.hideEditorButton.toggleAttribute('hidden', this.splitState === 'editor-hidden');
    this.hidePreviewButton.toggleAttribute('hidden', this.splitState === 'preview-hidden');

    this.el.classList.toggle(
      'toastwrite-editor-md-splitter-editor-collapsed',
      this.splitState === 'editor-hidden'
    );
    this.el.classList.toggle(
      'toastwrite-editor-md-splitter-preview-collapsed',
      this.splitState === 'preview-hidden'
    );

    if (this.splitState === 'editor-hidden') {
      this.hidePreviewButton.setAttribute('aria-label', 'Show editor');
      return;
    }

    if (this.splitState === 'preview-hidden') {
      this.hideEditorButton.setAttribute('aria-label', 'Show preview');
      return;
    }

    this.hideEditorButton.setAttribute('aria-label', 'Hide editor');
    this.hidePreviewButton.setAttribute('aria-label', 'Hide preview');
  }

  private getAvailableWidth(): number {
    const { container } = this.options;
    return Math.max(container.clientWidth - this.el.offsetWidth, 1);
  }

  private updateRatioFromPointer(clientX: number): void {
    const { container } = this.options;
    const rect = container.getBoundingClientRect();
    const available = this.getAvailableWidth();
    const offset = clientX - rect.left;
    const ratio = offset / available;
    this.editorRatio = Math.min(Math.max(ratio, MIN_PANEL_RATIO), 1 - MIN_PANEL_RATIO);
    this.splitState = 'both';
    this.applyLayout();
  }

  private applyLayout(): void {
    const { container, editorWrap, previewWrap } = this.options;

    container.classList.toggle(
      'toastwrite-editor-md-split-editor-hidden',
      this.splitState === 'editor-hidden'
    );
    container.classList.toggle(
      'toastwrite-editor-md-split-preview-hidden',
      this.splitState === 'preview-hidden'
    );

    if (this.splitState === 'editor-hidden') {
      editorWrap.style.flex = '0 0 0';
      editorWrap.style.width = '0';
      previewWrap.style.flex = '1 1 auto';
      previewWrap.style.width = '';
      this.el.setAttribute('aria-valuenow', '0');
    } else if (this.splitState === 'preview-hidden') {
      editorWrap.style.flex = '1 1 auto';
      editorWrap.style.width = '';
      previewWrap.style.flex = '0 0 0';
      previewWrap.style.width = '0';
      this.el.setAttribute('aria-valuenow', '100');
    } else {
      const percent = Math.round(this.editorRatio * 100);
      editorWrap.style.flex = `0 0 ${percent}%`;
      editorWrap.style.width = `${percent}%`;
      previewWrap.style.flex = '1 1 0';
      previewWrap.style.width = '';
      this.el.setAttribute('aria-valuenow', String(percent));
    }

    this.updateButtonLabels();
    this.options.onResize?.();
  }
}
