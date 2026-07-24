const BLOCK_TAG_NAMES =
  'p|div|hr|h[1-6]|table|thead|tbody|tfoot|tr|th|td|ul|ol|li|blockquote|pre|section|article|header|footer|nav|main|aside|figure|figcaption|dl|dt|dd|fieldset|form|address|script|style|noscript|iframe|template';

const BLOCK_TAG_PATTERN = new RegExp(
  `<\\/?(?:${BLOCK_TAG_NAMES})(?:\\s[^>]*)?\\/?>`,
  'i'
);

const BLOCK_OPEN_PATTERN = new RegExp(
  `<(hr(?:\\s[^>]*)?\\/?>|(?:${BLOCK_TAG_NAMES})(?:\\s[^>]*)?>)`,
  'gi'
);

const WRAPPED_BLOCK_PATTERN = /^<div>\s*<\/?(?:${BLOCK_TAG_NAMES})\b/i;

export function hasEmbeddedBlockHtml(text: string): boolean {
  return text.split('\n').some((line) => lineNeedsBlockHtmlNormalization(line));
}

export function normalizeMarkdownForPreview(markdown: string): string {
  return markdown
    .split('\n')
    .flatMap((line) => normalizeLineBlockHtml(line))
    .join('\n');
}

function lineNeedsBlockHtmlNormalization(line: string): boolean {
  if (!BLOCK_TAG_PATTERN.test(line)) {
    return false;
  }

  if (WRAPPED_BLOCK_PATTERN.test(line.trimStart())) {
    return false;
  }

  let match: RegExpExecArray | null;
  const pattern = new RegExp(BLOCK_OPEN_PATTERN.source, 'gi');
  let blockTagCount = 0;
  let hasEmbeddedBlockTag = false;

  while ((match = pattern.exec(line)) !== null) {
    blockTagCount += 1;
    if (match.index > 0) {
      hasEmbeddedBlockTag = true;
    }
  }

  if (hasEmbeddedBlockTag) {
    return true;
  }

  const trimmed = line.trimStart();
  if (blockTagCount > 1) {
    return true;
  }

  if (blockTagCount === 1 && trimmed.length > 0 && !trimmed.startsWith('<')) {
    return true;
  }

  return false;
}

function normalizeLineBlockHtml(line: string): string[] {
  if (!lineNeedsBlockHtmlNormalization(line)) {
    return [line];
  }

  const segments = splitLineByBlockHtml(line);

  return segments.map((segment) => segment.text);
}

function splitLineByBlockHtml(line: string): Array<{ type: 'inline' | 'block'; text: string }> {
  const segments: Array<{ type: 'inline' | 'block'; text: string }> = [];
  let cursor = 0;
  let match: RegExpExecArray | null;
  const pattern = new RegExp(BLOCK_OPEN_PATTERN.source, 'gi');

  while ((match = pattern.exec(line)) !== null) {
    const index = match.index;

    if (index > cursor) {
      segments.push({ type: 'inline', text: line.slice(cursor, index) });
    }

    const blockHtml = extractBlockHtml(line, index, match[0]);
    segments.push({ type: 'block', text: blockHtml });
    cursor = index + blockHtml.length;
    pattern.lastIndex = cursor;
  }

  if (cursor < line.length) {
    segments.push({ type: 'inline', text: line.slice(cursor) });
  }

  return segments;
}

function extractBlockHtml(line: string, start: number, tagOpen: string): string {
  const rest = line.slice(start);
  const lower = tagOpen.toLowerCase();

  if (lower.startsWith('<hr')) {
    const match = rest.match(/^<hr(?:\s[^>]*)?\/?>/i);
    return match?.[0] ?? tagOpen;
  }

  const tagNameMatch = lower.match(/^<([a-z0-9]+)/i);
  const tagName = tagNameMatch?.[1];

  if (!tagName || tagName === 'hr') {
    return tagOpen;
  }

  return extractBalancedTag(rest, tagName) ?? tagOpen;
}

function extractBalancedTag(source: string, tagName: string): string | null {
  const openPattern = new RegExp(`<${tagName}(?:\\s[^>]*)?>`, 'i');
  const openMatch = source.match(openPattern);

  if (!openMatch || openMatch.index !== 0) {
    return null;
  }

  let depth = 0;
  let cursor = 0;
  const tagPattern = new RegExp(`<(\\/?)(${tagName})(?:\\s[^>]*)?>`, 'gi');
  let match: RegExpExecArray | null;

  while ((match = tagPattern.exec(source)) !== null) {
    if (match.index < cursor) {
      continue;
    }

    if (match[1] === '/') {
      depth -= 1;
    } else {
      depth += 1;
    }

    if (depth === 0) {
      return source.slice(0, match.index + match[0].length);
    }
  }

  return null;
}
