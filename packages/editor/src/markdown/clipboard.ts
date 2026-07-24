import type { Slice } from 'prosemirror-model';

/**
 * Serialize a copied editor slice with single newlines between lines.
 * ProseMirror defaults to "\n\n", which breaks paste in this line-per-paragraph editor.
 */
export function sliceToPlainMarkdownText(slice: Slice): string {
  return slice.content.textBetween(0, slice.content.size, '\n');
}

const BLOCK_HTML_TAGS = new Set([
  'ADDRESS',
  'ARTICLE',
  'ASIDE',
  'BLOCKQUOTE',
  'DD',
  'DIV',
  'DL',
  'DT',
  'FIGCAPTION',
  'FOOTER',
  'H1',
  'H2',
  'H3',
  'H4',
  'H5',
  'H6',
  'HEADER',
  'HR',
  'LI',
  'MAIN',
  'NAV',
  'OL',
  'P',
  'PRE',
  'SECTION',
  'TABLE',
  'TD',
  'TH',
  'TR',
  'UL',
]);

const IGNORED_HTML_TAGS = new Set([
  'META',
  'STYLE',
  'SCRIPT',
  'HEAD',
  'TITLE',
  'LINK',
  'NOSCRIPT',
  'SVG',
]);

function isBlockElement(tagName: string): boolean {
  return BLOCK_HTML_TAGS.has(tagName.toUpperCase());
}

function hasElementBlockChild(element: HTMLElement): boolean {
  return Array.from(element.children).some(
    (child) =>
      child.nodeType === Node.ELEMENT_NODE &&
      isBlockElement((child as HTMLElement).tagName)
  );
}

function collectInlineText(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent ?? '';
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return '';
  }

  const element = node as HTMLElement;
  const tag = element.tagName.toUpperCase();

  if (IGNORED_HTML_TAGS.has(tag)) {
    return '';
  }

  if (tag === 'BR') {
    return '\n';
  }

  return Array.from(element.childNodes).map(collectInlineText).join('');
}

function collectLeafBlockText(element: HTMLElement): string {
  let text = '';

  element.childNodes.forEach((child) => {
    if (child.nodeType === Node.TEXT_NODE) {
      text += child.textContent ?? '';
      return;
    }

    if (child.nodeType !== Node.ELEMENT_NODE) {
      return;
    }

    const childElement = child as HTMLElement;
    const childTag = childElement.tagName.toUpperCase();

    if (childTag === 'BR') {
      text += '\n';
      return;
    }

    if (!isBlockElement(childTag)) {
      text += collectInlineText(childElement);
    }
  });

  return text;
}

function pushTextLines(lines: string[], text: string): void {
  for (const segment of text.split('\n')) {
    const trimmed = segment.trim();
    if (trimmed) {
      lines.push(trimmed);
    }
  }
}

function visitHtmlNode(lines: string[], node: Node): void {
  if (node.nodeType !== Node.ELEMENT_NODE) {
    return;
  }

  const element = node as HTMLElement;
  const tag = element.tagName.toUpperCase();

  if (IGNORED_HTML_TAGS.has(tag)) {
    return;
  }

  if (tag === 'HR') {
    lines.push('---');
    return;
  }

  if (isBlockElement(tag) && !hasElementBlockChild(element)) {
    pushTextLines(lines, collectLeafBlockText(element));
    return;
  }

  element.childNodes.forEach((child) => {
    visitHtmlNode(lines, child);
  });
}

/**
 * Convert clipboard HTML to plain text using one newline per visual line.
 * Nested block wrappers from external sites must not produce blank lines.
 */
export function clipboardHtmlToPlainText(html: string): string {
  const container = document.createElement('div');
  container.innerHTML = html;

  const lines: string[] = [];
  container.childNodes.forEach((child) => {
    visitHtmlNode(lines, child);
  });

  return lines.join('\n');
}

/**
 * Normalize pasted plain text from external sources.
 * - Unifies Windows/old-Mac line endings
 * - Collapses block-style plain text where every line is separated by blank lines
 *   (common when copying rendered HTML or rich-text as text/plain)
 */
export function normalizePastedPlainText(text: string): string {
  if (!text) {
    return '';
  }

  let normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  if (normalized.includes('\n') && !/[^\n]\n[^\n]/.test(normalized)) {
    normalized = normalized
      .split(/\n+/)
      .filter((line) => line.length > 0)
      .join('\n');
  }

  return normalized;
}

export function getClipboardText(data: DataTransfer | null | undefined): string {
  if (!data) {
    return '';
  }

  const html = data.getData('text/html');
  if (html) {
    const fromHtml = clipboardHtmlToPlainText(html);
    if (fromHtml) {
      return fromHtml;
    }
  }

  const plain = data.getData('text/plain');
  if (plain.length > 0) {
    return normalizePastedPlainText(plain);
  }

  return '';
}

export function mergeMarkdownPaste(
  currentMarkdown: string,
  start: number,
  end: number,
  pastedText: string
): { markdown: string; selection: { start: number; end: number } } {
  const normalized = normalizePastedPlainText(pastedText);
  const markdown = currentMarkdown.slice(0, start) + normalized + currentMarkdown.slice(end);
  const cursor = start + normalized.length;

  return {
    markdown,
    selection: { start: cursor, end: cursor },
  };
}
