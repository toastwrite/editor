import { EditorState } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';
import { insertMarkdownLink, getLinkPopupInitialValues } from '../commands/link-helpers.js';
import { insertMarkdownImage, getImagePopupInitialValues } from '../commands/image-helpers.js';
import { insertMarkdownTable } from '../commands/markdown-helpers.js';
import { executeMarkdownCommand } from '../commands/markdown-commands.js';
import type { CommandId } from '../commands/types.js';
import type { EditResult } from '@toastwrite/parser';
import type { Transaction } from 'prosemirror-state';
import type { EditorContext } from '../core/editor-context.js';
import { NORMALIZE_BLOCK_HTML_META, PASTE_META } from '../markdown/create-markdown-view.js';
import { collectTransactionEditResults } from '../markdown/document-edit.js';
import { normalizeMarkdownForPreview } from '../markdown/normalize-block-html.js';
import { createMarkdownView } from '../markdown/create-markdown-view.js';
import { PreviewSplitter } from '../markdown/preview-splitter.js';
import { applySyntaxHighlight } from '../markdown/syntax-highlight.js';
import {
  docToMarkdown,
  markdownToDoc,
  posToMarkdownOffset,
  replaceDocumentFromMarkdown,
  setSelectionFromMarkdownOffset,
} from '../markdown/doc-bridge.js';
import type { PreviewStyle, SelectionPos } from '../types.js';
import type { EditorMode } from './editor-mode.js';

const MD_CLASS = 'toastwrite-editor-md-container';
const PREVIEW_CLASS = 'toastwrite-editor-md-preview';
const TAB_CLASS = 'toastwrite-editor-tabs';
const TAB_ACTIVE_CLASS = 'active';

export class MarkdownMode implements EditorMode {
  readonly type = 'markdown' as const;

  private root!: HTMLElement;
  private container!: HTMLElement;
  private editorMount!: HTMLElement;
  private previewEl!: HTMLElement;
  private editorWrap!: HTMLElement;
  private scrollWrap!: HTMLElement;
  private previewWrap!: HTMLElement;
  private tabsEl: HTMLElement | null = null;
  private previewStyle: PreviewStyle;
  private previewSplitter: boolean;
  private previewSplitterControl: PreviewSplitter | null = null;
  private initialScrollSync: boolean;
  private context: EditorContext;
  private view: EditorView | null = null;
  private isActive = false;
  private scrollSyncEnabled = false;

  constructor(
    context: EditorContext,
    previewStyle: PreviewStyle,
    previewSplitter = false,
    scrollSync = true
  ) {
    this.context = context;
    this.previewStyle = previewStyle;
    this.previewSplitter = previewSplitter;
    this.initialScrollSync = scrollSync;
  }

  getScrollSyncEnabled(): boolean {
    return this.scrollSyncEnabled;
  }

  setScrollSyncEnabled(enabled: boolean): void {
    this.scrollSyncEnabled = enabled && this.previewStyle === 'vertical';
  }

  mount(root: HTMLElement): void {
    this.root = root;
    this.container = document.createElement('div');
    this.container.className = `${MD_CLASS} toastwrite-editor-md-${this.previewStyle}`;

    if (this.previewStyle === 'tab') {
      this.tabsEl = this.createTabs();
      this.container.appendChild(this.tabsEl);
    }

    this.editorMount = document.createElement('div');
    this.editorMount.className = 'toastwrite-editor-md-editor-mount';

    this.previewEl = document.createElement('div');
    this.previewEl.className = `${PREVIEW_CLASS} toastwrite-editor-contents`;

    this.scrollWrap = document.createElement('div');
    this.scrollWrap.className = 'toastwrite-editor-md-scroll-wrap';

    this.editorWrap = document.createElement('div');
    this.editorWrap.className = 'toastwrite-editor-md-editor-wrap';

    this.scrollWrap.appendChild(this.editorMount);
    this.editorWrap.appendChild(this.scrollWrap);

    const previewWrap = document.createElement('div');
    previewWrap.className = 'toastwrite-editor-md-preview-wrap';
    previewWrap.appendChild(this.previewEl);
    this.previewWrap = previewWrap;

    this.container.appendChild(this.editorWrap);
    this.container.appendChild(this.previewWrap);
    this.root.appendChild(this.container);

    if (this.previewSplitter && this.previewStyle === 'vertical') {
      this.previewSplitterControl = new PreviewSplitter({
        container: this.container,
        editorWrap: this.editorWrap,
        previewWrap: this.previewWrap,
      });
    }

    this.createView();
    this.bindEvents();
    this.renderPreview();
  }

  activate(): void {
    this.isActive = true;
    this.container.style.display = '';
    this.syncFromContext();
    this.view?.focus();
  }

