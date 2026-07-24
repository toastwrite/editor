export const LIST_INDENT = '    ';

export interface ListLineInfo {
  indent: string;
  type: 'bullet' | 'ordered';
  bulletChar?: string;
  taskMarker?: string;
  number?: number;
  content: string;
}

const RE_TASK_BULLET = /^(\s*)([-*+]) (\[[ xX]\] )(.*)$/;
const RE_BULLET = /^(\s*)([-*+]) (.*)$/;
const RE_TASK_ORDERED = /^(\s*)(\d+)\. (\[[ xX]\] )(.*)$/;
const RE_ORDERED = /^(\s*)(\d+)\. (.*)$/;

export function parseListLine(line: string): ListLineInfo | null {
  let match = line.match(RE_TASK_BULLET);
  if (match) {
    return {
      indent: match[1],
      type: 'bullet',
      bulletChar: match[2],
      taskMarker: match[3],
      content: match[4],
    };
  }

  match = line.match(RE_TASK_ORDERED);
  if (match) {
    return {
      indent: match[1],
      type: 'ordered',
      number: Number(match[2]),
      taskMarker: match[3],
      content: match[4],
    };
  }

  match = line.match(RE_BULLET);
  if (match) {
    return {
      indent: match[1],
      type: 'bullet',
      bulletChar: match[2],
      content: match[3],
    };
  }

  match = line.match(RE_ORDERED);
  if (match) {
    return {
      indent: match[1],
      type: 'ordered',
      number: Number(match[2]),
      content: match[3],
    };
  }

  return null;
}

export function buildListPrefix(info: ListLineInfo, number = info.number): string {
  if (info.type === 'bullet') {
    return `${info.indent}${info.bulletChar} ${info.taskMarker ?? ''}`;
  }

  return `${info.indent}${number}. ${info.taskMarker ?? ''}`;
}

export function buildListLine(info: ListLineInfo, content?: string): string {
  return `${buildListPrefix(info)}${content ?? info.content}`;
}

export function getNextListPrefix(info: ListLineInfo): string {
  if (info.type === 'bullet') {
    return buildListPrefix(info);
  }

  return buildListPrefix(info, info.number! + 1);
}

export function indentListLine(line: string): string {
  const info = parseListLine(line);
  if (!info) {
    return line;
  }

  return buildListLine({ ...info, indent: info.indent + LIST_INDENT }, info.content);
}

export function outdentListLine(line: string): string | null {
  const info = parseListLine(line);
  if (!info || info.indent.length < LIST_INDENT.length) {
    return null;
  }

  const nextIndent = info.indent.slice(0, info.indent.length - LIST_INDENT.length);
  return buildListLine({ ...info, indent: nextIndent }, info.content);
}

export function isListLine(line: string): boolean {
  return parseListLine(line) !== null;
}

export function findPreviousListContext(lines: string[], beforeIndex: number): ListLineInfo | null {
  for (let index = beforeIndex - 1; index >= 0; index -= 1) {
    const info = parseListLine(lines[index]);
    if (info) {
      return info;
    }
  }

  return null;
}

export function isListContinuationLine(lines: string[], lineIndex: number): boolean {
  if (parseListLine(lines[lineIndex])) {
    return false;
  }

  return findPreviousListContext(lines, lineIndex) !== null;
}
