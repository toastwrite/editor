import type { EditResult, MdNode } from '@toastwrite/parser';
import { Renderer, ToastMark } from '@toastwrite/parser';
import DOMPurify from 'dompurify';
import { patchPreviewDom } from './preview-patcher.js';

export interface PreviewServiceOptions {
  sanitize?: (html: string) => string;
}

const DEFAULT_SANITIZE_OPTIONS = {
  USE_PROFILES: { html: true },
  ADD_ATTR: ['data-nodeid'],
};

export class PreviewService {
  private renderer = new Renderer({ gfm: true, nodeId: true, softbreak: '<br />\n' });
  private sanitize: (html: string) => string;

  constructor(options: PreviewServiceOptions = {}) {
    this.sanitize =
      options.sanitize ??
      ((html) =>
        DOMPurify.sanitize(html, DEFAULT_SANITIZE_OPTIONS));
  }

  render(toastMark: ToastMark): string {
    const html = this.renderer.render(toastMark.getRootNode());
    return this.sanitize(html);
  }

  renderNodes(nodes: MdNode[]): string {
    return this.sanitize(nodes.map((node) => this.renderer.render(node)).join(''));
  }

  updatePreview(
    previewEl: HTMLElement,
    editResults: EditResult[],
    toastMark: ToastMark,
    applyHooks: (html: string) => string
  ): 'partial' | 'full' {
    if (editResults.length === 0) {
      return 'partial';
    }

    const renderNodeHtml = (node: MdNode) =>
      this.sanitize(applyHooks(this.renderer.render(node)));

    const patched = patchPreviewDom(previewEl, editResults, renderNodeHtml);

    if (!patched) {
      previewEl.innerHTML = applyHooks(this.render(toastMark));
      return 'full';
    }

    return 'partial';
  }
}
