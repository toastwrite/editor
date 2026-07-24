export type MarkdownPos = [number, number];

export interface MarkdownTextEdit {
  startPos: MarkdownPos;
  endPos: MarkdownPos;
  newText: string;
}

export function offsetToPos(text: string, offset: number): MarkdownPos {
  const before = text.slice(0, offset);
  const lines = before.split('\n');

  return [lines.length, (lines[lines.length - 1]?.length ?? 0) + 1];
}

export function computeMarkdownEdit(
  oldText: string,
  newText: string
): MarkdownTextEdit | null {
  if (oldText === newText) {
    return null;
  }

  const minLength = Math.min(oldText.length, newText.length);
  let prefix = 0;

  while (prefix < minLength && oldText[prefix] === newText[prefix]) {
    prefix += 1;
  }

  let suffix = 0;
  while (
    suffix < minLength - prefix &&
    oldText[oldText.length - 1 - suffix] === newText[newText.length - 1 - suffix]
  ) {
    suffix += 1;
  }

  const oldStart = prefix;
  const oldEnd = oldText.length - suffix;
  const insertedText = newText.slice(prefix, newText.length - suffix);

  return {
    startPos: offsetToPos(oldText, oldStart),
    endPos: offsetToPos(oldText, oldEnd),
    newText: insertedText,
  };
}
