import type { CommandId } from '../../commands/types.js';
import boldSvg from './assets/bold.svg?raw';
import codeSvg from './assets/code.svg?raw';
import linkSvg from './assets/link.svg?raw';
import tableSvg from './assets/table.svg?raw';
import blockquoteSvg from './assets/blockquote.svg?raw';
import strikeSvg from './assets/strike.svg?raw';
import bulletListSvg from './assets/bullet-list.svg?raw';
import headingSvg from './assets/heading.svg?raw';
import italicSvg from './assets/italic.svg?raw';
import orderedListSvg from './assets/ordered-list.svg?raw';
import checkboxSvg from './assets/checkbox.svg?raw';
import horizontalRuleSvg from './assets/horizontal-rule.svg?raw';
import { createSvgFromAsset } from './svg-asset-icon.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const STROKE = 'currentColor';
const ICON_SIZE = 20;
const CENTER = ICON_SIZE / 2;
const GLYPH_Y = 14.8;
const GLYPH_FONT = 15;
const GLYPH_FONT_COMPACT = 13.5;
const FONT =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

type IconRenderer = () => SVGSVGElement;

interface GlyphOptions {
  x?: number;
  y?: number;
  fontSize?: number;
  fontWeight?: number | string;
  fontStyle?: string;
  anchor?: 'start' | 'middle' | 'end';
  letterSpacing?: number;
}

function createSvgIcon(markup: string): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${ICON_SIZE} ${ICON_SIZE}`);
  svg.setAttribute('width', String(ICON_SIZE));
  svg.setAttribute('height', String(ICON_SIZE));
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('class', 'toastwrite-editor-toolbar-icon toastwrite-editor-toolbar-icon-svg');
  svg.innerHTML = markup;
  return svg;
}

function svgGlyph(label: string, options: GlyphOptions = {}): string {
  const {
    x = CENTER,
    y = GLYPH_Y,
    fontSize = GLYPH_FONT,
    fontWeight = 600,
    fontStyle = 'normal',
    anchor = 'middle',
    letterSpacing,
  } = options;

  const attrs = [
    `x="${x}"`,
    `y="${y}"`,
    `fill="${STROKE}"`,
    `font-family="${FONT}"`,
    `font-size="${fontSize}"`,
    `font-weight="${fontWeight}"`,
    `font-style="${fontStyle}"`,
    `text-anchor="${anchor}"`,
  ];

  if (letterSpacing !== undefined) {
    attrs.push(`letter-spacing="${letterSpacing}"`);
  }

  return `<text ${attrs.join(' ')}>${label}</text>`;
}

const ICON_RENDERERS: Partial<Record<CommandId, IconRenderer>> = {
  bold: () => createSvgFromAsset(boldSvg),
  italic: () => createSvgFromAsset(italicSvg),
  strike: () => createSvgFromAsset(strikeSvg),
  code: () => createSvgFromAsset(codeSvg),
  codeBlock: () =>
    createSvgIcon(
      svgGlyph('CB', {
        fontSize: GLYPH_FONT_COMPACT,
        fontWeight: 700,
        letterSpacing: -0.25,
      })
    ),
  hr: () => createSvgFromAsset(horizontalRuleSvg),
  blockquote: () => createSvgFromAsset(blockquoteSvg),
  bulletList: () => createSvgFromAsset(bulletListSvg),
  orderedList: () => createSvgFromAsset(orderedListSvg),
  taskList: () => createSvgFromAsset(checkboxSvg),
  link: () => createSvgFromAsset(linkSvg),
  table: () => createSvgFromAsset(tableSvg),
};

export function createToolbarIcon(commandId: CommandId): SVGSVGElement | null {
  const render = ICON_RENDERERS[commandId];
  if (!render) {
    return null;
  }

  const icon = render();
  icon.classList.add(`toastwrite-editor-toolbar-icon-${commandId}`);
  return icon;
}

export function createHeadingIcon(): SVGSVGElement {
  const icon = createSvgFromAsset(headingSvg);
  icon.classList.add('toastwrite-editor-toolbar-icon-heading');
  return icon;
}