  deactivate(): void {
    const wasActive = this.isActive;
    this.isActive = false;
    this.container.style.display = 'none';

    if (wasActive) {
      this.syncToContext();
    }
  }

  destroy(): void {
    this.unbindEvents();
    this.previewSplitterControl?.destroy();
    this.previewSplitterControl = null;
    this.view?.destroy();
    this.view = null;
    this.container.remove();
  }

  focus(): void {
    this.view?.focus();
  }

  getSelection(): SelectionPos {
    if (!this.view) {
      return { start: 0, end: 0 };
    }

    const { from, to } = this.view.state.selection;
    return {
      start: posToMarkdownOffset(this.view.state.doc, from),
      end: posToMarkdownOffset(this.view.state.doc, to),
    };
  }

  setSelection({ start, end }: SelectionPos): void {
    if (!this.view) {
      return;
    }

    const tr = setSelectionFromMarkdownOffset(this.view.state.tr, { start, end });
    this.view.dispatch(tr);
  }

  insertLink(url: string, linkText: string): boolean {
    if (!this.view) {
      return false;
    }

    this.focus();
    const markdown = docToMarkdown(this.view.state.doc);
    const selection = this.getSelection();
    const result = insertMarkdownLink(markdown, selection, { url, linkText });

    this.view.dispatch(replaceDocumentFromMarkdown(this.view.state.tr, result.value, result.selection));
    this.syncToContext();
    this.context.events.emit('change');
    this.renderPreview();
    return true;
  }

  getLinkPopupInitialValues() {
    if (!this.view) {
      return { url: '', linkText: '', linkTextDisabled: false };
    }

    return getLinkPopupInitialValues(docToMarkdown(this.view.state.doc), this.getSelection());
  }

  insertImage(url: string, altText: string): boolean {
    if (!this.view) {
      return false;
    }

    this.focus();
    const markdown = docToMarkdown(this.view.state.doc);
    const selection = this.getSelection();
    const result = insertMarkdownImage(markdown, selection, { url, altText });

    this.view.dispatch(replaceDocumentFromMarkdown(this.view.state.tr, result.value, result.selection));
    this.syncToContext();
    this.context.events.emit('change');
    this.renderPreview();
    return true;
  }

  insertTable(rows: number, cols: number): boolean {
    if (!this.view) {
      return false;
    }

    this.focus();
    const markdown = docToMarkdown(this.view.state.doc);
    const selection = this.getSelection();
    const result = insertMarkdownTable(markdown, selection, rows, cols);

    this.view.dispatch(replaceDocumentFromMarkdown(this.view.state.tr, result.value, result.selection));
    this.syncToContext();
    this.context.events.emit('change');
    this.renderPreview();
    return true;
  }

  getImagePopupInitialValues() {
    if (!this.view) {
      return { url: '', altText: '', altTextDisabled: false };
    }

    return getImagePopupInitialValues(docToMarkdown(this.view.state.doc), this.getSelection());
  }

  executeCommand(commandId: CommandId): boolean {
    if (
      commandId === 'scrollSync' ||
      commandId === 'heading' ||
      commandId === 'link' ||
      commandId === 'image' ||
      commandId === 'table'
    ) {
      return false;
    }

    if (!this.view) {
      return false;
    }

    this.focus();
    const result = executeMarkdownCommand(
      docToMarkdown(this.view.state.doc),
      this.getSelection(),
      commandId
    );
    if (!result) {
      return false;
    }

    this.view.dispatch(replaceDocumentFromMarkdown(this.view.state.tr, result.value, result.selection));
    this.syncToContext();
    this.context.events.emit('change');
    this.renderPreview();
    return true;
  }

  canExecuteCommand(commandId: CommandId): boolean {
    return commandId !== 'scrollSync' && commandId !== 'heading';
  }

  syncFromContext(): void {
    this.setDocument(markdownToDoc(this.context.getMarkdown()));
    this.renderPreview();
  }

  syncToContext(): void {
    if (!this.view) {
      return;
    }

    this.context.content.setMarkdown(
      normalizeMarkdownForPreview(docToMarkdown(this.view.state.doc))
    );
  }

