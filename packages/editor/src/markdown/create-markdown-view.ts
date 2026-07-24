import { EditorState } from 'prosemirror-state';
import type { Transaction } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { keymap } from 'prosemirror-keymap';
import { baseKeymap } from 'prosemirror-commands';
import { history, redo, undo } from 'prosemirror-history';
import type { EditResult } from '@toastwrite/parser';
import type { Node as ProseMirrorNode } from 'prosemirror-model';
import { markdownLineSchema as schema } from './schema.js';
import {
  markdownEnterKeymap,
  markdownShiftTabKeymap,
  markdownTabKeymap,
} from './list-keymap.js';
import { syntaxHighlightPlugin, applySyntaxHighlight } from './syntax-highlight.js';
import { EDIT_RESULT_META } from './document-edit.js';
import {
  docToMarkdown,
  posToMarkdownOffset,
  replaceDocumentFromMarkdown,
} from './doc-bridge.js';
import {
  hasEmbeddedBlockHtml,
  normalizeMarkdownForPreview,
} from './normalize-block-html.js';
import { getClipboardText, mergeMarkdownPaste, sliceToPlainMarkdownText } from './clipboard.js';

export const NORMALIZE_BLOCK_HTML_META = 'normalizeBlockHtml';
export const PASTE_META = 'pasteMarkdown';

export interface MarkdownViewChange {
  prevDoc: ProseMirrorNode;
  nextDoc: ProseMirrorNode;
  tr: Transaction;
}

export interface MarkdownDocumentEdit {
  prevDoc: ProseMirrorNode;
  tr: Transaction;
}

export interface CreateMarkdownViewOptions {
  mount: HTMLElement;
  doc: ProseMirrorNode;
  onDocumentEdit?: (change: MarkdownDocumentEdit) => EditResult[] | void;
  onChange?: (change: MarkdownViewChange) => void;
  onFocus?: () => void;
  onBlur?: () => void;
}

export function createMarkdownView({
  mount,
  doc,
  onDocumentEdit,
  onChange,
  onFocus,
  onBlur,
}: CreateMarkdownViewOptions): EditorView {
  const state = EditorState.create({
    doc,
    schema,
    plugins: [
      history(),
      syntaxHighlightPlugin(),
      keymap({
        Enter: markdownEnterKeymap,
        Tab: markdownTabKeymap,
        'Shift-Tab': markdownShiftTabKeymap,
      }),
      keymap({
        ...Object.fromEntries(Object.entries(baseKeymap).filter(([key]) => key !== 'Enter')),
        'Mod-z': undo,
        'Mod-y': redo,
        'Mod-Shift-z': redo,
      }),
    ],
  });

  const view = new EditorView(mount, {
    state,
    dispatchTransaction(tr) {
      const prevDoc = view.state.doc;
      const isUserEdit =
        tr.docChanged && !tr.getMeta('syntaxHighlight') && !tr.getMeta(NORMALIZE_BLOCK_HTML_META);

      if (isUserEdit) {
        const editResults = onDocumentEdit?.({ prevDoc, tr });
        if (editResults?.length) {
          tr.setMeta(EDIT_RESULT_META, editResults);
        }
      }

      const nextState = view.state.apply(tr);
      view.updateState(nextState);

      if (isUserEdit) {
        onChange?.({ prevDoc, nextDoc: nextState.doc, tr });
      }
    },
    clipboardTextSerializer(slice) {
      return sliceToPlainMarkdownText(slice);
    },
    handlePaste(view, event) {
      const text = getClipboardText(event.clipboardData);
      if (text === '') {
        return false;
      }

      event.preventDefault();

      const { from, to } = view.state.selection;
      const currentMarkdown = docToMarkdown(view.state.doc);
      const start = posToMarkdownOffset(view.state.doc, from);
      const end = posToMarkdownOffset(view.state.doc, to);
      const { markdown: mergedMarkdown, selection: nextSelection } = mergeMarkdownPaste(
        currentMarkdown,
        start,
        end,
        text
      );
      const normalizedMarkdown = hasEmbeddedBlockHtml(text)
        ? normalizeMarkdownForPreview(mergedMarkdown)
        : mergedMarkdown;

      const tr = replaceDocumentFromMarkdown(
        view.state.tr,
        normalizedMarkdown,
        nextSelection
      ).setMeta(PASTE_META, true);

      view.dispatch(tr);
      return true;
    },
    handleKeyDown(view, event) {
      if (event.ctrlKey || event.metaKey || event.altKey) {
        return false;
      }

      if (event.key === 'Enter' && !event.shiftKey) {
        return markdownEnterKeymap(view.state, view.dispatch, view);
      }

      if (event.key === 'Tab') {
        event.preventDefault();
        event.stopPropagation();
        if (event.shiftKey) {
          return markdownShiftTabKeymap(view.state, view.dispatch, view);
        }
        return markdownTabKeymap(view.state, view.dispatch, view);
      }

      return false;
    },
  });

  view.dom.classList.add('toastwrite-editor-md-editor', 'ProseMirror');
  view.dom.setAttribute('spellcheck', 'false');

  view.dom.addEventListener('focus', () => onFocus?.());
  view.dom.addEventListener('blur', () => onBlur?.());

  const initialHighlight = applySyntaxHighlight(view.state);
  if (initialHighlight) {
    view.dispatch(initialHighlight);
  }

  return view;
}
