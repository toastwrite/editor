export interface BlockquoteLineInfo {
  indent: string;
  content: string;
  spaced: boolean;
}

/** CommonMark blockquote: `>` followed by optional space and content. */
export const RE_BLOCKQUOTE = /^(\s*)>( ?)(.*)$/;

export function parseBlockquoteLine(line: string): BlockquoteLineInfo | null {
  const match = line.match(RE_BLOCKQUOTE);
  if (!match) {
    return null;
  }

  return {
    indent: match[1],
    spaced: match[2] === ' ',
    content: match[3],
  };
}

export function getBlockquotePrefix(info: BlockquoteLineInfo): string {
  return `${info.indent}>${info.spaced ? ' ' : ''}`;
}

export function getBlockquoteContentStart(info: BlockquoteLineInfo): number {
  return info.indent.length + 1 + (info.spaced ? 1 : 0);
}

export function isEmptyBlockquoteLine(info: BlockquoteLineInfo): boolean {
  return !info.content.trim();
}
