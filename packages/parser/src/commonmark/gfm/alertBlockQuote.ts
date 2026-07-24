import { Parser } from '../blocks';
import { BlockNode, BlockQuoteNode } from '../node';

export interface AlertData {
  type: string;
  title: string | null;
}

export const DEFAULT_ALERT_TITLES: Record<string, string> = {
  NOTE: 'Note',
  TIP: 'Tip',
  IMPORTANT: 'Important',
  WARNING: 'Warning',
  CAUTION: 'Caution',
};

const RE_ALERT_MARKER = /^\[!([A-Za-z]+)\](?:\(([^)]*)\)|(?:[ \t]+(.+))?)?$/;

export function parseAlertMarker(text: string): { type: string; title: string | null; marker: string } | null {
  const trimmed = text.trim();
  const match = trimmed.match(RE_ALERT_MARKER);
  if (!match) {
    return null;
  }

  const type = match[1].toUpperCase();
  let title: string | null = null;

  if (match[2] !== undefined) {
    title = match[2];
  } else if (match[3] !== undefined) {
    title = match[3].trim();
  }

  return {
    type,
    title,
    marker: match[0],
  };
}

export function getAlertTitle(alertData: AlertData): string {
  if (alertData.title === null) {
    return DEFAULT_ALERT_TITLES[alertData.type] ?? alertData.type.charAt(0) + alertData.type.slice(1).toLowerCase();
  }

  return alertData.title;
}

export function shouldRenderAlertTitle(alertData: AlertData): boolean {
  return alertData.title !== '';
}

function stripAlertMarkerFromParagraph(paragraph: BlockNode, parsed: { marker: string }): void {
  const content = paragraph.stringContent ?? '';
  const lines = content.split('\n');
  const firstLine = lines[0] ?? '';
  const markerIndex = firstLine.indexOf(parsed.marker);

  if (markerIndex === -1) {
    return;
  }

  const restOfFirstLine = firstLine.slice(markerIndex + parsed.marker.length);
  const remainingLines = [...(restOfFirstLine ? [restOfFirstLine] : []), ...lines.slice(1)];
  paragraph.stringContent = remainingLines.join('\n');

  if (paragraph.sourcepos) {
    paragraph.sourcepos[0][1] += markerIndex + parsed.marker.length;
  }
  if (paragraph.lineOffsets) {
    paragraph.lineOffsets[0] += markerIndex + parsed.marker.length;
  }
}

export function alertBlockQuoteFinalize(_: Parser, block: BlockQuoteNode): void {
  const firstChild = block.firstChild;
  if (!firstChild || firstChild.type !== 'paragraph') {
    return;
  }

  const paragraph = firstChild as BlockNode;
  const content = paragraph.stringContent;
  if (!content) {
    return;
  }

  const firstLine = content.split('\n')[0] ?? '';
  const parsed = parseAlertMarker(firstLine);
  if (!parsed) {
    return;
  }

  block.alertData = {
    type: parsed.type,
    title: parsed.title,
  };

  stripAlertMarkerFromParagraph(paragraph, parsed);

  if (!paragraph.stringContent?.trim()) {
    paragraph.unlink();
  }
}
