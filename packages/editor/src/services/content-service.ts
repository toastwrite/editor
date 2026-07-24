import type { EditResult } from '@toastwrite/parser';
import { ToastMark } from '@toastwrite/parser';
import { normalizeMarkdownForPreview } from '../markdown/normalize-block-html.js';
import type { PartialParserOptions } from './parser-options.js';
import type { MarkdownPos } from '../markdown/compute-markdown-edit.js';

export interface ContentServiceOptions extends PartialParserOptions {
  initialValue?: string;
}

export class ContentService {
  private options: ContentServiceOptions;
  private toastMark: ToastMark;

  constructor(options: ContentServiceOptions = {}) {
    this.options = options;
    this.toastMark = this.createToastMark(
      normalizeMarkdownForPreview(options.initialValue ?? '')
    );
  }

  private createToastMark(initialValue: string): ToastMark {
    return new ToastMark(initialValue, {
      frontMatter: this.options.frontMatter ?? false,
      referenceDefinition: this.options.referenceDefinition ?? false,
      disallowedHtmlBlockTags: [],
      extendedAutolinks: true,
      customParser: null,
    });
  }

  getMarkdown(): string {
    return this.toastMark.getLineTexts().join('\n');
  }

  setMarkdown(markdown: string): void {
    this.toastMark = this.createToastMark(normalizeMarkdownForPreview(markdown));
  }

  editMarkdown(startPos: MarkdownPos, endPos: MarkdownPos, newText: string): EditResult[] {
    return this.toastMark.editMarkdown(startPos, endPos, newText);
  }

  getToastMark(): ToastMark {
    return this.toastMark;
  }
}