  private handleDocumentEdit({ tr }: { prevDoc: ReturnType<typeof markdownToDoc>; tr: Transaction }): EditResult[] {
    const rawNewMarkdown = docToMarkdown(tr.doc);
    const newMarkdown = normalizeMarkdownForPreview(rawNewMarkdown);

    if (tr.getMeta(PASTE_META)) {
      this.context.content.setMarkdown(newMarkdown);
      this.renderPreview();
      return [];
    }

    if (newMarkdown !== rawNewMarkdown) {
      this.context.content.setMarkdown(newMarkdown);
      this.renderPreview();

      queueMicrotask(() => {
        if (!this.view) {
          return;
        }

        const normalizeTr = replaceDocumentFromMarkdown(
          this.view.state.tr,
          newMarkdown,
          this.getSelection()
        ).setMeta(NORMALIZE_BLOCK_HTML_META, true);
        this.view.dispatch(normalizeTr);
      });

      return [];
    }

    if (newMarkdown === '') {
      this.context.content.setMarkdown(newMarkdown);
      this.renderPreview();
      return [];
    }

    const editResults = collectTransactionEditResults(this.context.content, tr);

    if (editResults.length === 0) {
      this.context.content.setMarkdown(newMarkdown);
      this.renderPreview();
      return [];
    }

    const updateMode = this.context.updatePreview(this.previewEl, editResults);
    if (updateMode === 'partial' && this.context.getMarkdown() === '') {
      this.renderPreview();
    }
    return editResults;
  }

  private createView(): void {
    this.view = createMarkdownView({
      mount: this.editorMount,
      doc: markdownToDoc(this.context.getMarkdown()),
      onDocumentEdit: (change) => this.handleDocumentEdit(change),
      onChange: () => {
        this.context.events.emit('change');
      },
      onFocus: () => {
        if (this.isActive) {
          this.context.events.emit('focus');
        }
      },
      onBlur: () => {
        if (this.isActive) {
          this.context.events.emit('blur');
        }
      },
    });
  }

  private setDocument(doc: ReturnType<typeof markdownToDoc>): void {
    if (!this.view) {
      return;
    }

    const state = EditorState.create({
      doc,
      schema: this.view.state.schema,
      plugins: this.view.state.plugins,
    });

    this.view.updateState(state);

    const highlightTr = applySyntaxHighlight(this.view.state);
    if (highlightTr) {
      this.view.dispatch(highlightTr);
    }
  }

  private createTabs(): HTMLElement {
    const tabs = document.createElement('div');
    tabs.className = TAB_CLASS;

    const writeTab = document.createElement('button');
    writeTab.type = 'button';
    writeTab.className = `${TAB_ACTIVE_CLASS} write`;
    writeTab.textContent = 'Write';

    const previewTab = document.createElement('button');
    previewTab.type = 'button';
    previewTab.className = 'preview';
    previewTab.textContent = 'Preview';

    writeTab.addEventListener('click', () => this.switchTab('write'));
    previewTab.addEventListener('click', () => this.switchTab('preview'));

    tabs.append(writeTab, previewTab);
    return tabs;
  }

  private switchTab(mode: 'write' | 'preview'): void {
    if (!this.tabsEl) {
      return;
    }

    this.tabsEl.querySelector('.write')?.classList.toggle(TAB_ACTIVE_CLASS, mode === 'write');
    this.tabsEl.querySelector('.preview')?.classList.toggle(TAB_ACTIVE_CLASS, mode === 'preview');
    this.container.classList.toggle('toastwrite-editor-md-tab-write', mode === 'write');
    this.container.classList.toggle('toastwrite-editor-md-tab-preview', mode === 'preview');
  }

  private bindEvents(): void {
    this.onScroll = this.onScroll.bind(this);

    this.scrollWrap.addEventListener('scroll', this.onScroll);

    if (this.previewStyle === 'vertical') {
      this.scrollSyncEnabled = this.initialScrollSync;
      this.previewWrap.addEventListener('scroll', this.onPreviewScroll);
    }
  }

  private unbindEvents(): void {
    this.scrollWrap.removeEventListener('scroll', this.onScroll);
    this.previewWrap.removeEventListener('scroll', this.onPreviewScroll);
  }

  private onScroll(): void {
    if (!this.scrollSyncEnabled || this.previewStyle !== 'vertical') {
      return;
    }

    const ratio =
      this.scrollWrap.scrollTop / (this.scrollWrap.scrollHeight - this.scrollWrap.clientHeight || 1);
    this.previewWrap.scrollTop =
      ratio * (this.previewWrap.scrollHeight - this.previewWrap.clientHeight);
  }

  private onPreviewScroll = (): void => {
    if (!this.scrollSyncEnabled) {
      return;
    }

    const ratio =
      this.previewWrap.scrollTop / (this.previewWrap.scrollHeight - this.previewWrap.clientHeight || 1);
    this.scrollWrap.scrollTop =
      ratio * (this.scrollWrap.scrollHeight - this.scrollWrap.clientHeight);
  };

  private renderPreview(): void {
    this.previewEl.innerHTML = this.context.getPreviewHtml();
  }
}
